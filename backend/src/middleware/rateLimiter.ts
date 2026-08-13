import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests allowed per window per IP
  message?: string; // Custom error message
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please try again later.' } = options;
  const clients = new Map<string, ClientRecord>();

  // Periodically clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP address
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const now = Date.now();
    let record = clients.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      clients.set(clientIp, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTimeSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', resetTimeSec);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSec: resetTimeSec
      });
    }

    next();
  };
}

// 1. CV Upload & Parsing Rate Limiter: Max 10 requests per 15 mins
export const uploadAndParseRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many CV upload or parsing requests. Please wait a few minutes before trying again.'
});

// 2. Gemini Interview Turn Execution Rate Limiter: Max 30 requests per 15 mins
export const geminiInterviewRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many interview message requests. Please wait a few minutes before sending more messages.'
});

// 3. Global API Rate Limiter: Max 100 requests per 15 mins
export const globalApiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests from this IP address. Please try again later.'
});
