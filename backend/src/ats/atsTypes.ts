import { CandidateProfile } from '../models/interfaces';

export interface AtsScoreComponent {
  label: string;
  score: number;        // 0-100
  weight: number;       // fraction of total, sums to 1 across all components
  rationale: string;    // human-readable, references actual CV content
  matchedItems: string[];
  missingItems: string[];
}

export interface AtsAnalysisResult {
  overallScore: number;  // 0-100, weighted sum of components
  label: 'AI ATS Compatibility Score'; // explicit — not a claim about real ATS behavior
  jobDescriptionProvided: boolean;
  components: AtsScoreComponent[];
  summary: string;
  topRecommendations: string[];
  generatedAt: string; // ISO timestamp
}

export interface AtsScoringWeights {
  keywordMatch: number;
  skillsMatch: number;
  experienceRelevance: number;
  projectRelevance: number;
  educationRelevance: number;
  formattingStructure: number;
  achievementQuality: number;
}

export const DEFAULT_ATS_WEIGHTS: AtsScoringWeights = {
  keywordMatch: 0.20,
  skillsMatch: 0.20,
  experienceRelevance: 0.20,
  projectRelevance: 0.15,
  educationRelevance: 0.10,
  formattingStructure: 0.05,
  achievementQuality: 0.10
};

export interface AtsAnalysisInput {
  cvProfile: CandidateProfile;
  rawCvText: string;          // needed for formatting/structure checks
  jobDescription?: string;    // optional — general analysis if absent
}
