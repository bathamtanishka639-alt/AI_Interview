import {
  CandidateProfile,
  DifficultyLevel,
  InterviewMode,
  InterviewSession,
  Question
} from '../models/interfaces';
import { LLMService } from '../services/llmService';
import { PromptTemplates } from '../prompts/promptTemplates';
import { TURN_DECISION_SCHEMA, DIFFICULTY_ORDER, TurnDecision } from './schemas';
import { RepetitionGuard } from './repetitionGuard';

export interface OrchestratedTurnResult {
  evaluation: {
    quality: 'correct' | 'mostly_correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'insufficient_evidence';
    technicalDepth: number;
    communication: number;
    confidence: number;
    missingInfo?: string;
    misconception?: string;
    strength?: string;
  };
  decision: {
    type: 'FOLLOW_UP' | 'NEW_TOPIC';
    difficulty: DifficultyLevel;
    topic: string;
    reasoning?: string;
  };
  acknowledgement: string;
  question: string;
  fullResponseText: string;
  source: 'gemini' | 'local-fallback';
}

/**
 * ConversationOrchestrator
 *
 * Implements the "evaluate → decide → respond" pipeline as a SINGLE Gemini
 * API call using native structured output (responseSchema). The model cannot
 * emit a natural-language response until it has completed the structured
 * reasoning object — this is the architectural fix, not a prompt fix.
 *
 * Additional deterministic post-processing:
 *  1. Hysteresis: difficulty can only change by 1 level per turn, and
 *     requires 2 consecutive signals in the same direction.
 *  2. Repetition check: if the generated question is a duplicate,
 *     the orchestrator retries once (with explicit anti-repeat instructions).
 *  3. Single-question enforcement: the question field is stripped of any
 *     bullet lists or multi-question patterns.
 */
export class ConversationOrchestrator {
  /**
   * Maximum consecutive turns in the same direction before difficulty changes.
   * Hysteresis prevents rapid oscillation on noisy answers.
   */
  private static readonly HYSTERESIS_THRESHOLD = 2;

