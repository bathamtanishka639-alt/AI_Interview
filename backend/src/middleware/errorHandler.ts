import { Request, Response, NextFunction } from 'express';

export class ErrorMiddleware {
  public static handle(err: any, req: Request, res: Response, next: NextFunction): void {
    console.error(`[Error] ${err.message || err}`);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
}
