# 🤖 Agent Development & Workflow Rules (`AGENTS.md`)

This document defines the development rules, architectural memory guidelines, safety protocols, and coding conventions for autonomous agents operating within this workspace.

---

## 1. Breeth Architectural Memory Protocol

### Guidelines
- **Before Major Architectural Changes**: Retrieve relevant project design decisions, component patterns, and historical context from Breeth using the `search_graph` or `get_entity_view` MCP tools.
- **After Important Architectural Decisions**: Save the decision, context, and rationale to Breeth using `add_episode` or `record_fact`.

### Saved Architectural Decisions

#### Decision 1: Provider-Independent Memory Layer
- **Decision**: Use `MemoryService` abstraction layer in backend instead of direct provider calls.
- **Reasoning**: Keeps the interview engine provider-independent and makes future memory provider swapping clean and isolated.

#### Decision 2: Atomic Single-Turn Structured Output
- **Decision**: Force Gemini native structured output (`responseSchema` with `TURN_DECISION_SCHEMA`) in a single API call per turn.
- **Reasoning**: Solves turn-taking reliability by forcing the model to complete structured evaluation before natural language text is generated, avoiding 2-pass latency.

#### Decision 3: Deterministic Hysteresis Engine
- **Decision**: Difficulty level adjustments are computed via deterministic backend code (`applyHysteresis`), requiring 2 consecutive turns of consistent model signal before changing levels.
- **Reasoning**: Prevents difficulty oscillation on noisy or short answers while maintaining adaptive difficulty.

#### Decision 4: 3-Layer Question Repetition Guard
- **Decision**: Deduplicate candidate questions using exact match, Jaccard similarity (≥ 0.65), and opening phrase matching, triggering a single anti-repeat retry if duplicate detected.
- **Reasoning**: Ensures varied, non-repetitive candidate experiences across multi-turn interviews.

#### Decision 5: Real-Time Session Timing Protocol
- **Decision**: Enforce a 30-minute global session limit (`GLOBAL_DURATION_SEC = 1800`), 3-minute per-question answer window (`QUESTION_DURATION_SEC = 180`), and 30-second initial typing window (`START_TYPING_WINDOW_SEC = 30`).
- **Reasoning**: Accommodates 10 curriculum-grounded questions per session while preventing stalled sessions and allowing candidates time for detailed engineering responses.

#### Decision 6: AI ATS Compatibility Scoring Engine
- **Decision**: Implement a weighted mathematical scoring engine (`AtsScoringEngine`) evaluating Keyword Match (20%), Skills Match (25%), Experience Relevance (20%), Project Relevance (15%), Education Relevance (10%), Formatting (5%), and Achievements (5%).
- **Reasoning**: Provides an explainable, quantitative ATS compatibility score labeled explicitly as "AI ATS Compatibility Score" without claiming to mimic proprietary vendor parser black boxes.

#### Decision 7: Mandatory CV Claim Verification & Contradiction Flagging
- **Decision**: Extend `TURN_DECISION_SCHEMA` with `claimVerification` (`strong` | `weak` | `unverified` | `not_applicable`), `contradictsCv`, and `contradictionDetail`.
- **Reasoning**: Requires Gemini to evaluate whether the candidate substantiated specific CV claims and explicitly flag direct factual contradictions between candidate answers and CV text.

#### Decision 8: Ranked CV Anchor Question Planning
- **Decision**: `QuestionPlanner` ranks candidate CV facts by weak topics, projects, languages, and frameworks to seed the scope (8–12 questions) and opening question, delegating all subsequent turn questions to `ConversationOrchestrator`.
- **Reasoning**: Eliminates pre-written questionnaire filler while ensuring the live orchestrator always has a priority-ranked CV anchor list.

#### Decision 9: Session Recovery & Refresh Persistence
- **Decision**: Persist `cvProfile`, `interviewMode`, and `sessionId` in `sessionStorage`, backed by `GET /api/interview/session/:sessionId` to rebuild chat state and timers on browser reload or network interruption.
- **Reasoning**: Prevents loss of active interview progress when candidates refresh their page or experience temporary Wi-Fi drops.

---

## 2. Safety & Data Loss Prevention Protocol

- **Accidental Data Loss Prevention**: Always verify before running destructive database, file system, or cloud commands.
- **Code Preservations**: Maintain existing documentation, docstrings, and comments unless explicitly instructed to refactor.
- **No Mock Swallowing**: Never fix failing tests or missing data by commenting out assertions or returning dummy empty states silently. Trace upstream root causes.

---

## 3. Tech Stack & Coding Conventions

### Backend (Node.js, Express, TypeScript)
- Strict TypeScript typing across models ([`interfaces.ts`](file:///Users/tanishkabatham/Desktop/AI_Interview/backend/src/models/interfaces.ts)).
- Clean Architecture principles separating route handlers (`routes/`), business logic (`interview/`), prompt templates (`prompts/`), ATS analyzer (`ats/`), and external APIs (`services/`).
- Proper error handling middleware returning clean JSON error responses with standard HTTP status codes (400, 404, 415, 500).

### Frontend (React 18, Vite, TailwindCSS)
- Vanilla CSS tokens and custom utility classes in `index.css`.
- Framer Motion animations for liquid glass transitions, page entrances, and status indicators.
- Accessibility standards: minimum 44px tap targets, distinct `focus-visible` outlines (`#14E0B4`), keyboard nav.
- "Liquid Signal" aesthetic: glassmorphism surfaces, Space Grotesk headings, JetBrains Mono data values.

---

## 4. Verification Workflow

Before completing any development task:
1. Run backend type checking: `cd backend && npx tsc --noEmit`
2. Run frontend build check: `cd frontend && npm run build`
3. Execute runtime integration tests: `node ./dist/interview/test_scenarios_runner.js`
