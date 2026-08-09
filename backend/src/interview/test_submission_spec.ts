import express from 'express';
import router from '../routes/interviewRoutes';

async function runSubmissionSpecTest() {
  console.log('====================================================');
  console.log('TESTING POST /api/interview HACKATHON SUBMISSION SPEC');
  console.log('====================================================\n');

  const app = express();
  app.use(express.json());
  app.use('/api', router);

  const server = app.listen(8089, async () => {
    try {
      const sessionId = `test-spec-${Date.now()}`;

      // 1. Test Start Session
      console.log('1. Testing Start Session (POST /api/interview)...');
      const startRes = await fetch('http://localhost:8089/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          candidate: {
            name: 'Tanishka Batham',
            targetRole: 'Full Stack Engineer',
            skills: ['React', 'Node.js', 'MongoDB']
          }
        })
      });

      const startData: any = await startRes.json();
      console.log('Start Response:', JSON.stringify(startData, null, 2));

      if (!startData.reply || startData.done !== false) {
        throw new Error('Start Session contract failed: expected reply string and done: false');
      }
      console.log('✓ Start Session Contract PASSED\n');

      // 2. Test Conversation Turn
      console.log('2. Testing Conversation Turn (POST /api/interview)...');
      const turnRes = await fetch('http://localhost:8089/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: 'I designed the API layer using Node.js and Express with connection pooling.'
        })
      });

      const turnData: any = await turnRes.json();
      console.log('Turn Response:', JSON.stringify(turnData, null, 2));

      if (!turnData.reply || typeof turnData.done !== 'boolean') {
        throw new Error('Conversation Turn contract failed: expected reply string and done boolean');
      }
      console.log('✓ Conversation Turn Contract PASSED\n');

      console.log('====================================================');
      console.log('SUCCESS: POST /api/interview SPEC CONTRACT 100% VERIFIED');
      console.log('====================================================');
      server.close();
      process.exit(0);
    } catch (err: any) {
      console.error('Spec Test Failed:', err.message);
      server.close();
      process.exit(1);
    }
  });
}

runSubmissionSpecTest();
