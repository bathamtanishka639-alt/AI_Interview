import { InterviewEngine } from './interviewEngine';
import { CandidateProfile } from '../models/interfaces';

async function testTimedInterviewSystem() {
  console.log('====================================================');
  console.log('TESTING STRICT TIMED INTERVIEW SYSTEM');
  console.log('====================================================\n');

  const engine = new InterviewEngine();

  const dummyCv: CandidateProfile = {
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    education: ['BS Computer Science'],
    skills: ['Node.js', 'React', 'Docker'],
    programmingLanguages: ['JavaScript', 'TypeScript'],
    frameworks: ['React', 'Express'],
    tools: ['Git', 'Docker'],
    projects: ['Distributed Payment Gateway'],
    internships: [],
    workExperience: ['Backend Engineer at Cyberdyne (3 yrs)'],
    certifications: [],
    achievements: [],
    rawSummary: 'Experienced backend software engineer.'
  };

  // 1. Test Interview Start & Timestamps
  console.log('1. Testing Interview Start & Initial Timestamps...');
  const session = await engine.startInterview(dummyCv, 'technical', 'intermediate');
  console.log('Session ID:', session.sessionId);
  console.log('Started At:', session.interviewStartedAt);
  console.log('Initial Timed Questions:', session.timedQuestions?.length);

  if (!session.interviewStartedAt || !session.timedQuestions || session.timedQuestions.length !== 1) {
    throw new Error('FAILED: Initial timestamps or timedQuestions log missing');
  }
  console.log('✓ Start Timestamps & Question 1 Log PASSED\n');

  // 2. Test TEST A: Not Attempted (15-Second Start Rule Expiry)
  console.log('2. Testing TEST A: Question 1 Not Attempted (15s Start Rule Expiry)...');
  const turn1 = await engine.handleMessage(session.sessionId, '', 'not_attempted');
  const updatedSession1 = engine.getSession(session.sessionId)!;
  const q1Log = updatedSession1.timedQuestions?.[0];
  console.log('Q1 Status:', q1Log?.status);
  console.log('Q1 Duration (s):', q1Log?.durationSeconds);
  if (q1Log?.status !== 'not_attempted') {
    throw new Error(`FAILED: Expected Q1 status 'not_attempted', got '${q1Log?.status}'`);
  }
  console.log('✓ TEST A Not Attempted PASSED\n');

  // 3. Test TEST B & D: Timed Out Answer
  console.log('3. Testing TEST B & D: Question 2 Partial Answer Timed Out...');
  const turn2 = await engine.handleMessage(
    session.sessionId,
    'I initialized Express routes with connection pooling',
    'timed_out',
    new Date(Date.now() - 10000).toISOString()
  );
  const updatedSession2 = engine.getSession(session.sessionId)!;
  const q2Log = updatedSession2.timedQuestions?.[1];
  console.log('Q2 Status:', q2Log?.status);
  console.log('Q2 Answer:', q2Log?.answer);
  if (q2Log?.status !== 'timed_out' || !q2Log?.answer.includes('Express routes')) {
    throw new Error(`FAILED: Expected Q2 status 'timed_out', got '${q2Log?.status}'`);
  }
  console.log('✓ TEST B & D Timed Out Answer PASSED\n');

  // 4. Test TEST C: Early Submission (Answered)
  console.log('4. Testing TEST C: Question 3 Early Submission...');
  const turn3 = await engine.handleMessage(
    session.sessionId,
    'We used Redis cache to handle high concurrency and session tokens.',
    'answered'
  );
  const updatedSession3 = engine.getSession(session.sessionId)!;
  const q3Log = updatedSession3.timedQuestions?.[2];
  console.log('Q3 Status:', q3Log?.status);
  if (q3Log?.status !== 'answered') {
    throw new Error(`FAILED: Expected Q3 status 'answered', got '${q3Log?.status}'`);
  }
  console.log('✓ TEST C Early Submission PASSED\n');

  // 5. Test TEST E: 10-Minute Hard Stop Global Timer Priority
  console.log('5. Testing TEST E: 10-Minute Hard Stop Global Timer Priority...');
  // Simulate session started 10 minutes (601 seconds) ago
  const oldStartedAt = new Date(Date.now() - 601000).toISOString();
  updatedSession3.interviewStartedAt = oldStartedAt;
  updatedSession3.startTime = oldStartedAt;

  const turnFinal = await engine.handleMessage(
    session.sessionId,
    'Final answer before 10 minute limit hit.',
    'timed_out'
  );
  console.log('Final Turn Completed:', turnFinal.isCompleted);
  console.log('Final Reply Snippet:', turnFinal.reply.substring(0, 100));

  const report = await engine.getReport(session.sessionId);
  console.log('\nReport Generated Overview:');
  console.log('- Total Questions:', report?.overview?.totalQuestions);
  console.log('- Answered:', report?.overview?.answeredQuestions);
  console.log('- Timed Out:', report?.overview?.timedOutQuestions);
  console.log('- Not Attempted:', report?.overview?.notAttemptedQuestions);
  console.log('- Duration Seconds:', report?.overview?.interviewDurationSeconds);

  if (!turnFinal.isCompleted || !report?.overview) {
    throw new Error('FAILED: 10-minute hard stop failed to complete interview or report overview missing');
  }

  console.log('\n====================================================');
  console.log('SUCCESS: STRICT TIMED INTERVIEW SYSTEM FULLY VERIFIED');
  console.log('====================================================');
}

testTimedInterviewSystem().catch((err) => {
  console.error('Timed Interview Test Failed:', err);
  process.exit(1);
});
