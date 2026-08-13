import { createRateLimiter } from '../middleware/rateLimiter';

console.log('=== Running Rate Limiter Verification Test ===');

const limiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Custom rate limit exceeded'
});

let passedCount = 0;
let blockedCount = 0;

for (let i = 1; i <= 7; i++) {
  const req = {
    headers: {},
    socket: { remoteAddress: '192.168.1.100' }
  } as any;

  const resHeaders: Record<string, any> = {};
  let statusCode = 200;
  let responseBody: any = null;

  const res = {
    setHeader(name: string, value: any) {
      resHeaders[name] = value;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    }
  } as any;

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  limiter(req, res, next);

  if (nextCalled) {
    passedCount++;
    console.log(`[Request ${i}] PASSED (HTTP 200) - Remaining: ${resHeaders['X-RateLimit-Remaining']}`);
  } else {
    blockedCount++;
    console.log(`[Request ${i}] BLOCKED (HTTP ${statusCode}) - Error: "${responseBody?.error}" - RetryAfterSec: ${responseBody?.retryAfterSec}`);
  }
}

if (passedCount === 5 && blockedCount === 2) {
  console.log('✅ Rate limiter verification test PASSED successfully!');
} else {
  console.error(`❌ Test FAILED. Expected 5 passed & 2 blocked, got ${passedCount} passed & ${blockedCount} blocked.`);
  process.exit(1);
}
