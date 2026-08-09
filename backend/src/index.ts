import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './routes/interviewRoutes';
import { LoggerMiddleware } from './middleware/logger';
import { ErrorMiddleware } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(LoggerMiddleware.log);

app.use('/api', interviewRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'AI Interview Agent Backend',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      'GET /api/candidate',
      'GET /api/curriculum',
      'POST /api/interview/start',
      'POST /api/interview/message',
      'GET /api/interview/report/:id'
    ]
  });
});

app.use(ErrorMiddleware.handle);

app.listen(PORT, () => {
  console.log(`[Server] AI Interview Agent backend running on port ${PORT}`);
});

export default app;
