# 🧠 Project Development & AI Prompt Log (`PROMPTS.md`)

This document records the **Development Prompts Log** (prompts given during project architecture & implementation), **Runtime System Prompts**, **Atomic Response Schemas**, and **Execution Traces** for the **AI Technical Interview Platform**.

---

## 📋 Table of Contents
1. [Development Prompts Log (Build & Feature Directives)](#1-development-prompts-log-build--feature-directives)
   - [Prompt 1: Interview Orchestration Engine Architecture](#prompt-1-interview-orchestration-engine-architecture)
   - [Prompt 2: "Liquid Signal" Visual System & UI Redesign](#prompt-2-liquid-signal-visual-system--ui-redesign)
   - [Prompt 3: True Global Drag-and-Drop CV Upload](#prompt-3-true-global-drag-and-drop-cv-upload)
   - [Prompt 4: Strict Single-Section Accordion Landing Page](#prompt-4-strict-single-section-accordion-landing-page)
   - [Prompt 5: Technical Audit & Problem Statement Remediation](#prompt-5-technical-audit--problem-statement-remediation)
2. [Runtime System Prompts & LLM Orchestration](#2-runtime-system-prompts--llm-orchestration)
3. [Atomic Single-Turn Response Schema (`TURN_DECISION_SCHEMA`)](#3-atomic-single-turn-response-schema-turn_decision_schema)
4. [Evaluation & Feedback Generation Prompt](#4-evaluation--feedback-generation-prompt)
5. [Sample Execution Traces (Live Interview Prompts & LLM Outputs)](#5-sample-execution-traces-live-interview-prompts--llm-outputs)

---

## 1. Development Prompts Log (Build & Feature Directives)

### Prompt 1: Interview Orchestration Engine Architecture

> **Developer / User Prompt:**
> "You are a Senior Conversational AI Architect. Implement a real interview orchestration engine, not writing a better prompt.
> Replace the current 'ask → answer → immediately ask next question' logic with a real interview orchestration layer that thinks in discrete stages before producing a response, using Gemini structured output to enforce that thinking.
> The fix is architectural, not rhetorical: force the model to emit a structured decision object BEFORE the natural-language response exists."

**AI Architectural Response & Implementation:**
- Created [`TURN_DECISION_SCHEMA`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/schemas.ts) defining strict JSON schema (`evaluation`, `decision`, `acknowledgement`, `question`).
- Upgraded `LLMService` to use `responseMimeType: "application/json"` and `responseSchema` with model `gemini-2.0-flash`.
- Implemented [`ConversationOrchestrator.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/conversationOrchestrator.ts) to execute atomic `evaluate` → `decide` → `respond` reasoning in a single API call.
- Built [`RepetitionGuard.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/repetitionGuard.ts) (Jaccard similarity ≥ 0.65 deduplication) and [`CoverageTracker.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/coverageTracker.ts).
- Added deterministic hysteresis logic (`applyHysteresis`) requiring 2 consecutive turns of consistent model signal before changing difficulty.

---

### Prompt 2: "Liquid Signal" Visual System & UI Redesign

> **Developer / User Prompt:**
> "You are a senior UI/UX designer and front-end engineer. Redesign the visual layer of this React + Tailwind + Framer Motion app (routes, component props, and API layer must NOT change — only visual/animation code).
> Tone: confident, human, a little playful — blend expressive surface + calm, legible data underneath.
> Aesthetic pillars: liquid glass surfaces, bold gradient signature, oversized type, strategic minimalism on data-heavy screens."

**AI Architectural Response & Implementation:**
- Configured custom design tokens in [`tailwind.config.js`](file:///Users/tanishkabatham/Desktop/AI_Interview/frontend/tailwind.config.js) (signal teal `#14E0B4`, agent violet `#7C7FFB`, amber `#FFB020`, coral `#FF5C72`).
- Enhanced glassmorphism utilities in [`index.css`](file:///Users/tanishkabatham/Desktop/AI_Interview/frontend/src/index.css) (`.glass` backdrop-filter with border lighting).
- Redesigned all shared UI components (`Button`, `Card`, `Badge`, `Modal`, `ProgressBar`, `SignalPulse`).
- Updated all pages (`LandingPage`, `Dashboard`, `InterviewScreen`, `FinalReport`, `NotFound`) with Framer Motion spring physics and JetBrains Mono data styling.

---

### Prompt 3: True Global Drag-and-Drop CV Upload

> **Developer / User Prompt:**
> "Fix the CV upload experience on the landing page. When a user drags a CV file (PDF/DOC/DOCX) anywhere over the webpage:
> 1. Detect dragenter/dragover globally and prevent default browser file opening.
> 2. Show a subtle full-page drag-and-drop overlay: 'Drop your CV anywhere - Release to upload'.
> 3. Drop anywhere inside the webpage, accepting the file without opening the file picker."

**AI Architectural Response & Implementation:**
- Added global `dragenter`, `dragover`, `dragleave`, and `drop` event listeners to `window` in [`LandingPage.jsx`](file:///Users/tanishkabatham/Desktop/AI_Interview/frontend/src/pages/LandingPage.jsx).
- Built a floating glass overlay with Framer Motion backdrop blur (`AnimatePresence`).
- Connected file drop events directly to `handleCvUpload` for PDF & DOCX text extraction without opening native browser file picker dialogs.

---

### Prompt 4: Strict Single-Section Accordion Landing Page

> **Developer / User Prompt:**
> "Fix the landing-page expandable sections to behave as a STRICT SINGLE-SECTION ACCORDION.
> Sections: How it works, Interview Types, Context Driven, Upload your CV.
> Initially show 'Upload your CV' as expanded default. When another tab is clicked, close all other expanded content and show ONLY that section's content."

**AI Architectural Response & Implementation:**
- Refactored `LandingPage.jsx` section state to use a single `activeTab` identifier (`upload` | `howItWorks` | `interviewTypes` | `contextDriven`).
- Enforced mutual exclusivity: expanding one tab automatically unmounts all other section content.
- Cleaned navbar and hero CTAs to maintain focus on the primary upload interface.

---

### Prompt 5: Technical Audit & Problem Statement Remediation

> **Developer / User Prompt:**
> "Verify repository satisfies hackathon requirements (30-day curriculum grounding, minimum 8 questions across 4+ days, candidate progress/weak topics integration, technical spec endpoint compliance)."

**AI Architectural Response & Implementation:**
- Created [`curriculumLoader.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/curriculum/curriculumLoader.ts) to parse `backend/sample/curriculum.json` (30-day AI Engineer curriculum) and `backend/sample/candidate.json` (`completedDays`, `weakTopics`).
- Rewrote [`questionPlanner.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/questionPlanner.ts) to generate **10 questions** spanning **10 curriculum days** (`[3, 8, 14, 20, 26, 5, 11, 17, 23, 29]`) across all 5 modules.
- Updated `POST /api/interview` completion handler in [`interviewRoutes.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/routes/interviewRoutes.ts) to strictly return spec-compliant feedback `{ summary, strengths, gaps, next }`.

---

## 2. Runtime System Prompts & LLM Orchestration

### Base System Prompt Template

```text
You are a Principal {MODE} Technical Interviewer conducting a real, consequential interview.

PERSONALITY RULES (enforced):
- You are calm, precise, intellectually curious, and professionally direct.
- NEVER use generic cheerleading: no "Great!", "Awesome!", "Excellent!", "Perfect!", "That's a great answer!".
- Acknowledge the candidate's actual answer content specifically. Reference what they said.
- You THINK before you speak. Your structured evaluation is completed before your natural-language response is written.

INTERVIEW RULES:
- Ask exactly ONE question per turn. No multiple questions, no bullet lists.
- Every question must be grounded in the candidate's actual CV and curriculum.
- Difficulty management is done by the engine. Output your honest assessment of what difficulty SHOULD be next.
- If the answer is very short (< 20 words) or evasive, choose FOLLOW_UP to probe.
- If the topic is sufficiently explored (3+ exchanges), choose NEW_TOPIC.

OUTPUT: You MUST return a valid JSON object matching the schema exactly. No prose outside the JSON.
```

---

## 3. Atomic Single-Turn Response Schema (`TURN_DECISION_SCHEMA`)

```json
{
  "type": "OBJECT",
  "properties": {
    "evaluation": {
      "type": "OBJECT",
      "properties": {
        "quality": {
          "type": "STRING",
          "enum": ["correct", "mostly_correct", "partially_correct", "incorrect", "unclear", "insufficient_evidence"]
        },
        "technicalDepth": { "type": "INTEGER", "description": "1 to 5 scale" },
        "communication": { "type": "INTEGER", "description": "1 to 5 scale" },
        "confidence": { "type": "INTEGER", "description": "1 to 5 scale" },
        "strength": { "type": "STRING" },
        "missingInfo": { "type": "STRING" },
        "misconception": { "type": "STRING" }
      },
      "required": ["quality", "technicalDepth", "communication", "confidence"]
    },
    "decision": {
      "type": "OBJECT",
      "properties": {
        "type": { "type": "STRING", "enum": ["FOLLOW_UP", "NEW_TOPIC"] },
        "difficulty": { "type": "STRING", "enum": ["beginner", "intermediate", "advanced", "expert"] },
        "topic": { "type": "STRING" },
        "reasoning": { "type": "STRING" }
      },
      "required": ["type", "difficulty", "topic"]
    },
    "acknowledgement": { "type": "STRING" },
    "question": { "type": "STRING" }
  },
  "required": ["evaluation", "decision", "acknowledgement", "question"]
}
```

---

## 4. Evaluation & Feedback Generation Prompt

```text
You are a Principal AI Technical & HR Interview Evaluator.
Analyze the candidate's interview transcript rigorously against their CV and curriculum.

RULES:
- Evaluate technical depth, accuracy, specificity, and communication clarity.
- BE STRICT: If the candidate gave short, generic, evasive, or incorrect answers, assign LOW scores (15-45) and explicitly list weaknesses and misconceptions.
- DO NOT give default high scores to brief or vague answers.
- Base strengths and weaknesses ONLY on what the candidate actually said in the transcript.
- Return ONLY valid JSON with this exact structure:
{
  "technicalScore": 0-100,
  "communicationScore": 0-100,
  "problemSolvingScore": 0-100,
  "confidenceScore": 0-100,
  "strengths": ["array of observed strengths"],
  "weaknesses": ["array of observed gaps"],
  "misconceptions": ["array of technical misconceptions"],
  "topicsCovered": ["list of topics covered"],
  "recommendations": ["actionable recommendations"],
  "suggestedRevisions": ["specific topics to strengthen"],
  "overallSummary": "2-3 sentence honest summary"
}
```

---

## 5. Sample Execution Traces (Live Interview Prompts & LLM Outputs)

### Trace 1: Detailed Technical Response (RAG Architecture)

**Candidate Input:**
> "In our project, we implemented hybrid search combining Pinecone dense vector embeddings (OpenAI text-embedding-3-small) with BM25 sparse keyword retrieval. We used reciprocal rank fusion (RRF) to re-rank results before passing the top 5 chunks into the context window."

**Gemini Model Structured Output (`TURN_DECISION_SCHEMA` Response):**
```json
{
  "evaluation": {
    "quality": "correct",
    "technicalDepth": 4,
    "communication": 5,
    "confidence": 4,
    "strength": "Articulated Reciprocal Rank Fusion (RRF) and hybrid dense/sparse retrieval clearly.",
    "missingInfo": "Did not specify chunk overlap strategy or embedding dimension size.",
    "misconception": null
  },
  "decision": {
    "type": "FOLLOW_UP",
    "difficulty": "advanced",
    "topic": "Vector DB Hybrid Search & Chunking",
    "reasoning": "Candidate demonstrated strong high-level understanding of hybrid search; probing chunking strategy and latency trade-offs."
  },
  "acknowledgement": "You've outlined a solid hybrid retrieval pipeline using reciprocal rank fusion between Pinecone embeddings and BM25.",
  "question": "[Curriculum Day 8 - Advanced Retrieval] How did you determine your specific chunking size and overlap strategy to balance retrieval context against token latency?"
}
```

---

### Trace 2: Evasive Candidate Response ("I don't know")

**Candidate Input:**
> "I don't know much about Kubernetes ingress timeouts."

**Gemini Model Structured Output (`TURN_DECISION_SCHEMA` Response):**
```json
{
  "evaluation": {
    "quality": "insufficient_evidence",
    "technicalDepth": 1,
    "communication": 2,
    "confidence": 1,
    "strength": null,
    "missingInfo": "Did not demonstrate knowledge on Kubernetes ingress timeouts.",
    "misconception": null
  },
  "decision": {
    "type": "NEW_TOPIC",
    "difficulty": "intermediate",
    "topic": "Docker Containerization",
    "reasoning": "Candidate indicated lack of experience with ingress timeouts; pivoting to core containerization skills from CV."
  },
  "acknowledgement": "I see that Kubernetes ingress timeout tuning may not have been part of your primary deployment responsibilities.",
  "question": "[Curriculum Day 25 - Production Deployment] Looking at your experience with Docker listed on your CV, how did you optimize your multi-stage container builds to minimize production image size?"
}
```
