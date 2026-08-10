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
   - [Prompt 6: Real-Time Timer & Session Duration Upgrade](#prompt-6-real-time-timer--session-duration-upgrade)
   - [Prompt 7: AI ATS Compatibility Scoring Engine](#prompt-7-ai-ats-compatibility-scoring-engine)
   - [Prompt 8: CV Claim Verification & Contradiction Flagging](#prompt-8-cv-claim-verification--contradiction-flagging)
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
- Upgraded `LLMService` to use `responseMimeType: "application/json"` and `responseSchema` with model `gemini-3.5-flash-lite`.
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

### Prompt 6: Real-Time Timer & Session Duration Upgrade

> **Developer / User Prompt:**
> "The 15 sec initial typing window is too low — upgrade to 30 sec. After that start 3 min timer (upgrade from 2 to 3 mins). Also, if there are 10 questions each, give total 30 mins for the entire interview."

**AI Architectural Response & Implementation:**
- Configured real-time session timer limits in [`InterviewScreen.jsx`](file:///Users/tanishkabatham/Desktop/AI_Interview/frontend/src/pages/InterviewScreen.jsx):
  - `GLOBAL_DURATION_SEC = 1800` (30-minute global session limit for 10 curriculum questions).
  - `QUESTION_DURATION_SEC = 180` (3-minute per-question answer window).
  - `START_TYPING_WINDOW_SEC = 30` (30-second initial window to begin typing before auto-advancing unattempted questions).
- Updated backend global session timeout threshold in [`interviewEngine.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/interviewEngine.ts) to `1,800,000` ms (30 minutes).

---

### Prompt 7: AI ATS Compatibility Scoring Engine

> **Developer / User Prompt:**
> "Build an ATS Scoring Engine module in backend/src/ats (atsAnalyzer.ts, atsScoring.ts, atsTypes.ts) and wire it to POST /api/cv/ats. Calculate weighted mathematical ATS scores across keyword match (20%), skills (25%), experience (20%), projects (15%), education (10%), formatting (5%), and achievements (5%). Label the output clearly as 'AI ATS Compatibility Score'."

**AI Architectural Response & Implementation:**
- Implemented [`atsScoring.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/ats/atsScoring.ts) and [`atsAnalyzer.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/ats/atsAnalyzer.ts).
- Exposed `POST /api/cv/ats` in [`interviewRoutes.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/routes/interviewRoutes.ts).
- Returns explicit `overallAtsScore`, `grade` (A+ to F), `label`, `detectedKeywords`, `missingKeywords`, and component breakdown.

---

### Prompt 8: CV Claim Verification & Contradiction Flagging

> **Developer / User Prompt:**
> "Extend TURN_DECISION_SCHEMA with claimVerification (enum: strong/weak/unverified/not_applicable) and contradictsCv (boolean) + contradictionDetail (string). Update promptTemplates.ts to ask for this explicitly, and aggregate these into the final report's CV claim verification score and inconsistencies list."

**AI Architectural Response & Implementation:**
- Updated [`schemas.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/schemas.ts) with `claimVerification`, `contradictsCv`, and `contradictionDetail`.
- Updated system prompt in [`promptTemplates.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/prompts/promptTemplates.ts).
- Updated [`conversationOrchestrator.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/conversationOrchestrator.ts) and [`feedbackGenerator.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/interview/feedbackGenerator.ts) to extract and display `cvClaimVerificationScore` and `cvInconsistencies` in final reports.

---

## 2. Runtime System Prompts & LLM Orchestration

### Base System Prompt Template

```text
You are an expert principal interviewer conducting a {MODE} interview.

PERSONALITY & BEHAVIORAL DIRECTIVES:
- You are calm, professional, respectful, curious, technically knowledgeable, and objective.
- NEVER use fake praise or cheerleading phrases like "Great answer!", "Awesome!", "Fantastic!", "Perfect!", or "Excellent! Let's move on!".
- Acknowledge what the candidate actually said in their previous answer with a grounded, 1-2 sentence professional observation.
- Ask exactly ONE clear, specific, CV-grounded question per turn. Never ask multiple questions in one prompt.

CV CLAIM VERIFICATION (mandatory, every turn):
- If the question being answered tests a specific CV claim (a named technology, a specific responsibility, a stated achievement), judge whether the candidate's answer genuinely demonstrates they did what the CV says. Set claimVerification to "strong" if they explain it correctly and specifically, "weak" if they cannot substantiate it, "unverified" if the answer is ambiguous, or "not_applicable" if this turn is not testing a specific claim.
- If anything the candidate says conflicts with a fact stated on their CV (e.g. CV says "led a team of 5" but they describe working alone), set contradictsCv to true and describe the specific conflict in contradictionDetail.

ENDING THE INTERVIEW:
- You will be told the current coverage status (topics covered vs. uncovered) and the number of questions asked so far. Only set decision.type to CLOSE_INTERVIEW if at least 8 questions have been asked AND the uncovered-topics list is empty.

CANDIDATE CV SUMMARY:
{CV_CONTEXT}
{BREETH_MEMORY_CONTEXT}
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
        "misconception": { "type": "STRING" },
        "claimVerification": {
          "type": "STRING",
          "enum": ["strong", "weak", "unverified", "not_applicable"]
        },
        "contradictsCv": { "type": "BOOLEAN" },
        "contradictionDetail": { "type": "STRING" }
      },
      "required": ["quality", "technicalDepth", "communication", "confidence", "claimVerification", "contradictsCv"]
    },
    "decision": {
      "type": "OBJECT",
      "properties": {
        "type": { "type": "STRING", "enum": ["FOLLOW_UP", "NEW_TOPIC", "CLOSE_INTERVIEW"] },
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
Evaluate this {MODE} interview for the candidate, incorporating both live transcript performance and Breeth historical graph memory.

CANDIDATE CV:
{CV_CONTEXT}
{BREETH_MEMORY_CONTEXT}

INTERVIEW TRANSCRIPT:
{TRANSCRIPT}

Return ONLY valid JSON with this exact structure:
{
  "technicalScore": 0-100,
  "communicationScore": 0-100,
  "problemSolvingScore": 0-100,
  "confidenceScore": 0-100,
  "cvClaimVerificationScore": 0-100,
  "cvInconsistencies": ["array of direct conflicts between candidate statements and CV"],
  "strengths": ["array of observed strengths"],
  "weaknesses": ["array of observed gaps"],
  "misconceptions": ["array of technical misconceptions"],
  "topicsCovered": ["list of topics covered"],
  "recommendations": ["actionable recommendations"],
  "suggestedRevisions": ["specific topics to strengthen"],
  "overallSummary": "2-3 sentence honest summary",
  "modeSpecificNote": "observation relevant to mode"
}
```

---

## 5. Sample Execution Traces (Live Interview Prompts & LLM Outputs)

### Trace 1: Detailed Technical Response (RAG Architecture)

**Candidate Input:**
> "In our project, we implemented hybrid search combining Milvus dense vector embeddings (HNSW M=16, efConstruction=200) with gRPC connection pooling in FastAPI. We used reciprocal rank fusion (RRF) to re-rank results."

**Gemini Model Structured Output (`TURN_DECISION_SCHEMA` Response):**
```json
{
  "evaluation": {
    "quality": "correct",
    "technicalDepth": 5,
    "communication": 5,
    "confidence": 4,
    "strength": "Articulated Reciprocal Rank Fusion (RRF), HNSW indexing parameters, and gRPC connection pooling clearly.",
    "missingInfo": "Did not specify chunk overlap strategy or embedding dimension size.",
    "misconception": null,
    "claimVerification": "strong",
    "contradictsCv": false,
    "contradictionDetail": ""
  },
  "decision": {
    "type": "FOLLOW_UP",
    "difficulty": "advanced",
    "topic": "Milvus Vector DB & Chunking Strategy",
    "reasoning": "Candidate demonstrated strong technical understanding of HNSW indexing and hybrid search; probing chunking size and latency trade-offs."
  },
  "acknowledgement": "You've outlined a solid hybrid retrieval pipeline using reciprocal rank fusion between Milvus HNSW indexing and dense embeddings.",
  "question": "How did you determine your specific chunking size and overlap strategy to balance retrieval context quality against token latency?"
}
```

---

### Trace 2: CV Contradiction Detected (Exaggerated Claim)

**Candidate Input:**
> "Honestly I worked alone on that project, I did not lead any team. I just installed Docker on a single virtual machine."

**Gemini Model Structured Output (`TURN_DECISION_SCHEMA` Response):**
```json
{
  "evaluation": {
    "quality": "incorrect",
    "technicalDepth": 1,
    "communication": 3,
    "confidence": 2,
    "strength": "Admitted working alone rather than continuing to claim team leadership.",
    "missingInfo": "Did not demonstrate multi-region Kubernetes cluster knowledge.",
    "misconception": "Equated single-node Docker VM installation with multi-region 500 GPU Kubernetes cluster architecture.",
    "claimVerification": "weak",
    "contradictsCv": true,
    "contradictionDetail": "CV claims 'Architected global multi-region Kubernetes cluster across 500 GPUs' and leading 25 engineers, but candidate stated they worked alone on a single VM."
  },
  "decision": {
    "type": "NEW_TOPIC",
    "difficulty": "intermediate",
    "topic": "Docker Containerization",
    "reasoning": "Candidate explicitly disavowed major CV claim; shifting to probe basic hands-on Docker experience."
  },
  "acknowledgement": "You noted that you worked alone and deployed Docker on a single virtual machine rather than managing a multi-region Kubernetes cluster.",
  "question": "Given your experience with Docker container management, can you explain how you configure container networking and resource limits for workloads running on a node?"
}
```
