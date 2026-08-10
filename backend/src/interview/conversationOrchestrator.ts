import {
  InterviewSession,
  DifficultyLevel,
  Question
} from '../models/interfaces';
import { LLMService } from '../services/llmService';
import { PromptTemplates } from '../prompts/promptTemplates';
import { TURN_DECISION_SCHEMA, DIFFICULTY_ORDER, TurnDecision, ClaimVerification } from './schemas';
import { RepetitionGuard } from './repetitionGuard';
import { CoverageTracker } from './coverageTracker';

export interface OrchestratedTurnResult {
  evaluation: {
    quality: 'correct' | 'mostly_correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'insufficient_evidence';
    technicalDepth: number;
    communication: number;
    confidence: number;
    missingInfo?: string;
    misconception?: string;
    strength?: string;
    claimVerification: ClaimVerification;
    contradictsCv: boolean;
    contradictionDetail?: string;
  };
  decision: {
    type: 'FOLLOW_UP' | 'NEW_TOPIC' | 'CLOSE_INTERVIEW';
    difficulty: DifficultyLevel;
    topic: string;
    reasoning?: string;
  };
  acknowledgement: string;
  question: string;
  fullResponseText: string;
  source: 'gemini' | 'local-fallback';
}

export class ConversationOrchestrator {
  private static readonly HYSTERESIS_THRESHOLD = 2;
  private static readonly MIN_QUESTIONS_BEFORE_CLOSE = 8;