  public static async processTurn(
    session: InterviewSession,
    lastAnswer: string,
    currentQuestion: Question,
    breethMemoryContext?: string,
    repetitionGuard?: RepetitionGuard
  ): Promise<OrchestratedTurnResult> {
    const trimmed = lastAnswer.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

    // ── 1. Build prompts ──────────────────────────────────────────────────
    const { systemPrompt, userPrompt } = ConversationOrchestrator.buildPrompts(
      session,
      trimmed,
      wordCount,
      currentQuestion,
      breethMemoryContext,
      null
    );

    // ── 2. Single structured API call (evaluate → decide → respond) ────────
    let decision: TurnDecision | null = null;
    let source: 'gemini' | 'local-fallback' = 'local-fallback';

    try {
      const llmRes = await LLMService.generateStructuredCompletion(
        systemPrompt,
        userPrompt,
        TURN_DECISION_SCHEMA,
        700
      );

      if (llmRes.provider === 'gemini' && llmRes.content) {
        decision = JSON.parse(llmRes.content) as TurnDecision;
        source = 'gemini';
      }
    } catch (err: any) {
      console.warn('[ConversationOrchestrator] Structured output parse error:', err.message);
    }

    // ── 3. Repetition check + single retry ────────────────────────────────
    if (decision && repetitionGuard && repetitionGuard.isDuplicate(decision.question)) {
      console.warn('[ConversationOrchestrator] Duplicate question detected — retrying with anti-repeat instruction.');
      try {
        const { systemPrompt: sp2, userPrompt: up2 } =
          ConversationOrchestrator.buildPrompts(
            session,
            trimmed,
            wordCount,
            currentQuestion,
            breethMemoryContext,
            decision.question
          );
        const retryRes = await LLMService.generateStructuredCompletion(
          sp2,
          up2,
          TURN_DECISION_SCHEMA,
          700
        );
        if (retryRes.provider === 'gemini' && retryRes.content) {
          decision = JSON.parse(retryRes.content) as TurnDecision;
        }
      } catch (err: any) {
        console.warn('[ConversationOrchestrator] Retry also failed:', err.message);
      }
    }

    // ── 4. Validate & sanitize the question field ─────────────────────────
    if (decision) {
      decision.question = ConversationOrchestrator.sanitizeQuestion(decision.question);
    }

    // ── 5. Apply hysteresis to difficulty ─────────────────────────────────
    const resolvedDifficulty = ConversationOrchestrator.applyHysteresis(
      session,
      decision?.decision?.difficulty ?? session.difficulty
    );

    // ── 6. Fallback if Gemini failed ──────────────────────────────────────
    if (!decision) {
      return ConversationOrchestrator.intelligentLocalTurn(
        session,
        trimmed,
        wordCount,
        currentQuestion,
        resolvedDifficulty
      );
    }

    // ── 7. Assemble result ─────────────────────────────────────────────────
    const acknowledgement =
      decision.acknowledgement ||
      ConversationOrchestrator.buildDefaultAcknowledgement(trimmed, currentQuestion.topic);
    const question = decision.question || currentQuestion.promptText;
    const fullResponseText = `${acknowledgement}\n\n${question}`;

    return {
      evaluation: {
        quality: decision.evaluation?.quality || 'mostly_correct',
        technicalDepth: ConversationOrchestrator.clampScore(decision.evaluation?.technicalDepth),
        communication: ConversationOrchestrator.clampScore(decision.evaluation?.communication),
        confidence: ConversationOrchestrator.clampScore(decision.evaluation?.confidence),
        missingInfo: decision.evaluation?.missingInfo || undefined,
        misconception: decision.evaluation?.misconception || undefined,
        strength: decision.evaluation?.strength || undefined
      },
      decision: {
        type: decision.decision?.type || (wordCount < 25 ? 'FOLLOW_UP' : 'NEW_TOPIC'),
        difficulty: resolvedDifficulty,
        topic: decision.decision?.topic || currentQuestion.topic,
        reasoning: decision.decision?.reasoning
      },
      acknowledgement,
      question,
      fullResponseText,
      source
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HYSTERESIS ENGINE
  // Difficulty can only shift 1 level per turn and requires 2 consecutive
  // signals in the same direction. This prevents oscillation on noisy answers.
  // ─────────────────────────────────────────────────────────────────────────
  private static applyHysteresis(
    session: InterviewSession,
    modelSuggestedDifficulty: DifficultyLevel
  ): DifficultyLevel {
    const current = session.difficulty;
    const currentRank = DIFFICULTY_ORDER[current] ?? 1;
    const suggestedRank = DIFFICULTY_ORDER[modelSuggestedDifficulty] ?? 1;
    const direction = Math.sign(suggestedRank - currentRank); // -1, 0, +1

    if (direction === 0) return current; // No change requested

    // Read hysteresis counter from session (store in evaluationMetrics as sentinel)
    const metrics = session.evaluationMetrics || { technicalScores: [], communicationScores: [] };
    // Use technicalScores array length as a proxy for consecutive-signal counter
    // We store the streak as a tagged value in the last score slot.
    // Format: streak direction stored as a float — sign = direction, abs = count
    const lastScore = metrics.technicalScores[metrics.technicalScores.length - 1];
    let streak = typeof lastScore === 'number' && isNaN(lastScore) ? 0 : 0;

    // We use a dedicated session property for this
    const s = session as any;
    if (!s._diffHysteresis) {
      s._diffHysteresis = { direction: 0, count: 0 };
    }
    const hyst = s._diffHysteresis;

    if (hyst.direction === direction) {
      hyst.count += 1;
    } else {
      // Direction flipped — reset streak
      hyst.direction = direction;
      hyst.count = 1;
    }

    if (hyst.count >= ConversationOrchestrator.HYSTERESIS_THRESHOLD) {
      // Sufficient consecutive signal — apply ONE level shift
      const newRank = Math.max(0, Math.min(3, currentRank + direction));
      const newDifficulty = Object.keys(DIFFICULTY_ORDER).find(
        k => DIFFICULTY_ORDER[k] === newRank
      ) as DifficultyLevel;
      // Reset streak after applying change
      hyst.count = 0;
      return newDifficulty || current;
    }

    return current; // Hysteresis holds — keep current difficulty
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROMPT BUILDERS
  // ─────────────────────────────────────────────────────────────────────────
  private static buildPrompts(
    session: InterviewSession,
    trimmedAnswer: string,
    wordCount: number,
    currentQuestion: Question,
    breethMemoryContext: string | undefined | null,
    duplicateQuestion: string | null
  ): { systemPrompt: string; userPrompt: string } {
    const cv = session.cvProfile!;
    const mode = session.interviewMode;

    const antiRepeatInstruction = duplicateQuestion
      ? `\n\nCRITICAL: You previously generated the following question which is too similar to one already asked:\n"${duplicateQuestion}"\nYou MUST generate a completely different question on a different aspect of the candidate's CV.`
      : '';

    const systemPrompt = `You are a Principal ${mode.toUpperCase()} Technical Interviewer conducting a real, consequential interview.

PERSONALITY RULES (enforced, not aspirational):
- You are calm, precise, intellectually curious, and professionally direct.
- NEVER use generic cheerleading: no "Great!", "Awesome!", "Excellent!", "Perfect!", "That's a great answer!".
- Acknowledge the candidate's actual answer content specifically. Reference what they said.
- You THINK before you speak. Your structured evaluation is completed before your natural-language response is written.

INTERVIEW RULES:
- Ask exactly ONE question per turn. No multiple questions, no bullet lists.
- Every question must be grounded in the candidate's actual CV — their specific projects, skills, experience.
- Difficulty management is done by the engine. Output your honest assessment of what difficulty SHOULD be next.
- If the answer is very short (< 20 words) or evasive, choose FOLLOW_UP to probe.
- If the topic is sufficiently explored (3+ exchanges), choose NEW_TOPIC.${antiRepeatInstruction}

OUTPUT: You MUST return a valid JSON object matching the schema exactly. No prose outside the JSON.`;

    const questionsAskedList = session.questionsAsked.map(q => `- "${q}"`).join('\n');

    const userPrompt = `CANDIDATE CV:
${PromptTemplates.buildCvContext(cv)}

BREETH SESSION MEMORY:
${breethMemoryContext || 'No prior session history.'}

PREVIOUS QUESTIONS ASKED (DO NOT REPEAT OR CLOSELY REPHRASE THESE):
${questionsAskedList || '(This is the first question)'}

CURRENT QUESTION ASKED: "${currentQuestion.promptText}"
CURRENT QUESTION CV GROUNDING: "${currentQuestion.cvGrounding || currentQuestion.topic}"
CURRENT INTERVIEW DIFFICULTY: ${session.difficulty}
CURRENT QUESTION INDEX: ${session.currentQuestionIndex + 1} of ${session.questions.length}

CANDIDATE'S ANSWER (word count: ${wordCount}):
"${trimmedAnswer}"

Evaluate this answer, decide the next action, and generate the next question. Complete the full structured reasoning object.`;

    return { systemPrompt, userPrompt };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SANITIZERS & HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Strip multiple questions from a single field, keeping only the first.
   * Detects bullet lists, numbered lists, and "? Also, ..." patterns.
   */
  private static sanitizeQuestion(raw: string): string {
    if (!raw) return raw;

    // Remove any bullets/numbered list preamble and keep first item
    const bulletMatch = raw.match(/^[-*•\d.]+\s*(.+?)(?:\n|$)/m);
    if (bulletMatch && bulletMatch[1]) {
      return bulletMatch[1].trim();
    }

    // Split on "? " followed by capital letter (secondary question), keep first
    const parts = raw.split(/\?\s+(?=[A-Z])/);
    if (parts.length > 1 && parts[0].trim()) {
      return parts[0].trim() + '?';
    }

    return raw.trim();
  }

  private static clampScore(score: any): number {
    const n = typeof score === 'number' ? score : parseInt(score, 10);
    if (isNaN(n)) return 3;
    return Math.max(1, Math.min(5, n));
  }

  private static buildDefaultAcknowledgement(text: string, topic: string): string {
    if (text.length > 150) {
      return `Your explanation covers the core aspects of ${topic} in reasonable depth.`;
    }
    if (text.length > 50) {
      return `That gives a useful overview of your approach to ${topic}.`;
    }
    return `I see. That touches on ${topic} at a high level.`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL FALLBACK (used only when Gemini is unavailable)
  // ─────────────────────────────────────────────────────────────────────────
  private static intelligentLocalTurn(
    session: InterviewSession,
    answerText: string,
    wordCount: number,
    currentQ: Question,
    resolvedDifficulty: DifficultyLevel
  ): OrchestratedTurnResult {
    const cv = session.cvProfile!;
    const lower = answerText.toLowerCase();
    const topic = currentQ.cvGrounding || currentQ.topic;

    // Short/evasive answer
    if (
      wordCount < 10 ||
      lower.includes("don't know") ||
      lower.includes("not sure") ||
      lower.includes("idk")
    ) {
      const ack = `I see that ${topic} may not be your primary focus. Let's try a different angle.`;
      const nextQ = `Given your experience with ${cv.skills[0] || 'software development'}, walk me through the most technically complex decision you made in your most recent project and why you made it.`;
      return {
        evaluation: {
          quality: 'insufficient_evidence',
          technicalDepth: 1,
          communication: 2,
          confidence: 1,
          missingInfo: `Did not demonstrate knowledge on ${topic}`
        },
        decision: { type: 'NEW_TOPIC', difficulty: 'beginner', topic: cv.skills[0] || topic },
        acknowledgement: ack,
        question: nextQ,
        fullResponseText: `${ack}\n\n${nextQ}`,
        source: 'local-fallback'
      };
    }

    // Detailed / architectural answer
    if (
      wordCount > 40 ||
      lower.includes('architecture') ||
      lower.includes('tradeoff') ||
      lower.includes('trade-off') ||
      lower.includes('because') ||
      lower.includes('decided to')
    ) {
      const ack = `You've given a solid explanation of the decision-making process around ${topic}.`;
      const nextQ = `Now consider a failure scenario: how would your system or implementation behave under high load or when a dependent service fails?`;
      return {
        evaluation: {
          quality: 'correct',
          technicalDepth: 4,
          communication: 4,
          confidence: 4,
          strength: `Detailed explanation of trade-offs in ${topic}`
        },
        decision: { type: 'FOLLOW_UP', difficulty: resolvedDifficulty, topic },
        acknowledgement: ack,
        question: nextQ,
        fullResponseText: `${ack}\n\n${nextQ}`,
        source: 'local-fallback'
      };
    }

    // Standard / moderate answer
    const ack = `That covers the practical approach to ${topic}.`;
    const nextQ = `How did you handle state management and component communication in your implementation?`;
    return {
      evaluation: {
        quality: 'mostly_correct',
        technicalDepth: 3,
        communication: 3,
        confidence: 3
      },
      decision: { type: 'FOLLOW_UP', difficulty: resolvedDifficulty, topic },
      acknowledgement: ack,
      question: nextQ,
      fullResponseText: `${ack}\n\n${nextQ}`,
      source: 'local-fallback'
    };
  }
}
