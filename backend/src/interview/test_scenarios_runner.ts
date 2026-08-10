import dotenv from 'dotenv';
dotenv.config();

import { InterviewEngine } from './interviewEngine';
import { AtsAnalyzer } from '../ats/atsAnalyzer';
import { CandidateProfile } from '../models/interfaces';
import { LLMService } from '../services/llmService';

// Candidate 1: Strong Candidate (Deep technical knowledge, detailed architectural answers)
const STRONG_CANDIDATE_PROFILE: CandidateProfile = {
  name: 'Sophia Chen',
  email: 'sophia.chen@example.com',
  education: ['MS Computer Science, Stanford University'],
  skills: ['Python', 'TypeScript', 'Distributed Systems', 'RAG', 'Vector DBs', 'Kubernetes', 'Kafka'],
  programmingLanguages: ['Python', 'TypeScript', 'Go'],
  frameworks: ['React', 'FastAPI', 'PyTorch', 'LangChain'],
  tools: ['Docker', 'Kubernetes', 'Helm', 'Milvus', 'Kafka'],
  projects: [
    'Built real-time RAG pipeline handling 10k QPS with Milvus and Gemini 2.0',
    'Designed distributed stream processing platform using Kafka and Go'
  ],
  internships: [],
  workExperience: ['Staff AI Systems Engineer at TechScale Inc (4 years)'],
  certifications: ['AWS Certified Solutions Architect Professional'],
  achievements: ['Reduced vector retrieval P99 latency from 180ms to 24ms'],
  rawSummary: 'Staff AI Systems Engineer specializing in high-throughput RAG and vector database architectures.'
};

const STRONG_CANDIDATE_ANSWERS = [
  "In our RAG architecture, we used Milvus with HNSW indexing (M=16, efConstruction=200) paired with gRPC connection pooling in FastAPI. To handle 10k QPS, we implemented a two-tier cache with Redis for exact query embeddings and semantic caching using cosine similarity threshold 0.94. For chunking, we used hybrid parent-child document chunking with 512 token child windows and 1536 token parent contexts.",
  "When scale exceeded single-node memory limits, we migrated to Milvus distributed cluster mode with QueryNodes decoupled from IndexNodes using Apache Kafka as the write log WAL. Write paths are asynchronous while read queries hit in-memory segment replicas with consistent hashing.",
  "To handle tail latency during high concurrency, we tuned Kubernetes HPA based on custom Prometheus metrics (vector_query_duration_seconds) rather than CPU utilization. We set socket timeout at 150ms with hedged requests sent to backup replicas if P95 crossed 40ms.",
  "For model evaluation, we deployed a custom evaluation pipeline calculating Normalized Discounted Cumulative Gain (NDCG@10) and ROUGE-L against ground truth benchmark datasets. We continuously fine-tuned embedding representations using contrastive loss on domain-specific pair data."
];

// Candidate 2: Average Candidate (Basic recall, surface-level explanations, lacks depth)
const AVERAGE_CANDIDATE_PROFILE: CandidateProfile = {
  name: 'Marcus Vance',
  email: 'marcus.vance@example.com',
  education: ['BS Information Technology, State University'],
  skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
  programmingLanguages: ['Python', 'JavaScript'],
  frameworks: ['React', 'Express.js'],
  tools: ['Docker', 'Git', 'PostgreSQL'],
  projects: ['E-commerce web application with React and Node.js'],
  internships: ['Web Developer Intern at Local Dev Shop (6 months)'],
  workExperience: ['Junior Fullstack Developer at WebSolutions (1.5 years)'],
  certifications: [],
  achievements: ['Integrated Stripe payment gateway'],
  rawSummary: 'Junior developer with experience in React, Node, and web development.'
};

const AVERAGE_CANDIDATE_ANSWERS = [
  "I built the backend using Node.js and Express. I created REST APIs for products and cart endpoints and stored data in PostgreSQL.",
  "For state management in React, I used useState and useContext hooks to store user login state and shopping cart items.",
  "I don't know much about database query optimization, but we added basic indexes on user ID in PostgreSQL to make queries faster.",
  "We used Docker to package the application into containers and pushed them to Docker Hub so we could deploy them on a server."
];

