import { InterviewFeedback, InterviewSession, CandidateProfile, InterviewMode } from '../models/interfaces';
import { LLMService } from '../services/llmService';
import { PromptTemplates } from '../prompts/promptTemplates';

export class FeedbackGenerator {
  public static async generate(session: InterviewSession): Promise<InterviewFeedback> {
    const cvProfile = session.cvProfile;
    const mode = session.interviewMode;
    const timedLogs = session.timedQuestions || [];
    const userMsgs = session.messages.filter(m => m.role === 'user');
    const validAnswers = timedLogs.filter(q => q.status === 'answered');

    if (userMsgs.length === 0 || validAnswers.length === 0) {
      return FeedbackGenerator.unansweredFeedback(session);
    }

    const transcript = session.messages
      .filter(m => m.role !== 'system')
      .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n');

    if (cvProfile && transcript) {
      try {
        const systemPrompt = `You are a Senior Technical Hiring Manager and Executive Interview Evaluator.
Analyze the candidate's interview performance with absolute truthfulness, objectivity, and professional rigor.

EVALUATION RULES:
1. STRICT TRUTHFUL SCORING:
   - If the candidate gave weak, evasive, brief, or non-technical answers, assign LOW scores (10-35) across technical, communication, and CV claims.
   - DO NOT award scores above 50 unless the candidate provided concrete, correct technical evidence.
2. NO FAKE PRAISE / STRENGTHS:
   - DO NOT invent positive feedback like "Demonstrated technical depth" if answers were missing or poor.
   - Strengths MUST cite specific correct technical points made by the candidate. If none exist, state: "Participated in the interview process."
3. CANDIDATE CV VERIFICATION:
   - Check if candidate's answers substantiated their CV claims. Flag direct contradictions or lack of proof in cvInconsistencies.
4. WEAKNESSES & MISCONCEPTIONS:
   - Detail every missing concept, skipped topic, or technical flaw accurately.
5. Return ONLY valid JSON matching the exact schema (no markdown, no preamble).`;

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
              cvClaimVerificationScore: Math.min(100, Math.max(0, parsed.cvClaimVerificationScore ?? 20)),
              cvInconsistencies: Array.isArray(parsed.cvInconsistencies) ? parsed.cvInconsistencies : [],
              strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Participated in the interview process.'],
              weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ['Failed to elaborate on key technical requirements.'],
              misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [],
              topicsCovered: Array.isArray(parsed.topicsCovered) ? parsed.topicsCovered : (timedLogs.map(q => q.topic) || []),
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

  private static unansweredFeedback(session: InterviewSession): InterviewFeedback {
    const mode = session.interviewMode;
    const timedLogs = session.timedQuestions || [];
    const topics = timedLogs.map(q => q.topic);

    return {
      technicalScore: 0,
      communicationScore: 0,
      problemSolvingScore: 0,
      confidenceScore: 0,
      cvClaimVerificationScore: 0,
      cvInconsistencies: ['Candidate provided no valid answers during the interview session'],
      strengths: ['Initiated interview session'],
      weaknesses: [
        'Candidate did not attempt or answer any of the interview questions presented.',
        'Unable to verify any technical skills, experience, or CV claims.'
      ],
      misconceptions: ['Candidate skipped or submitted empty/evasive responses for all questions.'],
      topicsCovered: topics.length > 0 ? topics : session.questions.map(q => q.topic),
      recommendations: [
        'Review core technical topics before starting the interview.',
        'Ensure sufficient time and focus to complete all interview questions.'
      ],
      suggestedRevisions: session.cvProfile?.skills?.slice(0, 3) || ['Technical preparation'],
      overallSummary: 'The candidate did not answer any questions during the session. Overall performance score: 0/100.',
      modeSpecificNote: `Incomplete ${mode} session with 0 questions answered.`
    };
  }

  private static rigorousLocalFeedback(session: InterviewSession): InterviewFeedback {
    const cv = session.cvProfile;
    const mode = session.interviewMode;
    const userMsgs = session.messages.filter(m => m.role === 'user');
    const timedLogs = session.timedQuestions || [];
    const validAnswers = timedLogs.filter(q => q.status === 'answered');

    if (userMsgs.length === 0 || validAnswers.length === 0) {
      return FeedbackGenerator.unansweredFeedback(session);
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

    const matchedKeywords = cvKeywords.filter(kw => kw && allText.toLowerCase().includes(kw));

    const reasoningWords = ['because', 'architecture', 'tradeoff', 'optimization', 'performance', 'scaled', 'implemented', 'configured', 'async', 'database', 'latency', 'concurrency', 'pattern', 'designed', 'tested', 'refactored'];
    const matchedReasoning = reasoningWords.filter(w => allText.toLowerCase().includes(w));

    const evasivePhrases = ["don't know", 'dont know', 'not sure', 'idk', 'no idea', 'maybe', 'yes', 'no', 'ok', 'good', 'fine', 'skip', 'pass'];
    const evasiveCount = userMsgs.filter(m => {
      const txt = m.content.toLowerCase().trim();
      return txt.length < 15 || evasivePhrases.some(p => txt.includes(p));
    }).length;

    const evasiveRatio = evasiveCount / userMsgs.length;

    let baseScore = 30;

    if (avgWordsPerAnswer > 60) baseScore += 25;
    else if (avgWordsPerAnswer > 35) baseScore += 15;
    else if (avgWordsPerAnswer < 15) baseScore -= 15;

    baseScore += Math.min(20, matchedKeywords.length * 4);
    baseScore += Math.min(15, matchedReasoning.length * 3);
    baseScore -= Math.round(evasiveRatio * 30);

    const technicalScore = Math.min(95, Math.max(5, Math.round(baseScore)));
    const communicationScore = Math.min(95, Math.max(10, Math.round(baseScore * 0.9 + (avgWordsPerAnswer > 30 ? 10 : 0))));
    const problemSolvingScore = Math.min(95, Math.max(5, Math.round(baseScore * 0.85 + matchedReasoning.length * 4)));
    const confidenceScore = Math.min(95, Math.max(10, Math.round(75 - evasiveRatio * 50)));

    const strengths: string[] = [];
    if (matchedKeywords.length > 0) {
      strengths.push(`Mentioned CV technologies: ${matchedKeywords.slice(0, 3).join(', ')}.`);
    }
    if (matchedReasoning.length > 0) {
      strengths.push(`Used technical terms such as ${matchedReasoning.slice(0, 2).join(', ')}.`);
    }
    if (avgWordsPerAnswer > 40) {
      strengths.push('Provided structured responses with reasonable length.');
    }
    if (strengths.length === 0) {
      strengths.push('Participated in the interview questions.');
    }

    const weaknesses: string[] = [];
    if (evasiveRatio > 0.3) {
      weaknesses.push(`Gave brief or uninformative answers to ${evasiveCount} out of ${userMsgs.length} questions.`);
    }
    if (matchedKeywords.length === 0 && cvKeywords.length > 0) {
      weaknesses.push(`Failed to demonstrate practical experience in CV skills (${cvKeywords.slice(0, 3).join(', ')}).`);
    }
    if (avgWordsPerAnswer < 25) {
      weaknesses.push('Responses lacked technical depth, examples, and architectural reasoning.');
    }
    if (weaknesses.length === 0) {
      weaknesses.push('Could provide deeper technical detail on production trade-offs.');
    }

    const misconceptions: string[] = [];
    if (evasiveRatio > 0.4) {
      misconceptions.push('Unable to substantiate claimed CV expertise during technical probing.');
    }
    if (matchedReasoning.length === 0) {
      misconceptions.push('Omitted architectural trade-offs and performance considerations.');
    }

    const recommendations: string[] = [
      `Practice explaining ${matchedKeywords[0] || cvKeywords[0] || 'projects'} with specific technical details using the STAR framework.`,
      'Include concrete design trade-offs and operational metrics in responses.'
    ];

    const overallSummary = evasiveRatio > 0.4
      ? `The candidate completed ${userMsgs.length} questions in '${mode}' mode. Most responses were brief or evasive (avg ${Math.round(avgWordsPerAnswer)} words/answer), showing minimal technical depth for CV claims.`
      : `The candidate completed ${userMsgs.length} questions in '${mode}' mode with an average response length of ${Math.round(avgWordsPerAnswer)} words. Technical alignment score: ${technicalScore}/100.`;

    const topicsCovered = timedLogs.length > 0
      ? Array.from(new Set(timedLogs.map(q => q.topic)))
      : session.questions.map(q => q.topic);

    return {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      confidenceScore,
      cvClaimVerificationScore: Math.min(95, Math.max(10, Math.round(technicalScore * 0.9))),
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
