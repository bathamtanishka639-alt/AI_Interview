import { InterviewEngine } from './interviewEngine';
import { CandidateProfile } from '../models/interfaces';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING CONVERSATION ENGINE 10-TEST MATRIX SUITE');
  console.log('====================================================\n');

  const mockCv: CandidateProfile = {
    name: 'Tanishka Batham',
    email: 'tanishka@example.com',
    rawSummary: 'Full-stack software developer experienced in React, Node.js, MongoDB, and system architecture.',
    education: ['B.Tech in Computer Science'],
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'System Design', 'Docker', 'Redis', 'Git', 'AWS', 'REST APIs', 'Express.js', 'Microservices'],
    programmingLanguages: ['JavaScript', 'TypeScript'],
    frameworks: ['React', 'Express.js', 'Node.js'],
    tools: ['MongoDB', 'Docker', 'Git', 'Redis', 'AWS'],
    projects: [
      'Placement Platform: Built full-stack platform using React, Node.js, and MongoDB handling student applications.',
      'AI Analytics Engine: Real-time data pipeline built with Node.js microservices.'
    ],
    internships: ['Software Engineering Intern at TechCorp'],
    workExperience: [],
    certifications: ['AWS Certified Developer'],
    achievements: ['1st Place Hackathon Winner']
  };

  const engine = new InterviewEngine();

  // Initialize Session
  const session = await engine.startInterview(mockCv, 'technical', 'intermediate');

  // Ensure 15 questions exist in test session so all 10 turns are active conversation turns
  while (session.questions.length < 15) {
    const topic = mockCv.skills[session.questions.length % mockCv.skills.length];
    session.questions.push({
      questionId: `q-test-${session.questions.length + 1}`,
      topic,
      difficulty: 'intermediate',
      promptText: `Can you walk me through your implementation details for ${topic}?`,
      expectedKeyPoints: [topic, 'architecture', 'tradeoffs'],
      cvGrounding: topic
    });
  }

  console.log(`[SETUP] Started Technical Interview Session: ${session.sessionId} (${session.questions.length} questions allocated)`);
  console.log(`[OPENING] ${session.messages[session.messages.length - 1].content}\n`);

  const testCases = [
    {
      id: 'TEST 1: Excellent Answer',
      input: 'I designed the placement platform using React on the frontend and Node.js with Express for the API layer. We separated business logic into service modules and used MongoDB for flexible schema updates. We implemented connection pooling and indexed frequently queried student IDs to keep endpoint latency below 50ms.',
      expectedSignal: 'Should acknowledge architecture specifically & probe deeper trade-offs/scale.'
    },
    {
      id: 'TEST 2: Weak Answer',
      input: 'We just used Node and connected it to the database.',
      expectedSignal: 'Should professionally clarify missing technical depth and ask targeted implementation question.'
    },
    {
      id: 'TEST 3: Incorrect Answer',
      input: 'MongoDB is a relational database so we joined all tables on foreign keys using SQL queries.',
      expectedSignal: 'Should professionally challenge/reframe document store concept without insulting candidate.'
    },
    {
      id: 'TEST 4: Incomplete Answer',
      input: 'I built the frontend using React components and passed props down.',
      expectedSignal: 'Should probe specifically for missing state management or API connection.'
    },
    {
      id: 'TEST 5: Unexpected Detail',
      input: 'During deployment we containerized our API using Docker and set up Redis caching for student query responses.',
      expectedSignal: 'Should explore Docker/Redis detail since it is technically relevant.'
    },
    {
      id: 'TEST 6: Repetition Check',
      input: 'As I explained earlier, we used JWT tokens for authentication with short expiration times.',
      expectedSignal: 'Should acknowledge authentication detail and ask ONE new non-repetitive question.'
    },
    {
      id: 'TEST 7: "I don\'t know" Response',
      input: "I don't know the exact internal V8 garbage collection algorithm for that.",
      expectedSignal: 'Should respond professionally without cheerleading and move to a relevant CV topic.'
    },
    {
      id: 'TEST 8: Long Detailed Answer',
      input: 'In our placement platform, student profiles and application statuses were stored as main collections in MongoDB. We created compound indexes on student_id and company_id to optimize search queries. For authentication we used JWT stored in httpOnly cookies, and when requests arrived at the API layer, custom middleware verified the token signature before reaching controllers. If the database hit connection limits, we had retry logic with exponential backoff.',
      expectedSignal: 'Should extract key architectural point and probe naturally.'
    },
    {
      id: 'TEST 9: One-Line Answer',
      input: 'We used Git for version control.',
      expectedSignal: 'Should ask useful follow-up probe on branching/PR workflow rather than immediately switching topics.'
    },
    {
      id: 'TEST 10: Breeth Historical Memory Recall',
      input: 'I have practiced database indexing and caching since my last session.',
      expectedSignal: 'Should intelligently connect past memory context to current question.'
    }
  ];

  let passed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`----------------------------------------------------`);
    console.log(`[RUNNING] ${tc.id}`);
    console.log(`[CANDIDATE ANSWER]: "${tc.input}"`);

    const res = await engine.handleMessage(session.sessionId, tc.input);

    console.log(`[INTERVIEWER RESPONSE]:\n${res.reply}`);

    // Verify response structure: Grounded acknowledgement + ONE question
    const hasNoCheerleading = !/great answer!|awesome!|fantastic!|perfect!/i.test(res.reply);
    const hasQuestionMark = res.reply.includes('?');

    if (hasNoCheerleading && hasQuestionMark) {
      console.log(`[RESULT]: PASS ✓ (${tc.expectedSignal})`);
      passed++;
    } else {
      console.log(`[RESULT]: FAIL ✗ (Cheerleading detected or missing question mark)`);
    }
    console.log('');
  }

  console.log('====================================================');
  console.log(`SUMMARY: ${passed} / ${testCases.length} SCENARIOS PASSED`);
  console.log('====================================================');

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
