export interface TimelineEvent {
  eventId: string;
  eventType: 'question_asked' | 'candidate_answer' | 'evaluation' | 'memory_update' | 'difficulty_adjustment' | 'next_question_reasoning';
  timestamp: string;
  details: string;
  reasoning?: string;
  difficulty?: string;
}

export interface ReasoningLog {
  timestamp: string;
  questionId: string;
  concept: string;
  whyExplanation: string;
  followUpReason: string;
}

export interface BreethMemoryEntity {
  candidateId: string;
  sessionId: string;
  strengths: string[];
  weaknesses: string[];
  resolvedWeaknesses: string[];
  misconceptions: string[];
  confidenceScore: number;
  interviewerObservations: string[];
  followUpReasoning: string[];
  skippedConcepts: string[];
  recommendations: string[];
  timelineEvents: TimelineEvent[];
  reasoningLogs: ReasoningLog[];
  interviewEvents: {
    eventId: string;
    eventType: string;
    timestamp: string;
    details: string;
  }[];
  reasoningHistory: {
    timestamp: string;
    questionId: string;
    reasoning: string;
  }[];
  updatedAt: string;
}

export interface BreethConfig {
  apiKey?: string;
  endpoint?: string;
  mockMode?: boolean;
}