// Candidate 3: Exaggerated Candidate (Claims advanced Kubernetes & Distributed Systems leadership on CV, but gives incorrect answers or contradicts CV)
const EXAGGERATED_CANDIDATE_PROFILE: CandidateProfile = {
  name: 'Jordan Blake',
  email: 'jordan.blake@example.com',
  education: ['BS Computer Science'],
  skills: ['Kubernetes', 'Distributed Systems', 'LLM Infrastructure', 'Python', 'C++'],
  programmingLanguages: ['Python', 'C++'],
  frameworks: ['PyTorch'],
  tools: ['Kubernetes', 'Docker'],
  projects: ['Architected global multi-region Kubernetes cluster for LLM training across 500 GPUs'],
  internships: [],
  workExperience: ['Principal Distributed Systems Architect (5 years)'],
  certifications: ['Certified Kubernetes Administrator (CKA)'],
  achievements: ['Led team of 25 infrastructure engineers'],
  rawSummary: 'Principal Distributed Systems Architect specializing in GPU cluster orchestration.'
};

const EXAGGERATED_CANDIDATE_ANSWERS = [
  "Honestly I worked alone on that project, I did not lead any team. I just installed Docker on a single virtual machine.",
  "Kubernetes is basically just a database where you store JSON files. You run Kubernetes by typing npm start on your laptop.",
  "I don't really know C++ or GPU architecture, someone else wrote the C++ code.",
  "I am not sure how multi-region clusters work, we just ran everything on one local desktop computer."
];

async function runScenarioTest(
  scenarioName: string,
  profile: CandidateProfile,
  answers: string[],
  targetJobDescription: string
) {
  console.log(`\n======================================================================`);
  console.log(`🚀 RUNNING SCENARIO: ${scenarioName} (${profile.name})`);
  console.log(`======================================================================`);

  const engine = new InterviewEngine();
  const session = await engine.startInterview(profile, 'technical', 'intermediate');
  console.log(`[Session Created] ID: ${session.sessionId}`);
  console.log(`[Initial Question 1 (CV Grounded)]:\n${session.questions[0].promptText}\n`);

  let currentDifficulty = session.difficulty;
  const turnsData: Array<{ turn: number; difficulty: string; topic: string; claimVerification: string; contradictsCv: boolean }> = [];

  for (let turnIdx = 0; turnIdx < answers.length; turnIdx++) {
    const candidateAnswer = answers[turnIdx];
    console.log(`--- TURN ${turnIdx + 1} ---`);
    console.log(`Candidate Answer: "${candidateAnswer}"`);

    const result = await engine.handleMessage(session.sessionId, candidateAnswer);

    const updatedSession = engine.getSession(session.sessionId)!;
    currentDifficulty = updatedSession.difficulty;

    console.log(`AI Response (Source: ${result.nextDifficulty}):`);
    console.log(`Reply Text:\n${result.reply}\n`);
    console.log(`Updated Difficulty Level: ${currentDifficulty}`);

    const lastLog = updatedSession.timedQuestions?.[turnIdx];
    turnsData.push({
      turn: turnIdx + 1,
      difficulty: currentDifficulty,
      topic: lastLog?.topic || 'N/A',
      claimVerification: 'evaluated',
      contradictsCv: false
    });
  }

  // Generate Final Report
  console.log(`\n--- Generating Final Evaluation Report ---`);
  const report = await engine.getReport(session.sessionId);

  console.log(`[Final Feedback Scores]:`);
  console.log(`  - Technical Score: ${report?.feedback.technicalScore}/100`);
  console.log(`  - Communication Score: ${report?.feedback.communicationScore}/100`);
  console.log(`  - Problem Solving Score: ${report?.feedback.problemSolvingScore}/100`);
  console.log(`  - Confidence Score: ${report?.feedback.confidenceScore}/100`);
  console.log(`  - CV Claim Verification Score: ${report?.feedback.cvClaimVerificationScore}/100`);
  console.log(`  - CV Inconsistencies Detected:`, report?.feedback.cvInconsistencies || []);
  console.log(`  - Strengths:`, report?.feedback.strengths);
  console.log(`  - Weaknesses:`, report?.feedback.weaknesses);
  console.log(`  - Topics Covered:`, report?.feedback.topicsCovered);
  console.log(`  - Summary: ${report?.feedback.overallSummary}`);

  // Run ATS Analysis
  console.log(`\n--- Running ATS Analysis ---`);
  const atsResult = await AtsAnalyzer.analyzeProfile(profile, targetJobDescription);
  console.log(`[ATS Analysis Result]:`);
  console.log(`  - Score: ${atsResult.overallAtsScore}/100 (Grade: ${atsResult.grade})`);
  console.log(`  - Label: "${atsResult.label}"`);
  console.log(`  - Matched Keywords:`, atsResult.detectedKeywords);
  console.log(`  - Missing Keywords:`, atsResult.missingKeywords);
  console.log(`  - Breakdown:`, atsResult.breakdown);

  return {
    scenarioName,
    candidateName: profile.name,
    finalTechnicalScore: report?.feedback.technicalScore,
    cvClaimScore: report?.feedback.cvClaimVerificationScore,
    inconsistenciesCount: report?.feedback.cvInconsistencies?.length || 0,
    atsScore: atsResult.overallAtsScore,
    atsGrade: atsResult.grade,
    turnsData
  };
}

