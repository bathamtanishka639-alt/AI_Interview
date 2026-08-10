import { Router, Request, Response } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { InterviewEngine } from '../interview/interviewEngine';
import { CvParser } from '../cv/cvParser';
import { CandidateProfile, InterviewMode } from '../models/interfaces';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

const router = Router();
const interviewEngine = new InterviewEngine();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are supported.'));
    }
  }
});

router.post('/cv/parse', upload.single('cv'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Please upload a PDF or DOCX file.' });
    }

    let rawText = '';

    const originalName = (req.file.originalname || '').toLowerCase();
    const mimeType = (req.file.mimetype || '').toLowerCase();
    const isPdf = mimeType.includes('pdf') || originalName.endsWith('.pdf');

    if (isPdf) {
      const pdfData = await pdfParse(req.file.buffer);
      rawText = pdfData.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      rawText = result.value;
    }

    if (!rawText || rawText.trim().length < 30) {
      return res.status(422).json({ success: false, error: 'Could not extract readable text from your CV. Please ensure it is not scanned/image-based.' });
    }

    const profile: CandidateProfile = await CvParser.parse(rawText);

    return res.json({ success: true, data: profile });
  } catch (err: any) {
    console.error('[Route] /cv/parse error:', err.message);
    if (err.message.includes('Only PDF and DOCX')) {
      return res.status(415).json({ success: false, error: err.message });
    }
    if (err.message.includes('does not appear to be a valid CV') || err.message.includes('too short or empty')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: 'CV parsing failed. Please try again with a valid CV or resume file.' });
  }
});

router.post('/ats/analyze', async (req: Request, res: Response) => {
  try {
    const { cvText, jobDescription } = req.body || {};
    if (!cvText || typeof cvText !== 'string' || cvText.trim().length < 30) {
      return res.status(400).json({ error: 'cvText is required and must contain substantial CV content.' });
    }

    const cvProfile = await CvParser.parse(cvText);
    const { AtsAnalyzer } = await import('../ats/atsAnalyzer');

    const result = AtsAnalyzer.analyze({
      cvProfile,
      rawCvText: cvText,
      jobDescription: typeof jobDescription === 'string' ? jobDescription : undefined
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Route] POST /ats/analyze error:', err.message);
    return res.status(500).json({ error: 'ATS analysis failed.' });
  }
});

router.post('/cv/ats', upload.single('cv'), async (req: Request, res: Response) => {
  try {
    const jobDescription = req.body?.jobDescription;
    let cvProfile: CandidateProfile | null = null;
    let rawCvText = '';

    if (req.body?.cvProfile) {
      cvProfile = typeof req.body.cvProfile === 'string' ? JSON.parse(req.body.cvProfile) : req.body.cvProfile;
      rawCvText = req.body?.cvText || JSON.stringify(cvProfile);
    } else if (req.file) {
      const originalName = (req.file.originalname || '').toLowerCase();
      const mimeType = (req.file.mimetype || '').toLowerCase();
      const isPdf = mimeType.includes('pdf') || originalName.endsWith('.pdf');
      if (isPdf) {
        const pdfData = await pdfParse(req.file.buffer);
        rawCvText = pdfData.text;
      } else {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        rawCvText = result.value;
      }
      if (rawCvText && rawCvText.trim().length >= 30) {
        cvProfile = await CvParser.parse(rawCvText);
      }
    }

    if (!cvProfile) {
      return res.status(400).json({ success: false, error: 'Please provide either a valid cvProfile object or upload a CV file.' });
    }

    const { AtsAnalyzer } = await import('../ats/atsAnalyzer');
    const atsResult = AtsAnalyzer.analyze({
      cvProfile,
      rawCvText,
      jobDescription: typeof jobDescription === 'string' ? jobDescription : undefined
    });

    return res.json({ success: true, data: atsResult });
  } catch (err: any) {
    console.error('[Route] /cv/ats error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'ATS analysis failed.' });
  }
});

// ========== INTERVIEW SESSIONS ==========

router.get('/interviews', async (req: Request, res: Response) => {
  const sessions = interviewEngine.getSessions().filter(s => s.status === 'completed');
  const summaries = await Promise.all(sessions.map(async (s) => {
    const report = await interviewEngine.getReport(s.sessionId);
    const f = report?.feedback;
    const overallScore = f
      ? Math.round(((f.technicalScore || 70) + (f.communicationScore || 70) + (f.problemSolvingScore || 70)) / 3)
      : 80;
    return {
      id: s.sessionId,
      sessionId: s.sessionId,
      candidateName: s.cvProfile?.name || 'Candidate',
      interviewMode: s.interviewMode,
      status: s.status,
      startTime: s.startTime,
      endTime: s.endTime,
      totalQuestions: s.questions.length,
      currentQuestion: s.currentQuestionIndex,
      skills: s.cvProfile?.skills?.slice(0, 5) || [],
      overallScore
    };
  }));

  res.json({ success: true, data: summaries });
});

import { CurriculumLoader } from '../curriculum/curriculumLoader';

router.get('/candidate', (req: Request, res: Response) => {
  const candidate = CurriculumLoader.getCandidate();
  res.json({ success: true, data: candidate });
});

router.get('/curriculum', (req: Request, res: Response) => {
  const curriculum = CurriculumLoader.getCurriculum();
  res.json({ success: true, data: curriculum });
});

router.post('/interview/start', async (req: Request, res: Response) => {
  const { cvProfile, interviewMode, difficulty = 'intermediate' } = req.body;

  if (!cvProfile) {
    return res.status(400).json({ success: false, error: 'cvProfile is required. Please parse your CV first.' });
  }

  if (!interviewMode || !['technical', 'hr', 'behavioral', 'mixed'].includes(interviewMode)) {
    return res.status(400).json({ success: false, error: 'interviewMode must be one of: technical, hr, behavioral, mixed.' });
  }

  try {
    const session = await interviewEngine.startInterview(cvProfile as CandidateProfile, interviewMode as InterviewMode, difficulty);

    const firstAssistantMsg = session.messages.find(m => m.role === 'assistant');
    res.status(201).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        interviewMode: session.interviewMode,
        candidateName: cvProfile.name,
        currentQuestion: session.questions[0],
        currentQuestionIndex: 0,
        totalQuestions: session.questions.length,
        firstMessage: firstAssistantMsg?.content || '',
        difficulty: session.difficulty,
        status: session.status
      }
    });
  } catch (err: any) {
    console.error('[Route] /interview/start error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to start interview.' });
  }
});

