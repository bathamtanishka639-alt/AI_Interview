import { CandidateProfile, InterviewMode, Question, DifficultyLevel, InterviewSession } from '../models/interfaces';
import { LLMService } from '../services/llmService';
import { PromptTemplates } from '../prompts/promptTemplates';

export class FollowUpGenerator {
  /**
   * Generates CV-grounded, mode-aware follow-up questions linked to Breeth memory.
   */
  public static async generateFollowUp(
    lastCandidateAnswer: string,
    currentQuestion: Question,
    difficulty: DifficultyLevel,
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    breethMemory?: InterviewSession['breethMemory']
  ): Promise<{ nextPrompt: string; updatedDifficulty: DifficultyLevel; evaluation: string }> {
    const trimmed = lastCandidateAnswer.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    let updatedDifficulty = difficulty;

    // Adaptive difficulty tuning based on real answer signals
    if (wordCount > 60 && (trimmed.toLowerCase().includes('because') || trimmed.toLowerCase().includes('architecture'))) {
      if (difficulty === 'beginner') updatedDifficulty = 'intermediate';
      else if (difficulty === 'intermediate') updatedDifficulty = 'advanced';
    } else if (wordCount < 15 || trimmed.toLowerCase().includes("don't know")) {
      if (difficulty === 'advanced') updatedDifficulty = 'intermediate';
      else if (difficulty === 'expert') updatedDifficulty = 'advanced';
    }

    const memorySnippet = breethMemory?.weaknesses?.length
      ? `NOTE: Historical Breeth memory shows candidate previously struggled with: [${breethMemory.weaknesses.join(', ')}]. If relevant, probe if they addressed it.`
      : '';

    const systemPrompt = `You are a Principal ${mode.toUpperCase()} Interviewer.
Evaluate the candidate's answer and generate a probing technical follow-up question.
${memorySnippet}

RULES:
- If answer is brief/evasive: challenge them specifically on what was missing.
- If answer is strong: ask about scale, edge cases, or trade-offs.
- Ground the question in their CV profile (${cvProfile.skills.slice(0, 3).join(', ')}).
- Return ONLY 1-2 sentences of interviewer dialog. No markdown formatting, no metadata.`;

    const userPrompt = PromptTemplates.getFollowUpPrompt(cvProfile, mode, currentQuestion, lastCandidateAnswer, updatedDifficulty, breethMemory);

    try {
      const llmRes = await LLMService.generateCompletion(systemPrompt, userPrompt, 300);

      if (llmRes.content && llmRes.content.trim()) {
        const evaluation = wordCount > 40 ? 'detailed' : wordCount > 15 ? 'moderate' : 'brief';
        return {
          nextPrompt: llmRes.content.trim().replace(/^["']|["']$/g, ''),
          updatedDifficulty,
          evaluation
        };
      }
    } catch (err: any) {
      console.warn('[FollowUpGenerator] LLM warning:', err.message);
    }

    // Dynamic Intelligent Local Generator (analyzes answer text & CV facts)
    return FollowUpGenerator.intelligentLocalFollowUp(trimmed, wordCount, currentQuestion, updatedDifficulty, cvProfile, mode, breethMemory);
  }

  private static intelligentLocalFollowUp(
    answerText: string,
    wordCount: number,
    currentQuestion: Question,
    updatedDifficulty: DifficultyLevel,
    cv: CandidateProfile,
    mode: InterviewMode,
    breethMemory?: InterviewSession['breethMemory']
  ): { nextPrompt: string; updatedDifficulty: DifficultyLevel; evaluation: string } {
    const cvFact = currentQuestion.cvGrounding || currentQuestion.topic;
    const lowerText = answerText.toLowerCase();

    // Check if past Breeth weakness exists
    if (breethMemory?.weaknesses?.length) {
      const pastWeakness = breethMemory.weaknesses[0];
      return {
        nextPrompt: `In your previous Breeth session evaluation, you had gaps around ${pastWeakness}. In your response regarding ${cvFact}, how have you refined your approach to address that specific weakness?`,
        updatedDifficulty,
        evaluation: 'retesting-weakness'
      };
    }

    // Case A: Very short or evasive answer
    if (wordCount < 15 || lowerText.includes("don't know") || lowerText.includes("not sure") || lowerText.includes("idk")) {
      const altSkill = cv.skills.find(s => !currentQuestion.topic.toLowerCase().includes(s.toLowerCase())) || cv.programmingLanguages[0] || 'your core stack';
      return {
        nextPrompt: `That response is quite brief. As a ${mode} interviewer, I need to understand your practical depth. How specifically did you use ${cvFact} or ${altSkill} in your projects, and what trade-offs did you make?`,
        updatedDifficulty: 'beginner',
        evaluation: 'evasive'
      };
    }

    // Case B: Technical keyword matching
    const matchedSkill = cv.skills.find(s => lowerText.includes(s.toLowerCase())) ||
      cv.programmingLanguages.find(p => lowerText.includes(p.toLowerCase())) ||
      cv.frameworks.find(f => lowerText.includes(f.toLowerCase()));

    if (matchedSkill) {
      return {
        nextPrompt: `You highlighted your experience with ${matchedSkill}. When implementing that in ${cvFact}, how did you optimize for high-throughput concurrency and handle unexpected component failures?`,
        updatedDifficulty,
        evaluation: 'detailed'
      };
    }

    // Case C: Mode-specific dynamic follow-ups
    if (mode === 'technical') {
      return {
        nextPrompt: `Building on your point regarding ${cvFact}, what specific bottlenecks or memory leaks did you encounter during implementation, and how did you debug them?`,
        updatedDifficulty,
        evaluation: 'moderate'
      };
    } else if (mode === 'hr' || mode === 'behavioral') {
      return {
        nextPrompt: `That gives good context. Looking back at that experience with ${cvFact}, what was the biggest technical disagreement within your team, and how did you resolve it?`,
        updatedDifficulty,
        evaluation: 'moderate'
      };
    }

    return {
      nextPrompt: `That is a solid perspective on ${cvFact}. How would you adapt this solution if system load increased by 10x or if operating in a distributed environment?`,
      updatedDifficulty,
      evaluation: 'moderate'
    };
  }
}
