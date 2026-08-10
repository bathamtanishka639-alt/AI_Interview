export const TURN_DECISION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    evaluation: {
      type: 'OBJECT',
      description: "Structured evaluation of the candidate's last answer.",
      properties: {
        quality: {
          type: 'STRING',
          enum: ['correct', 'mostly_correct', 'partially_correct', 'incorrect', 'unclear', 'insufficient_evidence'],
          description: 'Overall answer quality classification.'
        },
        technicalDepth: { type: 'INTEGER', description: '1=Basic recall, 2=Application, 3=Implementation, 4=Trade-offs, 5=Architecture/Scale.' },
        communication: { type: 'INTEGER', description: 'Clarity and structure of the answer. 1-5.' },
        confidence: { type: 'INTEGER', description: 'Candidate confidence and assertiveness. 1-5.' },
        strength: { type: 'STRING', description: 'A specific strength demonstrated, or null if none.' },
        missingInfo: { type: 'STRING', description: 'Key technical detail missing, or null if none.' },
        misconception: { type: 'STRING', description: 'A technical misconception detected, or null if none.' },
        claimVerification: {
          type: 'STRING',
          enum: ['strong', 'weak', 'unverified', 'not_applicable'],
          description: 'If the current question tested a specific CV claim (e.g. "implemented JWT auth"), was the candidate able to explain it correctly? "not_applicable" if this question was not testing a specific CV claim.'
        },
        contradictsCv: {
          type: 'BOOLEAN',
          description: 'True if the candidate said something that directly conflicts with what their CV states.'
        },
        contradictionDetail: {
          type: 'STRING',
          description: 'If contradictsCv is true, a one-sentence factual description of the conflict (what the CV says vs. what was said). Empty string otherwise.'
        }
      },
      required: ['quality', 'technicalDepth', 'communication', 'confidence', 'claimVerification', 'contradictsCv']
    },
    decision: {
      type: 'OBJECT',
      description: 'The next-turn decision: probe deeper, move on, or end the interview.',
      properties: {
        type: {
          type: 'STRING',
          enum: ['FOLLOW_UP', 'NEW_TOPIC', 'CLOSE_INTERVIEW'],
          description: 'FOLLOW_UP if incomplete/unclear/worth probing. NEW_TOPIC if sufficiently explored. CLOSE_INTERVIEW only if coverage guidance indicates enough ground has been covered AND at least 8 questions have been asked.'
        },
        difficulty: {
          type: 'STRING',
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          description: 'Recommended difficulty for the next question. The engine applies hysteresis on top of this.'
        },
        topic: {
          type: 'STRING',
          description: "The CV-grounded topic for the next question. Must come from the candidate's actual CV or the provided uncovered-topics list."
        },
        reasoning: { type: 'STRING', description: 'One-sentence explanation of the decision.' }
      },
      required: ['type', 'difficulty', 'topic']
    },
    acknowledgement: {
      type: 'STRING',
      description: '1-2 sentences acknowledging the specific content of the answer. No cheerleading ("Great!", "Awesome!", "Excellent!").'
    },
    question: {
      type: 'STRING',
      description: 'Exactly ONE clear, specific, open-ended, CV-grounded question. Empty string if decision.type is CLOSE_INTERVIEW.'
    }
  },
  required: ['evaluation', 'decision', 'acknowledgement', 'question']
};

export const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3
};

export type ClaimVerification = 'strong' | 'weak' | 'unverified' | 'not_applicable';

export type TurnDecision = {
  evaluation: {
    quality: 'correct' | 'mostly_correct' | 'partially_correct' | 'incorrect' | 'unclear' | 'insufficient_evidence';
    technicalDepth: number;
    communication: number;
    confidence: number;
    strength?: string;
    missingInfo?: string;
    misconception?: string;
    claimVerification: ClaimVerification;
    contradictsCv: boolean;
    contradictionDetail?: string;
  };
  decision: {
    type: 'FOLLOW_UP' | 'NEW_TOPIC' | 'CLOSE_INTERVIEW';
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    topic: string;
    reasoning?: string;
  };
  acknowledgement: string;
  question: string;
};