async function main() {
  console.log('⚡ STARTING COMPLETE AI REASONING FLOW INTEGRATION TESTS ⚡\n');

  const jd = 'Seeking Senior AI & Infrastructure Engineer skilled in Python, Kubernetes, RAG, Distributed Systems, Docker, and Microservices.';

  const r1 = await runScenarioTest('Scenario 1: Strong Candidate', STRONG_CANDIDATE_PROFILE, STRONG_CANDIDATE_ANSWERS, jd);
  const r2 = await runScenarioTest('Scenario 2: Average Candidate', AVERAGE_CANDIDATE_PROFILE, AVERAGE_CANDIDATE_ANSWERS, jd);
  const r3 = await runScenarioTest('Scenario 3: Exaggerated Candidate', EXAGGERATED_CANDIDATE_PROFILE, EXAGGERATED_CANDIDATE_ANSWERS, jd);

  console.log('\n======================================================================');
  console.log('📊 COMPARATIVE ANALYSIS & VERIFICATION SUMMARY');
  console.log('======================================================================');
  console.table([
    {
      Scenario: r1.scenarioName,
      Candidate: r1.candidateName,
      TechScore: `${r1.finalTechnicalScore}/100`,
      ClaimScore: `${r1.cvClaimScore}/100`,
      Inconsistencies: r1.inconsistenciesCount,
      AtsScore: `${r1.atsScore}/100 (${r1.atsGrade})`
    },
    {
      Scenario: r2.scenarioName,
      Candidate: r2.candidateName,
      TechScore: `${r2.finalTechnicalScore}/100`,
      ClaimScore: `${r2.cvClaimScore}/100`,
      Inconsistencies: r2.inconsistenciesCount,
      AtsScore: `${r2.atsScore}/100 (${r2.atsGrade})`
    },
    {
      Scenario: r3.scenarioName,
      Candidate: r3.candidateName,
      TechScore: `${r3.finalTechnicalScore}/100`,
      ClaimScore: `${r3.cvClaimScore}/100`,
      Inconsistencies: r3.inconsistenciesCount,
      AtsScore: `${r3.atsScore}/100 (${r3.atsGrade})`
    }
  ]);

  console.log('\n✅ ALL INTEGRATION SCENARIO TESTS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('❌ Scenario test runner failed:', err);
  process.exit(1);
});
