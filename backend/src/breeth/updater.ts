import { BreethMemoryEntity } from './memoryTypes';

export class MemoryUpdater {
  /**
   * Updates candidate knowledge and applies Progressive Learning to resolve past weaknesses.
   */
  public static updateCandidateKnowledge(
    memory: BreethMemoryEntity,
    newStrength?: string,
    newWeakness?: string,
    newMisconception?: string,
    scoreDelta?: number
  ): BreethMemoryEntity {
    if (newStrength) {
      if (!memory.strengths.includes(newStrength)) {
        memory.strengths.push(newStrength);
      }
      // Progressive Learning: Check if this new strength resolves a previous weakness!
      const resolvedIndex = memory.weaknesses.findIndex(w =>
        w.toLowerCase().includes(newStrength.toLowerCase()) || newStrength.toLowerCase().includes(w.toLowerCase())
      );
      if (resolvedIndex !== -1) {
        const resolved = memory.weaknesses.splice(resolvedIndex, 1)[0];
        if (!memory.resolvedWeaknesses.includes(resolved)) {
          memory.resolvedWeaknesses.push(resolved);
        }
        // Boost confidence score because candidate resolved a previous weakness
        memory.confidenceScore = Math.min(100, memory.confidenceScore + 10);
      }
    }

    if (newWeakness && !memory.weaknesses.includes(newWeakness) && !memory.resolvedWeaknesses.includes(newWeakness)) {
      memory.weaknesses.push(newWeakness);
    }

    if (newMisconception && !memory.misconceptions.includes(newMisconception)) {
      memory.misconceptions.push(newMisconception);
    }

    if (scoreDelta !== undefined) {
      memory.confidenceScore = Math.min(100, Math.max(0, memory.confidenceScore + scoreDelta));
    }

    memory.updatedAt = new Date().toISOString();
    return memory;
  }

  /**
   * Marks a specific weakness as resolved through progressive learning.
   */
  public static resolveWeakness(memory: BreethMemoryEntity, weaknessTopic: string): BreethMemoryEntity {
    const idx = memory.weaknesses.findIndex(w => w.toLowerCase().includes(weaknessTopic.toLowerCase()));
    if (idx !== -1) {
      const resolved = memory.weaknesses.splice(idx, 1)[0];
      if (!memory.resolvedWeaknesses.includes(resolved)) {
        memory.resolvedWeaknesses.push(resolved);
      }
      memory.confidenceScore = Math.min(100, memory.confidenceScore + 12);
    }
    memory.updatedAt = new Date().toISOString();
    return memory;
  }
}
