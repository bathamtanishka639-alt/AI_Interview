/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} text
 * @property {string} skill
 * @property {'Easy'|'Medium'|'Hard'} difficulty
 *
 * @typedef {Object} TranscriptMessage
 * @property {string} id
 * @property {'agent'|'candidate'} role
 * @property {string} text
 *
 * @typedef {Object} Interview
 * @property {string} id
 * @property {string} candidateName
 * @property {string} role
 * @property {'not_started'|'in_progress'|'completed'} status
 * @property {number} currentQuestionIndex
 * @property {{name: string, level: string}[]} skills
 * @property {Question[]} questions
 * @property {TranscriptMessage[]} transcript
 * @property {number} [overallScore]
 *
 * @typedef {Object} ScoreCardData
 * @property {string} label
 * @property {number} value
 * @property {number} outOf
 *
 * @typedef {Object} Report
 * @property {string} interviewId
 * @property {string} candidateName
 * @property {string} role
 * @property {number} overallScore
 * @property {ScoreCardData[]} scoreCards
 * @property {{tone: 'positive'|'improvement', text: string}[]} feedback
 * @property {{title: string, description: string}[]} recommendations
 */
export {};
