import { BreethMemoryEntity, BreethConfig } from './memoryTypes';

export class BreethClient {
  private config: BreethConfig;
  private memoryStore: Map<string, BreethMemoryEntity> = new Map();
  private baseUrl: string = 'https://api.thebreeth.com/v1';

  constructor(config?: BreethConfig) {
    const apiKey = process.env.BREETH_API_KEY || process.env.Breeth_api_key;
    this.config = config || {
      apiKey: apiKey || '',
      mockMode: !apiKey
    };
  }

  private get apiKey(): string {
    return this.config.apiKey || process.env.BREETH_API_KEY || process.env.Breeth_api_key || '';
  }

  public async setMemory(key: string, memory: BreethMemoryEntity): Promise<boolean> {
    const updatedMemory = { ...memory, updatedAt: new Date().toISOString() };
    this.memoryStore.set(key, updatedMemory);

    if (this.apiKey) {
      try {
        const memoryContent = `Candidate ${memory.candidateId} Session ${memory.sessionId}: Strengths [${memory.strengths.join(', ')}], Weaknesses [${memory.weaknesses.join(', ')}], Misconceptions [${memory.misconceptions.join(', ')}], Confidence Score: ${memory.confidenceScore}`;
        
        await fetch(`${this.baseUrl}/episodes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            content: memoryContent,
            group_id: `candidate_${memory.candidateId}`,
            extract_intent: false
          })
        });
      } catch (err: any) {
        console.warn(`[BreethClient] Live API write warning: ${err.message}`);
      }
    }

    return true;
  }

  public async getMemory(key: string): Promise<BreethMemoryEntity | null> {
    return this.memoryStore.get(key) || null;
  }

  public async queryMemory(candidateId: string): Promise<BreethMemoryEntity[]> {
    const localResults: BreethMemoryEntity[] = [];
    for (const [_, mem] of this.memoryStore.entries()) {
      if (mem.candidateId === candidateId) {
        localResults.push(mem);
      }
    }

    if (localResults.length > 0) {
      return localResults;
    }

    if (this.apiKey) {
      try {
        const searchRes = await fetch(`${this.baseUrl}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            query: `candidate ${candidateId} interview memory`,
            group_id: `candidate_${candidateId}`
          })
        });

        if (searchRes.ok) {
        }
      } catch (err: any) {
        console.warn(`[BreethClient] Live API search warning: ${err.message}`);
      }
    }

    return localResults;
  }
}
