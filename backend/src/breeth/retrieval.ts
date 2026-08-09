import { BreethMemoryEntity } from './memoryTypes';

export class RetrievalUtility {
  public static filterRelevantMemories(memories: BreethMemoryEntity[], topic: string): string[] {
    const relevantWeaknesses: string[] = [];
    memories.forEach(mem => {
      mem.weaknesses.forEach(w => {
        if (w.toLowerCase().includes(topic.toLowerCase())) {
          relevantWeaknesses.push(w);
        }
      });
    });
    return relevantWeaknesses;
  }

  public static hasAskedConcept(memories: BreethMemoryEntity[], concept: string): boolean {
    return memories.some(m => m.interviewEvents.some(e => e.details.toLowerCase().includes(concept.toLowerCase())));
  }
}
