# AI Interview Agent Backend

Production-quality backend for AI Interview Agent hackathon project in Node.js, Express & TypeScript following Clean Architecture.

## Architecture
- `controllers/` / `routes/`: REST endpoints (/api/interview/start, /api/interview/message, /api/interview/report/:id)
- `candidate/`: Candidate loader (synthetic candidate progress, skills, completed days, weak topics)
- `curriculum/`: Curriculum loader (30-day AI Engineering modules & key topics)
- `interview/`: Interview Engine, Question Planner, Context Manager, Follow-up Generator, Difficulty Adaptation, Feedback Generator
- `prompts/`: Reusable prompt templates
- `models/`: TypeScript interfaces

## Quick Start
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build and run production
npm run build
npm start
```
