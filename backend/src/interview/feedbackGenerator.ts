import { InterviewFeedback, InterviewSession, CandidateProfile, InterviewMode } from '../models/interfaces';
import { LLMService } from '../services/llmService';
import { PromptTemplates } from '../prompts/promptTemplates';

export class FeedbackGenerator {
  public static async generate(session: InterviewSession): Promise<InterviewFeedback> {
    const cvProfile = session.cvProfile;
    const mode = session.interviewMode;

    const transcript = session.messages
      .filter(m => m.role !== 'system')
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n');

    if (cvProfile && transcript) {
      try {
        const systemPrompt = `You are a Principal AI Technical & HR Interview Evaluator (like Claude 3.5 / GPT-4o).
Analyze the candidate's interview transcript rigorously against their CV.

RULES:
- Evaluate technical depth, accuracy, specificity, and communication clarity.
- BE STRICT: If the candidate gave short, generic, evasive, or incorrect answers, assign LOW scores (15-45) and explicitly list weaknesses and misconceptions.
- DO NOT give default high scores to brief or vague answers.
- Base strengths and weaknesses ONLY on what the candidate actually said in the transcript.
- Return ONLY valid JSON (no markdown fences, no text outside JSON).`;

        const userPrompt = PromptTemplates.getEvaluationPrompt(cvProfile, mode, transcript, session.breethMemory);

        const llmRes = await LLMService.generateCompletion(systemPrompt, userPrompt, 1200);

        if (llmRes.content && llmRes.content.trim()) {
          let jsonStr = llmRes.content.trim();
          jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
          const parsed = JSON.parse(jsonStr);

          if (typeof parsed.technicalScore === 'number') {
            return {
              technicalScore: Math.min(100, Math.max(0, parsed.technicalScore)),
              communicationScore: Math.min(100, Math.max(0, parsed.communicationScore)),
              problemSolvingScore: Math.min(100, Math.max(0, parsed.problemSolvingScore)),
              confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore)),
              cvClaimVerificationScore: Math.min(100, Math.max(0, parsed.cvClaimVerificationScore ?? 80)),
              cvInconsistencies: Array.isArray(parsed.cvInconsistencies) ? parsed.cvInconsistencies : [],
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
              weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
              misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [],
              topicsCovered: Array.isArray(parsed.topicsCovered) ? parsed.topicsCovered : (session.timedQuestions?.map(q => q.topic) || []),
              recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
              suggestedRevisions: Array.isArray(parsed.suggestedRevisions) ? parsed.suggestedRevisions : [],
              overallSummary: parsed.overallSummary || '',
              modeSpecificNote: parsed.modeSpecificNote || ''
            };
          }
        }
      } catch (err: any) {
        console.error('[FeedbackGenerator] LLM evaluation warning:', err.message);
      }
    }

    return FeedbackGenerator.rigorousLocalFeedback(session);
  }

  private static rigorousLocalFeedback(session: InterviewSession): InterviewFeedback {
    const cv = session.cvProfile;
    const mode = session.interviewMode;
    const userMsgs = session.messages.filter(m => m.role === 'user');

    if (userMsgs.length === 0) {
      return {
        technicalScore: 20,
        communicationScore: 20,
        problemSolvingScore: 20,
        confidenceScore: 20,
        cvClaimVerificationScore: 30,
        cvInconsistencies: ['Candidate abandoned interview without answering'],
        strengths: ['Started session'],
        weaknesses: ['No answers provided during session'],
        misconceptions: ['Candidate abandoned interview without answering'],
        topicsCovered: session.timedQuestions?.map(q => q.topic) || session.questions.map(q => q.topic),
        recommendations: ['Complete all questions to receive full evaluation'],
        suggestedRevisions: ['Interview preparation'],
        overallSummary: 'The candidate did not provide answers to the interview questions.',
        modeSpecificNote: `Incomplete ${mode} session.`
      };
    }

    const allText = userMsgs.map(m => m.content).join(' ');
    const allWords = allText.toLowerCase().split(/\s+/).filter(Boolean);
    const totalWords = allWords.length;
    const avgWordsPerAnswer = totalWords / userMsgs.length;

    const cvKeywords = [
      ...(cv?.skills || []),
      ...(cv?.programmingLanguages || []),
      ...(cv?.frameworks || []),
      ...(cv?.tools || []),
    ].map(s => s.toLowerCase());

    const matchedKeywords = cvKeywords.filter(kw => allText.toLowerCase().includes(kw));

    const reasoningWords = ['because', 'architecture', 'tradeoff', 'optimization', 'performance', 'scaled', 'implemented', 'configured', 'async', 'database', 'latency', 'concurrency', 'pattern', 'designed', 'tested', 'refactored'];
    const matchedReasoning = reasoningWords.filter(w => allText.toLowerCase().includes(w));

    const evasivePhrases = ['don\'t know', 'dont know', 'not sure', 'idk', 'no idea', 'maybe', 'yes', 'no', 'ok', 'good', 'fine'];
    const evasiveCount = userMsgs.filter(m => {
      const txt = m.content.toLowerCase().trim();
      return txt.length < 15 || evasivePhrases.some(p => txt.includes(p));
    }).length;

    const evasiveRatio = evasiveCount / userMsgs.length;

    let baseScore = 40;

    if (avgWordsPerAnswer > 60) baseScore += 25;
    else if (avgWordsPerAnswer > 35) baseScore += 15;
    else if (avgWordsPerAnswer < 15) baseScore -= 15;

    baseScore += Math.min(20, matchedKeywords.length * 4);
    baseScore += Math.min(15, matchedReasoning.length * 3);
    baseScore -= Math.round(evasiveRatio * 35);

    const technicalScore = Math.min(95, Math.max(18, Math.round(baseScore)));
    const communicationScore = Math.min(95, Math.max(22, Math.round(baseScore * 0.9 + (avgWordsPerAnswer > 30 ? 10 : 0))));
    const problemSolvingScore = Math.min(95, Math.max(15, Math.round(baseScore * 0.85 + matchedReasoning.length * 4)));
    const confidenceScore = Math.min(95, Math.max(20, Math.round(75 - evasiveRatio * 45)));

    const strengths: string[] = [];
    if (matchedKeywords.length > 0) {
      strengths.push(`Demonstrated knowledge of CV technologies: ${matchedKeywords.slice(0, 3).join(', ')}.`);
    }
    if (matchedReasoning.length > 0) {
      strengths.push(`Articulated technical reasoning using terms like ${matchedReasoning.slice(0, 2).join(', ')}.`);
    }
    if (avgWordsPerAnswer > 40) {
      strengths.push('Provided structured, detailed responses with good communication flow.');
    }
    if (strengths.length === 0) {
      strengths.push('Attempted to answer interview questions.');
    }

    const weaknesses: string[] = [];
    if (evasiveRatio > 0.3) {
      weaknesses.push(`Gave brief or evasive answers to ${evasiveCount} out of ${userMsgs.length} questions.`);
    }
    if (matchedKeywords.length === 0 && cvKeywords.length > 0) {
      weaknesses.push(`Failed to mention core CV technologies (${cvKeywords.slice(0, 3).join(', ')}) in responses.`);
    }
    if (avgWordsPerAnswer < 25) {
      weaknesses.push('Responses lacked depth, concrete examples, and technical elaboration.');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('Could further elaborate on edge case handling and multi-node scalability.');
    }

    const misconceptions: string[] = [];
    if (evasiveRatio > 0.4) {
      misconceptions.push('Struggled to articulate hands-on experience for primary CV claims.');
    }
    if (matchedReasoning.length === 0) {
      misconceptions.push('Omitted architectural trade-offs and performance considerations.');
    }

    const recommendations: string[] = [
      `Practice explaining ${matchedKeywords[0] || cvKeywords[0] || 'technical projects'} using the STAR method (Situation, Task, Action, Result).`,
      'Include concrete metrics, design trade-offs, and failure recovery strategies in responses.'
    ];

    const overallSummary = evasiveRatio > 0.4
      ? `The candidate completed ${userMsgs.length} exchanges in '${mode}' mode. Responses were brief or evasive (avg ${Math.round(avgWordsPerAnswer)} words/answer), demonstrating limited technical depth for stated CV skills.`
      : `The candidate completed ${userMsgs.length} exchanges in '${mode}' mode with an average response length of ${Math.round(avgWordsPerAnswer)} words. Technical alignment score: ${technicalScore}/100.`;

    const topicsCovered = session.timedQuestions && session.timedQuestions.length > 0
      ? Array.from(new Set(session.timedQuestions.map(q => q.topic)))
      : session.questions.map(q => q.topic);

    return {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      confidenceScore,
      cvClaimVerificationScore: Math.min(95, Math.max(30, Math.round(technicalScore * 0.9))),
      cvInconsistencies: evasiveRatio > 0.4 ? ['Incomplete or evasive responses for CV skills'] : [],
      strengths,
      weaknesses,
      misconceptions,
      topicsCovered,
      recommendations,
      suggestedRevisions: cvKeywords.slice(0, 3),
      overallSummary,
      modeSpecificNote: `Evaluated across ${mode} interview criteria with ${matchedKeywords.length} verified CV skill matches.`
    };
  }
}