router.post('/interview/message', async (req: Request, res: Response) => {
  const { sessionId, message = '', status, answerStartedAt } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId is required.' });
  }

  try {
    const result = await interviewEngine.handleMessage(sessionId, message, status, answerStartedAt);
    const session = interviewEngine.getSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        reply: result.reply,
        isCompleted: result.isCompleted,
        nextDifficulty: result.nextDifficulty,
        currentQuestionIndex: session?.currentQuestionIndex ?? 0,
        totalQuestions: session?.questions.length ?? 0,
        status: session?.status ?? 'active',
        interviewStartedAt: session?.interviewStartedAt || session?.startTime,
        interviewEndedAt: session?.interviewEndedAt || session?.endTime,
        timedQuestions: session?.timedQuestions || []
      }
    });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/interview', async (req: Request, res: Response) => {
  try {
    const { sessionId, candidate, message, status, answerStartedAt } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    if (candidate || (!message && !interviewEngine.getSession(sessionId))) {
      const candObj = candidate || {};
      const cvProfile: CandidateProfile = {
        name: candObj.name || 'Candidate',
        email: candObj.email || '',
        education: Array.isArray(candObj.education) ? candObj.education : (candObj.education ? [candObj.education] : []),
        skills: Array.isArray(candObj.skills) ? candObj.skills : ['Software Development'],
        programmingLanguages: Array.isArray(candObj.programmingLanguages) ? candObj.programmingLanguages : (Array.isArray(candObj.skills) ? candObj.skills : []),
        frameworks: Array.isArray(candObj.frameworks) ? candObj.frameworks : [],
        tools: Array.isArray(candObj.tools) ? candObj.tools : [],
        projects: Array.isArray(candObj.projects) ? candObj.projects : [],
        internships: Array.isArray(candObj.internships) ? candObj.internships : [],
        workExperience: Array.isArray(candObj.workExperience) ? candObj.workExperience : [],
        certifications: Array.isArray(candObj.certifications) ? candObj.certifications : [],
        achievements: Array.isArray(candObj.achievements) ? candObj.achievements : [],
        rawSummary: candObj.rawSummary || candObj.targetRole || 'Software Engineer Candidate'
      };

      const session = await interviewEngine.startInterview(cvProfile, 'technical', 'intermediate');
      if (sessionId) {
        session.sessionId = sessionId;
        (interviewEngine as any).sessions.set(sessionId, session);
      }

      const firstAssistantMsg = session.messages.find(m => m.role === 'assistant');
      const reply = firstAssistantMsg?.content || `Welcome ${cvProfile.name}. Let's begin your technical interview.`;

      return res.json({
        reply,
        done: false
      });
    }

    if (message !== undefined || status !== undefined) {
      const result = await interviewEngine.handleMessage(sessionId, message || '', status, answerStartedAt);

      if (!result.isCompleted) {
        return res.json({
          reply: result.reply,
          done: false
        });
      } else {
        const report = await interviewEngine.getReport(sessionId);
        const feedback = report?.feedback || {
          overallSummary: 'Interview evaluation completed.',
          strengths: ['Demonstrated technical understanding of core concepts.'],
          weaknesses: ['Elaborate further on trade-offs and edge case handling.'],
          recommendations: ['Practice system architecture scenarios and failure recovery.']
        };

        const fbAny = feedback as any;
        const strengthsList = Array.isArray(feedback.strengths) && feedback.strengths.length > 0
          ? feedback.strengths
          : ['Demonstrated technical understanding of core concepts.'];
        const gapsList = Array.isArray(feedback.weaknesses) && feedback.weaknesses.length > 0
          ? feedback.weaknesses
          : (Array.isArray(fbAny.misconceptions) && fbAny.misconceptions.length > 0 ? fbAny.misconceptions : ['Elaborate further on trade-offs and failure modes.']);
        const nextList = Array.isArray(feedback.recommendations) && feedback.recommendations.length > 0
          ? feedback.recommendations
          : (Array.isArray(fbAny.suggestedRevisions) && fbAny.suggestedRevisions.length > 0 ? fbAny.suggestedRevisions : ['Review production scalability and system design principles.']);

        return res.json({
          reply: result.reply,
          done: true,
          feedback: {
            summary: feedback.overallSummary || 'Interview evaluation completed.',
            strengths: strengthsList,
            gaps: gapsList,
            next: nextList
          }
        });
      }
    }

    return res.status(400).json({ error: 'Payload must include either candidate object or message string.' });
  } catch (err: any) {
    console.error('[Route] POST /api/interview submission endpoint error:', err.message);
    return res.status(500).json({ error: err.message || 'Internal interview server error.' });
  }
});

