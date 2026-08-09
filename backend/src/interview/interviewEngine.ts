import {
  InterviewSession,
  InterviewReport,
  CandidateProfile,
  InterviewMode,
  DifficultyLevel,
  Question,
  QuestionStatus,
  InterviewReportOverview
} from '../models/interfaces';
import { QuestionPlanner } from './questionPlanner';
import { FeedbackGenerator } from './feedbackGenerator';
import { ContextManager } from './contextManager';
import { MemoryService } from '../breeth';
import { PromptTemplates } from '../prompts/promptTemplates';
import { ConversationOrchestrator } from './conversationOrchestrator';
import { RepetitionGuard } from './repetitionGuard';
import { CoverageTracker } from './coverageTracker';

export class InterviewEngine {
  private sessions: Map<string, InterviewSession> = new Map();
  private reports: Map<string, InterviewReport> = new Map();
  private reportList: string[] = [];
  public memoryService: MemoryService = new MemoryService();
  private sessionList: string[] = [];

  private repetitionGuards: Map<string, RepetitionGuard> = new Map();
  private coverageTrackers: Map<string, CoverageTracker> = new Map();

  public async startInterview(
    cvProfile: CandidateProfile,
    interviewMode: InterviewMode,
    initialDifficulty: DifficultyLevel = 'intermediate'
  ): Promise<InterviewSession> {
    const candidateId = cvProfile.name
      ? `cand-${cvProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      : `cand-${Date.now()}`;
    const sessionId = `session-${Date.now()}`;

    const questions: Question[] = QuestionPlanner.planQuestions(
      cvProfile,
      interviewMode,
      initialDifficulty
    );

    await this.memoryService.initializeSessionMemory(candidateId, sessionId);

    let breethMemory: InterviewSession['breethMemory'] = undefined;
    try {
      const pastMemories = await this.memoryService.queryCandidateMemory(candidateId);
      if (pastMemories && pastMemories.length > 0) {
        const latestMem = pastMemories[pastMemories.length - 1];
        breethMemory = {
          strengths: latestMem.strengths,
          weaknesses: latestMem.weaknesses,
          misconceptions: latestMem.misconceptions,
          confidenceScore: latestMem.confidenceScore
        };
      }
    } catch (err: any) {
      console.warn('[InterviewEngine] Breeth memory lookup warning:', err.message);
    }

    const nowIso = new Date().toISOString();
    const firstQuestion = questions[0];

    const session: InterviewSession = {
      sessionId,
      candidateId,
      curriculumId: 'cv-grounded',
      interviewMode,
      cvProfile,
      status: 'active',
      difficulty: initialDifficulty,
      currentQuestionIndex: 0,
      questionsAsked: [firstQuestion.promptText],
      questions,
      messages: [],
      startTime: nowIso,
      interviewStartedAt: nowIso,
      timedQuestions: [
        {
          questionId: firstQuestion.questionId,
          topic: firstQuestion.topic,
          promptText: firstQuestion.promptText,
          questionStartedAt: nowIso,
          answer: '',
          durationSeconds: 0,
          status: 'active'
        }
      ],
      breethMemory
    };

    const guard = new RepetitionGuard([firstQuestion.promptText]);
    this.repetitionGuards.set(sessionId, guard);

    const tracker = new CoverageTracker(cvProfile, interviewMode);
    tracker.markCovered(firstQuestion.topic);
    this.coverageTrackers.set(sessionId, tracker);

    const breethPromptContext = await this.memoryService.buildPromptContext(sessionId);
    const systemPrompt = `${PromptTemplates.getSystemPrompt(
      cvProfile,
      interviewMode,
      breethMemory
    )}\n\n${breethPromptContext}`;
    ContextManager.appendMessage(session, 'system', systemPrompt);

    const firstName = cvProfile.name ? cvProfile.name.split(' ')[0] : 'there';
    let greeting = `Hello ${firstName}. I've reviewed your CV and I'll be focusing this interview on the projects and technologies you've worked with. Let's start with your experience in ${firstQuestion.cvGrounding || firstQuestion.topic}.\n\n${firstQuestion.promptText}`;
    if (breethMemory && breethMemory.weaknesses?.length) {
      greeting = `Hello ${firstName}. Welcome back. Building on your previous session history, we'll examine your CV experience in depth and revisit key growth areas.\n\n${firstQuestion.promptText}`;
    }