  public static async processTurn(
    session: InterviewSession,
    lastAnswer: string,
    currentQuestion: Question,
    breethMemoryContext?: string,
    repetitionGuard?: RepetitionGuard,
    coverageTracker?: CoverageTracker
  ): Promise<OrchestratedTurnResult> {
    const trimmed = lastAnswer.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const questionsAskedCount = session.questionsAsked.length;

    // Bug 3: Handling skipped or empty answers
    if (!trimmed || trimmed === '[Question Not Attempted]' || wordCount === 0) {
      return {
        evaluation: {
          quality: 'insufficient_evidence',
          technicalDepth: 1,
          communication: 1,
          confidence: 1,
          claimVerification: 'not_applicable',
          contradictsCv: false
        },
        decision: {
          type: 'NEW_TOPIC',
          difficulty: session.difficulty,
          topic: currentQuestion.topic,
          reasoning: 'Candidate skipped or did not attempt the question.'
        },
        acknowledgement: "No worries — let's move to a different area.",
        question: '',
        fullResponseText: "No worries — let's move to a different area.",
        source: 'local-fallback'
      };
    }

    const { systemPrompt, userPrompt } = ConversationOrchestrator.buildPrompts(
      session, trimmed, wordCount, currentQuestion, breethMemoryContext, coverageTracker, questionsAskedCount, null
    );

    let decision: TurnDecision | null = null;
    let source: 'gemini' | 'local-fallback' = 'local-fallback';

    try {
      const llmRes = await LLMService.generateStructuredCompletion(systemPrompt, userPrompt, TURN_DECISION_SCHEMA, 500);
      if (llmRes.provider === 'gemini' && llmRes.content) {
        decision = JSON.parse(llmRes.content) as TurnDecision;
        source = 'gemini';
      } else {
        session.usedFallbackTurns = (session.usedFallbackTurns || 0) + 1;
        session.lastFallbackReason = llmRes.error || 'Gemini provider returned local fallback';
        console.warn(`[ConversationOrchestrator] Gemini call fallback: ${session.lastFallbackReason}`);
      }
    } catch (err: any) {
      session.usedFallbackTurns = (session.usedFallbackTurns || 0) + 1;
      session.lastFallbackReason = err.message;
      console.warn('[ConversationOrchestrator] Gemini call failed:', err.message);
    }

    if (decision && repetitionGuard && decision.question && repetitionGuard.isDuplicate(decision.question)) {
      console.warn('[ConversationOrchestrator] Duplicate question detected — retrying.');
      try {
        const { systemPrompt: sp2, userPrompt: up2 } = ConversationOrchestrator.buildPrompts(
          session, trimmed, wordCount, currentQuestion, breethMemoryContext, coverageTracker, questionsAskedCount, decision.question
        );
        const retryRes = await LLMService.generateStructuredCompletion(sp2, up2, TURN_DECISION_SCHEMA, 500);
        if (retryRes.provider === 'gemini' && retryRes.content) {
          decision = JSON.parse(retryRes.content) as TurnDecision;
        }
      } catch (err: any) {
        console.warn('[ConversationOrchestrator] Retry failed:', err.message);
      }
    }

    if (decision) {
      decision.question = ConversationOrchestrator.sanitizeQuestion(decision.question);
      // Never allow CLOSE_INTERVIEW before the minimum, regardless of what the
      // model proposes — this is enforced in code, not trusted from the model.
      if (decision.decision.type === 'CLOSE_INTERVIEW' && questionsAskedCount < ConversationOrchestrator.MIN_QUESTIONS_BEFORE_CLOSE) {
        decision.decision.type = 'NEW_TOPIC';
      }
    }

    const resolvedDifficulty = ConversationOrchestrator.applyHysteresis(
      session, decision?.decision?.difficulty ?? session.difficulty
    );

    if (!decision) {
      return ConversationOrchestrator.intelligentLocalTurn(session, trimmed, wordCount, currentQuestion, resolvedDifficulty);
    }

    const acknowledgement = decision.acknowledgement || ConversationOrchestrator.buildDefaultAcknowledgement(trimmed, currentQuestion.topic);
    const question = decision.decision.type === 'CLOSE_INTERVIEW' ? '' : (decision.question || currentQuestion.promptText);
    const fullResponseText = question ? `${acknowledgement}\n\n${question}` : acknowledgement;

    return {
      evaluation: {
        quality: decision.evaluation?.quality || 'mostly_correct',
        technicalDepth: ConversationOrchestrator.clampScore(decision.evaluation?.technicalDepth),
        communication: ConversationOrchestrator.clampScore(decision.evaluation?.communication),
        confidence: ConversationOrchestrator.clampScore(decision.evaluation?.confidence),
        missingInfo: decision.evaluation?.missingInfo || undefined,
        misconception: decision.evaluation?.misconception || undefined,
        strength: decision.evaluation?.strength || undefined,
        claimVerification: decision.evaluation?.claimVerification || 'not_applicable',
        contradictsCv: Boolean(decision.evaluation?.contradictsCv),
        contradictionDetail: decision.evaluation?.contradictionDetail || undefined
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

  private static buildPrompts(
    session: InterviewSession,
    answer: string,
    wordCount: number,
    currentQuestion: Question,
    breethMemoryContext: string | undefined,
    coverageTracker: CoverageTracker | undefined,
    questionsAskedCount: number,
    rejectedQuestion: string | null
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `${PromptTemplates.getSystemPrompt(session.cvProfile!, session.interviewMode, session.breethMemory)}\n\n${breethMemoryContext || ''}`;

    const coverageBlock = coverageTracker
      ? `\nCOVERAGE STATUS:\nCovered topics: ${coverageTracker.getCoveredTopics().join(', ') || 'none yet'}\nUncovered topics: ${coverageTracker.getUncoveredTopics().join(', ') || 'none — all key CV areas covered'}\nQuestions asked so far: ${questionsAskedCount}`
      : '';

    const rejectionBlock = rejectedQuestion
      ? `\nYour previous proposed question ("${rejectedQuestion}") was too similar to one already asked. Generate a substantively different question.`
      : '';

    const userPrompt = `${PromptTemplates.getFollowUpPrompt(
      session.cvProfile!, session.interviewMode, currentQuestion, answer, session.difficulty, session.breethMemory
    )}${coverageBlock}${rejectionBlock}`;

    return { systemPrompt, userPrompt };
  }

  private static applyHysteresis(session: InterviewSession, modelSuggestedDifficulty: DifficultyLevel): DifficultyLevel {
    const current = session.difficulty;
    const history = session.evaluationMetrics?.technicalScores || [];
    if (history.length < 2) return current;

    const recent = history.slice(-2);
    const avgRecent = (recent[0] + recent[1]) / 2;

    const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(current);

    if (avgRecent >= 4.5 && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    if (avgRecent <= 1.5 && currentIndex > 0) {
      return levels[currentIndex - 1];
    }
    return current;
  }

  private static clampScore(value: unknown): number {
    const n = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (isNaN(n)) return 3;
    return Math.max(1, Math.min(5, n));
  }

  private static sanitizeQuestion(question: string): string {
    if (!question) return question;
    return question.split('?')[0].includes('?') ? question : question;
  }

  private static buildDefaultAcknowledgement(answer: string, topic: string): string {
    return answer.length < 20
      ? `I'd like to understand your experience with ${topic} in more detail.`
      : `That gives me some context on your approach to ${topic}.`;
  }

  private static intelligentLocalTurn(
    session: InterviewSession,
    answer: string,
    wordCount: number,
    currentQuestion: Question,
    difficulty: DifficultyLevel
  ): OrchestratedTurnResult {
    const isShort = wordCount < 15;
    const topicLabel = currentQuestion.displayFact || currentQuestion.topic;
    const acknowledgement = isShort
      ? `That's a brief response — I'd like a bit more detail on ${topicLabel}.`
      : `That covers the main point on ${topicLabel}. Let's continue.`;
    const question = isShort
      ? `Could you go into more detail on ${topicLabel}?`
      : currentQuestion.promptText;

    return {
      evaluation: {
        quality: isShort ? 'unclear' : 'mostly_correct',
        technicalDepth: 2,
        communication: isShort ? 2 : 3,
        confidence: 3,
        claimVerification: 'not_applicable',
        contradictsCv: false
      },
      decision: {
        type: isShort ? 'FOLLOW_UP' : 'NEW_TOPIC',
        difficulty,
        topic: currentQuestion.topic
      },
      acknowledgement,
      question,
      fullResponseText: `${acknowledgement}\n\n${question}`,
      source: 'local-fallback'
    };
  }
}
