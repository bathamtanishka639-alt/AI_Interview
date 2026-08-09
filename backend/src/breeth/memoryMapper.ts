import { BreethMemoryEntity } from './memoryTypes';

export class MemoryMapper {
  public static createDefaultMemory(candidateId: string, sessionId: string): BreethMemoryEntity {
    return {
      candidateId,
      sessionId,
      strengths: [],
      weaknesses: [],
      resolvedWeaknesses: [],
      misconceptions: [],
      confidenceScore: 70,
      interviewerObservations: [],
      followUpReasoning: [],
      skippedConcepts: [],
      recommendations: [],
      timelineEvents: [],
      reasoningLogs: [],
      interviewEvents: [],
      reasoningHistory: [],
      updatedAt: new Date().toISOString()
    };
  }

  public static serialize(memory: BreethMemoryEntity): string {
    return JSON.stringify(memory, null, 2);
  }

  public static deserialize(raw: string): BreethMemoryEntity {
    return JSON.parse(raw);
  }
}
