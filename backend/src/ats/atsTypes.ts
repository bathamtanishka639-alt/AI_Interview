import { CandidateProfile } from '../models/interfaces';

export interface AtsScoreBreakdown {
  keywordMatchScore: number;        // Weight 20%
  skillsMatchScore: number;         // Weight 25%
  experienceRelevanceScore: number; // Weight 20%
  projectRelevanceScore: number;    // Weight 15%
  educationRelevanceScore: number;  // Weight 10%
  formattingStructureScore: number; // Weight 5%
  achievementQualityScore: number;  // Weight 5%
}

export interface AtsAnalysisResult {
  overallAtsScore: number; // 0-100 weighted
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  label: string; // "AI ATS Compatibility Score"
  targetRole: string;
  isJobDescriptionProvided: boolean;
  breakdown: AtsScoreBreakdown;
  detectedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  summary: string;
}
