export type InterviewMode = 'technical' | 'hr' | 'behavioral' | 'mixed';

export interface CandidateProfile {
  name: string;
  email?: string;
  phone?: string;
  education: string[];
  skills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  tools: string[];
  projects: string[];
  internships: string[];
  workExperience: string[];
  certifications: string[];
  achievements: string[];
  rawSummary: string;
}

export interface CandidateProgress {
  currentDay: number;
  totalDays: number;
  completionPercentage: number;
}

export interface Candidate {
  candidateId: string;
  name: string;
  email: string;
  targetRole: string;
  progress: CandidateProgress;
  skills: string[];
  completedDays: number[];
  weakTopics: string[];
  experienceLevel: string;
}

export interface CurriculumModule {
  moduleId: string;
  title: string;
  days: number[];
  keyTopics: string[];
}

export interface Curriculum {
  curriculumId: string;
  title: string;
  track: string;
  totalModules: number;
  modules: CurriculumModule[];
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type QuestionStatus = 'answered' | 'timed_out' | 'not_attempted' | 'active';

export interface Question {
  questionId: string;
  topic: string;
  difficulty: DifficultyLevel;
  promptText: string;
  expectedKeyPoints: string[];
  cvGrounding?: string;
  displayFact?: string;
  curriculumDay?: number;
  curriculumModule?: string;
}

export interface TimedQuestionLog {
  questionId: string;
  topic: string;
  promptText: string;
  questionStartedAt: string;
  answerStartedAt?: string;
  answerSubmittedAt?: string;
  answer: string;
  durationSeconds: number;
  status: QuestionStatus;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  curriculumId: string;
  interviewMode: InterviewMode;
  cvProfile?: CandidateProfile;
  status: 'active' | 'completed' | 'paused';
  difficulty: DifficultyLevel;
  currentQuestionIndex: number;
  questionsAsked: string[];
  questions: Question[];
  messages: Message[];
  startTime: string;
  endTime?: string;
  interviewStartedAt?: string;
  interviewEndedAt?: string;
  interviewDurationSeconds?: number;
  timedQuestions?: TimedQuestionLog[];
  breethMemory?: {
    strengths: string[];
    weaknesses: string[];
    misconceptions: string[];
    confidenceScore: number;
  };
  evaluationMetrics?: {
    technicalScores: number[];
    communicationScores: number[];
  };
  usedFallbackTurns?: number;
  lastFallbackReason?: string;
}

export interface InterviewFeedback {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  cvClaimVerificationScore: number;
  cvInconsistencies: string[];
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  topicsCovered: string[];
  recommendations: string[];
  suggestedRevisions: string[];
  overallSummary: string;
  modeSpecificNote?: string;
}

export interface InterviewReportOverview {
  interviewStartedAt: string;
  interviewEndedAt: string;
  interviewDurationSeconds: number;
  totalQuestions: number;
  answeredQuestions: number;
  timedOutQuestions: number;
  notAttemptedQuestions: number;
  averageAnswerTimeSeconds: number;
  longestAnswerTimeSeconds: number;
  questionLogs: Array<{
    questionIndex: number;
    promptText: string;
    status: QuestionStatus;
    durationSeconds: number;
  }>;
}

export interface InterviewReport {
  reportId: string;
  sessionId: string;
  candidateId: string;
  candidateName: string;
  interviewMode: InterviewMode;
  createdAt: string;
  feedback: InterviewFeedback;
  transcriptSummary: {
    totalQuestions: number;
    totalExchanges: number;
  };
  overview?: InterviewReportOverview;
}