router.get('/interview/session/:sessionId', (req: Request, res: Response) => {
  const session = interviewEngine.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: `Session not found: ${req.params.sessionId}` });
  }
  res.json({ success: true, data: session });
});

router.get('/interview/report/:id', async (req: Request, res: Response) => {
  const report = await interviewEngine.getReport(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, error: `Report not found for id: ${req.params.id}` });
  }
  const completedCount = interviewEngine.getCompletedCount();
  res.json({ success: true, data: { ...report, completedCount } });
});

router.get('/breeth/memory/:identifier', async (req: Request, res: Response) => {
  const { identifier } = req.params;
  let memory = await interviewEngine.memoryService.getMemory(identifier);
  
  if (!memory) {
    const candidateMemories = await interviewEngine.memoryService.queryCandidateMemory(identifier);
    if (candidateMemories.length > 0) {
      memory = candidateMemories[candidateMemories.length - 1];
    }
  }

  if (!memory) {
    const sessions = interviewEngine.getSessions();
    if (sessions.length > 0) {
      memory = await interviewEngine.memoryService.getMemory(sessions[sessions.length - 1].sessionId);
    }
  }

  if (!memory) {
    return res.status(404).json({ success: false, error: `No Breeth memory entity found for identifier: ${identifier}` });
  }

  const promptContext = await interviewEngine.memoryService.buildPromptContext(memory.sessionId);

  return res.json({
    success: true,
    data: {
      ...memory,
      promptContext
    }
  });
});

router.get('/interview/memory/:sessionId', async (req: Request, res: Response) => {
  const memory = await interviewEngine.memoryService.getMemory(req.params.sessionId);
  if (!memory) {
    return res.status(404).json({ success: false, error: `Memory not found for session: ${req.params.sessionId}` });
  }
  res.json({ success: true, data: memory });
});

router.get('/interview/timeline/:candidateId', async (req: Request, res: Response) => {
  const timeline = await interviewEngine.memoryService.generateLearningTimeline(req.params.candidateId);
  res.json({ success: true, data: timeline });
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-interview-agent-backend',
    version: '2.0.0',
    features: ['cv-parsing', 'adaptive-interviews', 'breeth-memory', '4-interview-modes'],
    timestamp: new Date().toISOString()
  });
});

export default router;
