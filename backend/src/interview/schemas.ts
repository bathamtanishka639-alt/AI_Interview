/**
 * TURN_DECISION_SCHEMA
 *
 * The authoritative Gemini responseSchema for a single interview turn.
 * This schema enforces that the model MUST complete structured reasoning
 * (evaluate → decide → respond) before any natural-language output exists.
 *
 * Rules enforced by schema:
 * - evaluation.quality must be one of the 6 allowed enum values
 * - decision.type must be FOLLOW_UP or NEW_TOPIC
 * - decision.difficulty must be one of the 4 DifficultyLevel values
 * - question is a required string (the single next question — no lists allowed)
 * - acknowledgement is a required string (1-2 sentences, no cheerleading)
 */
export const TURN_DECISION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    evaluation: {
      type: 'OBJECT',
      description: 'Structured evaluation of the candidate\'s last answer.',
      properties: {
        quality: {
          type: 'STRING',
          enum: [
            'correct',
            'mostly_correct',
            'partially_correct',
            'incorrect',
            'unclear',
            'insufficient_evidence'
          ],
          description: 'Overall answer quality classification.'
        },
        technicalDepth: {
          type: 'INTEGER',
          description: '1 = Basic recall, 2 = Application, 3 = Implementation, 4 = Trade-offs, 5 = Architecture/Scale. Must be 1–5.'
        },
        communication: {
          type: 'INTEGER',
          description: 'Clarity and structure of the answer. 1–5 scale.'
        },
        confidence: {
          type: 'INTEGER',
          description: 'Candidate confidence and assertiveness. 1–5 scale.'
        },
        strength: {
          type: 'STRING',
          description: 'A specific strength demonstrated in this answer, or null if none.'
        },
        missingInfo: {
          type: 'STRING',
          description: 'Key technical detail missing from the answer, or null if none.'
        },
        misconception: {
          type: 'STRING',
          description: 'A technical misconception detected in the answer, or null if none.'
        }
      },
      required: ['quality', 'technicalDepth', 'communication', 'confidence']
    },
    decision: {
      type: 'OBJECT',
      description: 'The next-turn decision: whether to probe deeper or move to a new CV topic.',
      properties: {
        type: {
          type: 'STRING',
          enum: ['FOLLOW_UP', 'NEW_TOPIC'],
          description: 'FOLLOW_UP if the answer is incomplete, unclear, or contains interesting depth to probe. NEW_TOPIC if the topic is sufficiently explored.'
        },
        difficulty: {
          type: 'STRING',
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          description: 'Recommended difficulty for the next question. The engine applies hysteresis rules on top of this.'
        },
        topic: {
          type: 'STRING',
          description: 'The CV-grounded topic for the next question. Must be from the candidate\'s actual CV.'
        },
        reasoning: {
          type: 'STRING',
          description: 'A one-sentence explanation of why you chose FOLLOW_UP or NEW_TOPIC.'
        }
      },
      required: ['type', 'difficulty', 'topic']
    },
    acknowledgement: {
      type: 'STRING',
      description: '1-2 sentences acknowledging the candidate\'s specific answer. Must reference actual content from their answer. No cheerleading (no "Great!", "Awesome!", "Excellent!").'
    },
    question: {
      type: 'STRING',
      description: 'Exactly ONE clear, specific, open-ended question. Must be grounded in the candidate\'s CV. Never ask multiple questions. Never use bullet lists.'
    }
  },
  required: ['evaluation', 'decision', 'acknowledgement', 'question']
};

/**
 * Difficulty order for hysteresis logic.
 */
export const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3
};

export type TurnDecision = {
  evaluation: {
    quality: 'correct' | 'mostly_correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'insufficient_evidence';
    technicalDepth: number;
    communication: number;
    confidence: number;
    strength?: string;
    missingInfo?: string;
    misconception?: string;
  };
  decision: {
    type: 'FOLLOW_UP' | 'NEW_TOPIC';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    topic: string;
    reasoning?: string;
  };
  acknowledgement: string;
  question: string;
};