    ContextManager.appendMessage(session, 'assistant', greeting);

    await this.memoryService.recordTimelineEvent(
      sessionId,
      'question_asked',
      `Question 1: "${firstQuestion.promptText}"`,
      `CV-Grounded in ${firstQuestion.cvGrounding || firstQuestion.topic}`,
      initialDifficulty
    );

    await this.memoryService.recordTimelineEvent(
      sessionId,
      'next_question_reasoning',
      `Selected initial topic "${firstQuestion.topic}" to assess baseline at ${initialDifficulty} level.`,
      `CV Grounding: ${firstQuestion.cvGrounding || 'Primary CV skill'}`
    );

    this.sessions.set(sessionId, session);
    this.sessionList.push(sessionId);
    return session;
  }

  public getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessions(): InterviewSession[] {
    return this.sessionList.map(id => this.sessions.get(id)!).filter(Boolean);
  }

  public async handleMessage(
    sessionId: string,
    userMessage: string,
    statusOverride?: QuestionStatus,
    answerStartedAt?: string
  ): Promise<{ reply: string; isCompleted: boolean; nextDifficulty: DifficultyLevel }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    ContextManager.appendMessage(session, 'user', userMessage);

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (!session.timedQuestions) {
      session.timedQuestions = [];
    }

    let currentLog = session.timedQuestions[session.currentQuestionIndex];
    const currentQ =
      session.questions[session.currentQuestionIndex] || session.questions[0];

    if (!currentLog) {
      currentLog = {
        questionId: currentQ.questionId,
        topic: currentQ.topic,
        promptText: currentQ.promptText,
        questionStartedAt: nowIso,
        answer: '',
        durationSeconds: 0,
        status: 'active'
      };
      session.timedQuestions[session.currentQuestionIndex] = currentLog;
    }

    const qStartedMs = new Date(currentLog.questionStartedAt).getTime();
    const durationSec = Math.max(1, Math.round((now - qStartedMs) / 1000));

    currentLog.answer = userMessage;
    currentLog.answerSubmittedAt = nowIso;
    currentLog.durationSeconds = durationSec;
    if (answerStartedAt) currentLog.answerStartedAt = answerStartedAt;

    if (statusOverride) {
      currentLog.status = statusOverride;
    } else {
      currentLog.status = userMessage.trim().length > 0 ? 'answered' : 'not_attempted';
    }

    const wordCount = userMessage.trim().split(/\s+/).filter(Boolean).length;

    await this.memoryService.recordTimelineEvent(
      sessionId,
      'candidate_answer',
      `Candidate response to Q${session.currentQuestionIndex + 1}: "${userMessage.substring(0, 120)}${userMessage.length > 120 ? '...' : ''}"`,
      `Status: ${currentLog.status}, Words: ${wordCount}, Duration: ${durationSec}s`
    );

    const sessionStartMs = new Date(
      session.interviewStartedAt || session.startTime
    ).getTime();
    const globalElapsedMs = now - sessionStartMs;
    const isGlobalTimeExpired = globalElapsedMs >= 1800000;

    const hasMore =
      session.currentQuestionIndex < session.questions.length - 1 &&
      !isGlobalTimeExpired;

    if (hasMore) {
      const breethPromptContext = await this.memoryService.buildPromptContext(sessionId);
      const guard = this.repetitionGuards.get(sessionId);
      const tracker = this.coverageTrackers.get(sessionId);

      const turnResult = await ConversationOrchestrator.processTurn(
        session,
        userMessage,
        currentQ,
        breethPromptContext,
        guard
      );

      if (guard) guard.register(turnResult.question);

      if (tracker) {
        tracker.markCovered(turnResult.decision.topic);
        const uncovered = tracker.getUncoveredTopics();
        if (uncovered.length > 0) {
          console.info(`[CoverageTracker] Uncovered CV topics: ${uncovered.slice(0, 3).join(', ')}`);
        }
      }

      const oldDifficulty = session.difficulty;
      session.difficulty = turnResult.decision.difficulty;

      const whyExplanation = `Evaluated quality "${turnResult.evaluation.quality}" with technical depth Level ${turnResult.evaluation.technicalDepth}/5. Decision: ${turnResult.decision.type}. Source: ${turnResult.source}.`;
      await this.memoryService.storeReasoning(
        sessionId,
        currentQ.questionId,
        currentQ.topic,
        whyExplanation,
        turnResult.fullResponseText
      );

      if (turnResult.evaluation.strength) {
        await this.memoryService.updateProgressiveBeliefs(
          sessionId,
          turnResult.evaluation.strength,
          undefined,
          undefined,
          5
        );
      }
      if (turnResult.evaluation.missingInfo) {
        await this.memoryService.updateProgressiveBeliefs(
          sessionId,
          undefined,
          turnResult.evaluation.missingInfo,
          undefined,
          -5
        );
      }

      await this.memoryService.recordTimelineEvent(
        sessionId,
        'evaluation',
        `Q${session.currentQuestionIndex + 1} quality: "${turnResult.evaluation.quality}" (Depth ${turnResult.evaluation.technicalDepth}/5, Comm ${turnResult.evaluation.communication}/5)`,
        whyExplanation
      );

      if (oldDifficulty !== session.difficulty) {
        await this.memoryService.recordTimelineEvent(
          sessionId,
          'difficulty_adjustment',
          `Difficulty: ${oldDifficulty} → ${session.difficulty}`,
          `Reason: ${turnResult.decision.reasoning || whyExplanation}`
        );
      }

      session.currentQuestionIndex += 1;
      const nextQ = session.questions[session.currentQuestionIndex];
      session.questionsAsked.push(nextQ.promptText);

      if (guard) guard.register(nextQ.promptText);

      session.timedQuestions.push({
        questionId: nextQ.questionId,
        topic: nextQ.topic,
        promptText: nextQ.promptText,
        questionStartedAt: nowIso,
        answer: '',
        durationSeconds: 0,
        status: 'active'
      });

      await this.memoryService.recordTimelineEvent(
        sessionId,
        'next_question_reasoning',
        `Selected Q${session.currentQuestionIndex + 1} ("${nextQ.topic}") at ${session.difficulty} level.`,
        turnResult.fullResponseText,
        session.difficulty
      );

      await this.memoryService.recordTimelineEvent(
        sessionId,
        'question_asked',
        `Q${session.currentQuestionIndex + 1}: "${nextQ.promptText}"`,
        `CV Grounding: ${nextQ.cvGrounding || nextQ.topic}`,
        session.difficulty
      );

      const reply = turnResult.fullResponseText;
      ContextManager.appendMessage(session, 'assistant', reply);

      return { reply, isCompleted: false, nextDifficulty: session.difficulty };
    } else {
      session.status = 'completed';
      session.endTime = nowIso;
      session.interviewEndedAt = nowIso;
      session.interviewDurationSeconds = Math.round((now - sessionStartMs) / 1000);

      this.repetitionGuards.delete(sessionId);
      this.coverageTrackers.delete(sessionId);

      const feedback = await FeedbackGenerator.generate(session);
      const reportId = `rep-${Date.now()}`;

      const timedLogs = session.timedQuestions || [];
      const answeredCount = timedLogs.filter(q => q.status === 'answered').length;
      const timedOutCount = timedLogs.filter(q => q.status === 'timed_out').length;
      const notAttemptedCount = timedLogs.filter(q => q.status === 'not_attempted').length;
      const validDurations = timedLogs.map(q => q.durationSeconds || 0).filter(d => d > 0);
      const avgDuration =
        validDurations.length > 0
          ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
          : 0;
      const maxDuration = validDurations.length > 0 ? Math.max(...validDurations) : 0;

      const overview: InterviewReportOverview = {
        interviewStartedAt: session.interviewStartedAt || session.startTime,
        interviewEndedAt: session.interviewEndedAt || session.endTime!,
        interviewDurationSeconds: session.interviewDurationSeconds || 1800,
        totalQuestions: timedLogs.length,
        answeredQuestions: answeredCount,
        timedOutQuestions: timedOutCount,
        notAttemptedQuestions: notAttemptedCount,
        averageAnswerTimeSeconds: avgDuration,
        longestAnswerTimeSeconds: maxDuration,
        questionLogs: timedLogs.map((q, idx) => ({
          questionIndex: idx + 1,
          promptText: q.promptText,
          status: q.status,
          durationSeconds: q.durationSeconds || 0
        }))
      };

      await this.memoryService.saveMemory(
        sessionId,
        session.candidateId,
        feedback.strengths,
        feedback.weaknesses,
        feedback.misconceptions,
        feedback.confidenceScore
      );

      await this.memoryService.recordTimelineEvent(
        sessionId,
        'memory_update',
        `Completed session. Technical: ${feedback.technicalScore}, Comm: ${feedback.communicationScore}, Confidence: ${feedback.confidenceScore}. Duration: ${session.interviewDurationSeconds}s.`
      );

      const report: InterviewReport = {
        reportId,
        sessionId,
        candidateId: session.candidateId,
        candidateName: session.cvProfile?.name || 'Candidate',
        interviewMode: session.interviewMode,
        createdAt: nowIso,
        feedback,
        transcriptSummary: {
          totalQuestions: timedLogs.length,
          totalExchanges: session.messages.filter(m => m.role === 'user').length
        },
        overview
      };

      this.reportList.push(reportId);
      this.reports.set(reportId, report);
      this.reports.set(sessionId, report);

      const endReason = isGlobalTimeExpired
        ? 'Your 10-minute interview duration limit has concluded.'
        : 'I have gathered sufficient evidence to evaluate your CV experience.';
      const reply = `Thank you. That completes your ${InterviewEngine.getModeLabel(session.interviewMode)} interview session. ${endReason}\n\nYour evaluation report is ready on your dashboard.`;
      ContextManager.appendMessage(session, 'assistant', reply);

      return { reply, isCompleted: true, nextDifficulty: session.difficulty };
    }
  }

  public async getReport(identifier: string): Promise<InterviewReport | undefined> {
    if (identifier === 'latest') {
      if (this.reportList.length > 0) {
        const latestId = this.reportList[this.reportList.length - 1];
        const rep = this.reports.get(latestId);
        if (rep) return rep;
      }
      const completedSessions = Array.from(this.sessions.values()).filter(
        s => s.status === 'completed'
      );
      if (completedSessions.length > 0) {
        const latestSession = completedSessions[completedSessions.length - 1];
        return await this.generateReportForSession(latestSession);
      }
      const anySession = Array.from(this.sessions.values())[0];
      if (anySession) return await this.generateReportForSession(anySession);
      return undefined;
    }

    const existing = this.reports.get(identifier);
    if (existing) return existing;

    const session = this.sessions.get(identifier);
    if (session) return await this.generateReportForSession(session);

    return undefined;
  }

  public async generateReportForSession(session: InterviewSession): Promise<InterviewReport> {
    const feedback = await FeedbackGenerator.generate(session);
    const reportId = `rep-${Date.now()}`;
    const report: InterviewReport = {
      reportId,
      sessionId: session.sessionId,
      candidateId: session.candidateId,
      candidateName: session.cvProfile?.name || 'Candidate',
      interviewMode: session.interviewMode,
      createdAt: new Date().toISOString(),
      feedback,
      transcriptSummary: {
        totalQuestions: session.questions.length,
        totalExchanges: session.messages.filter(m => m.role === 'user').length
      }
    };

    await this.memoryService.saveMemory(
      session.sessionId,
      session.candidateId,
      feedback.strengths,
      feedback.weaknesses,
      feedback.misconceptions,
      feedback.confidenceScore
    );

    if (!this.reportList.includes(reportId)) this.reportList.push(reportId);
    this.reports.set(reportId, report);
    this.reports.set(session.sessionId, report);
    return report;
  }

  public getCompletedCount(): number {
    return this.reportList.length;
  }

  private static getModeLabel(mode: InterviewMode): string {
    const labels: Record<InterviewMode, string> = {
      technical: 'Technical',
      hr: 'HR',
      behavioral: 'Behavioral & Situational',
      mixed: 'Mixed'
    };
    return labels[mode] || mode;
  }
}
