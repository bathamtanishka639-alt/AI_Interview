import { BreethMemoryEntity } from './memoryTypes';

export class PromptContextBuilder {
  public static buildPromptContext(memory: BreethMemoryEntity): string {
    const recentReasoning = memory.reasoningLogs.slice(-2).map(r => `  - [${r.concept}]: WHY: ${r.whyExplanation}`).join('\n');
    const recentEvents = memory.timelineEvents.slice(-4).map(e => `  - [${e.eventType.toUpperCase()}]: ${e.details}`).join('\n');

    return `[BREETH ADAPTIVE MEMORY GRAPH CONTEXT]:
- Candidate Confidence Score: ${memory.confidenceScore}/100
- Verified Strengths: ${memory.strengths.join(', ') || 'None recorded'}
- Active Weaknesses to Probe: ${memory.weaknesses.join(', ') || 'None active'}
- Progressive Resolved Weaknesses: ${memory.resolvedWeaknesses.join(', ') || 'None yet'}
- Technical Misconceptions: ${memory.misconceptions.join('; ') || 'None'}
- Recent Reasoning Memory (WHY conclusions were reached):
${recentReasoning || '  - None yet'}
- Recent Interview Timeline Events:
${recentEvents || '  - None yet'}`;
  }
}
