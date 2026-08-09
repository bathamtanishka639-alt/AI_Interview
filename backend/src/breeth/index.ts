import { BreethClient } from './breethClient';
import { BreethMemoryEntity, TimelineEvent } from './memoryTypes';
import { MemoryMapper } from './memoryMapper';
import { RetrievalUtility } from './retrieval';
import { MemoryUpdater } from './updater';
import { PromptContextBuilder } from './promptContext';
import { ReasoningStorage } from './reasoning';

export class MemoryService {
  private client: BreethClient;

  constructor(client?: BreethClient) {
    this.client = client || new BreethClient();
  }

  public async saveMemory(memory: BreethMemoryEntity): Promise<boolean>;
  public async saveMemory(
    sessionId: string,
    candidateId: string,
    strengths: string[],
    weaknesses: string[],
    misconceptions: string[],
    confidenceScore: number
  ): Promise<boolean>;
  public async saveMemory(
    arg1: any,
    candidateId?: string,
    strengths?: string[],
    weaknesses?: string[],
    misconceptions?: string[],
    confidenceScore?: number
  ): Promise<boolean> {
    if (typeof arg1 === 'object' && arg1.sessionId) {
      return await this.client.setMemory(arg1.sessionId, arg1);
    }
    const existing = await this.client.getMemory(arg1);
    const memoryEntity: BreethMemoryEntity = {
      sessionId: arg1,
      candidateId: candidateId || 'default-candidate',
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      resolvedWeaknesses: existing?.resolvedWeaknesses || [],
      misconceptions: misconceptions || [],
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : 70,
      interviewerObservations: existing?.interviewerObservations || [],
      followUpReasoning: existing?.followUpReasoning || [],
      skippedConcepts: existing?.skippedConcepts || [],
      recommendations: existing?.recommendations || [],
      timelineEvents: existing?.timelineEvents || [],
      reasoningLogs: existing?.reasoningLogs || [],
      interviewEvents: existing?.interviewEvents || [],
      reasoningHistory: existing?.reasoningHistory || [],
      updatedAt: new Date().toISOString()
    };
    return await this.client.setMemory(arg1, memoryEntity);
  }

  /**
   * Records a chronological interview timeline event in Breeth.
   */
  public async recordTimelineEvent(
    sessionId: string,
    eventType: TimelineEvent['eventType'],
    details: string,
    reasoning?: string,
    difficulty?: string
  ): Promise<BreethMemoryEntity | null> {
    const memory = await this.client.getMemory(sessionId);
    if (!memory) return null;

    const event: TimelineEvent = {
      eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType,
      timestamp: new Date().toISOString(),
      details,
      reasoning,
      difficulty
    };

    memory.timelineEvents.push(event);
    memory.interviewEvents.push({
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      details: event.details
    });

    memory.updatedAt = new Date().toISOString();
    await this.client.setMemory(sessionId, memory);
    return memory;
  }

  /**
   * Stores WHY a conclusion/misconception was reached.
   */
  public async storeReasoning(
    sessionId: string,
    questionId: string,
    concept: string,
    whyExplanation: string,
    followUpReason: string
  ): Promise<BreethMemoryEntity | null> {
    const memory = await this.client.getMemory(sessionId);
    if (!memory) return null;

    const updated = ReasoningStorage.storeReasoning(memory, questionId, concept, whyExplanation, followUpReason);
    await this.client.setMemory(sessionId, updated);
    return updated;
  }

  /**
   * Updates candidate knowledge and applies Progressive Learning to resolve weaknesses.
   */
  public async updateProgressiveBeliefs(
    sessionId: string,
    newStrength?: string,
    newWeakness?: string,
    newMisconception?: string,
    scoreDelta?: number
  ): Promise<BreethMemoryEntity | null> {
    const memory = await this.client.getMemory(sessionId);
    if (!memory) return null;

    const updated = MemoryUpdater.updateCandidateKnowledge(
      memory,
      newStrength,
      newWeakness,
      newMisconception,
      scoreDelta
    );
    await this.client.setMemory(sessionId, updated);
    return updated;
  }

  public async queryCandidateMemory(candidateId: string): Promise<BreethMemoryEntity[]> {
    return await this.client.queryMemory(candidateId);
  }

  public async generateLearningTimeline(candidateId: string): Promise<any[]> {
    const memories = await this.client.queryMemory(candidateId);
    return memories.map(m => ({
      sessionId: m.sessionId,
      updatedAt: m.updatedAt,
      confidenceScore: m.confidenceScore,
      strengthsCount: m.strengths.length,
      weaknessesCount: m.weaknesses.length,
      timelineEventsCount: m.timelineEvents?.length || 0
    }));
  }

  public async buildPromptContext(sessionId: string): Promise<string> {
    const memory = await this.client.getMemory(sessionId);
    if (!memory) return '';
    return PromptContextBuilder.buildPromptContext(memory);
  }

  public async initializeSessionMemory(candidateId: string, sessionId: string): Promise<BreethMemoryEntity> {
    const memory = MemoryMapper.createDefaultMemory(candidateId, sessionId);
    memory.timelineEvents = [];
    memory.reasoningLogs = [];
    memory.resolvedWeaknesses = [];
    await this.client.setMemory(sessionId, memory);
    return memory;
  }

  public async getMemory(sessionId: string): Promise<BreethMemoryEntity | null> {
    return await this.client.getMemory(sessionId);
  }
}
