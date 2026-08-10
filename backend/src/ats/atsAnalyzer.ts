import { CandidateProfile } from '../models/interfaces';
import { CvParser } from '../cv/cvParser';
import { AtsScoringEngine } from './atsScoring';
import { AtsAnalysisResult } from './atsTypes';

export class AtsAnalyzer {
  public static async analyzeProfile(
    cvProfile: CandidateProfile,
    jobDescription?: string
  ): Promise<AtsAnalysisResult> {
    return AtsScoringEngine.calculateAtsScore(cvProfile, jobDescription);
  }

  public static async analyzeRawCvText(
    rawCvText: string,
    jobDescription?: string
  ): Promise<AtsAnalysisResult> {
    const profile = await CvParser.parse(rawCvText);
    return AtsScoringEngine.calculateAtsScore(profile, jobDescription);
  }
}
