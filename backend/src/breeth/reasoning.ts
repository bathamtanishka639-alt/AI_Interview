import { BreethMemoryEntity, ReasoningLog } from './memoryTypes';

export class ReasoningStorage {
  /**
   * Stores explanatory reasoning explaining WHY a conclusion was reached.
   */
  public static storeReasoning(
    memory: BreethMemoryEntity,
    questionId: string,
    concept: string,
    whyExplanation: string,
    followUpReason: string
  ): BreethMemoryEntity {
    const log: ReasoningLog = {
      timestamp: new Date().toISOString(),
      questionId,
      concept,
      whyExplanation,
      followUpReason
    };

    memory.reasoningLogs.push(log);
    memory.followUpReasoning.push(`[${concept}]: ${whyExplanation} -> ${followUpReason}`);

    // Maintain backwards compatibility with reasoningHistory
    memory.reasoningHistory.push({
      timestamp: log.timestamp,
      questionId,
      reasoning: `WHY: ${whyExplanation} | NEXT: ${followUpReason}`
    });

    memory.updatedAt = new Date().toISOString();
    return memory;
  }
}
