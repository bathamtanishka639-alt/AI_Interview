import { CandidateProfile } from '../models/interfaces';
import { AtsScoreBreakdown, AtsAnalysisResult } from './atsTypes';

export class AtsScoringEngine {
  public static calculateAtsScore(
    cvProfile: CandidateProfile,
    jobDescription?: string
  ): AtsAnalysisResult {
    const isJdProvided = Boolean(jobDescription && jobDescription.trim().length > 30);
    const jdText = (jobDescription || '').toLowerCase();

    // 1. Extract candidate technical terms
    const candidateSkills = [
      ...(cvProfile.skills || []),
      ...(cvProfile.programmingLanguages || []),
      ...(cvProfile.frameworks || []),
      ...(cvProfile.tools || [])
    ].map(s => s.toLowerCase().trim());

    // 2. Compute Keyword Match Score (Weight 20%)
    let detectedKeywords: string[] = [];
    let missingKeywords: string[] = [];
    let keywordScore = 75; // Default baseline when no JD

    if (isJdProvided) {
      const commonTechKeywords = [
        'python', 'javascript', 'typescript', 'react', 'node', 'express', 'docker',
        'kubernetes', 'aws', 'gcp', 'azure', 'sql', 'postgresql', 'mongodb', 'redis',
        'graphql', 'rest', 'api', 'ci/cd', 'git', 'microservices', 'unit testing',
        'rag', 'vector database', 'llm', 'pytorch', 'tensorflow', 'langchain', 'fastapi'
      ];
      
      const jdKeywords = commonTechKeywords.filter(kw => jdText.includes(kw));
      if (jdKeywords.length > 0) {
        detectedKeywords = jdKeywords.filter(kw => candidateSkills.some(cs => cs.includes(kw) || kw.includes(cs)));
        missingKeywords = jdKeywords.filter(kw => !detectedKeywords.includes(kw));
        keywordScore = Math.round((detectedKeywords.length / jdKeywords.length) * 100);
      } else {
        detectedKeywords = candidateSkills.slice(0, 8);
        keywordScore = 80;
      }
    } else {
      detectedKeywords = candidateSkills.slice(0, 10);
      missingKeywords = ['Specify target job description for explicit keyword gap analysis'];
    }

    // 3. Compute Skills Match Score (Weight 25%)
    const skillCount = candidateSkills.length;
    let skillsScore = Math.min(100, Math.round((skillCount / 12) * 100));
    if (skillsScore < 50) skillsScore = 55;

    // 4. Compute Experience Relevance Score (Weight 20%)
    const workExpCount = (cvProfile.workExperience || []).length;
    const internCount = (cvProfile.internships || []).length;
    let expScore = Math.min(100, Math.round((workExpCount * 30) + (internCount * 20) + 40));

    // 5. Compute Project Relevance Score (Weight 15%)
    const projCount = (cvProfile.projects || []).length;
    let projScore = Math.min(100, Math.round(projCount * 25 + 25));
    if (projCount === 0) projScore = 40;

    // 6. Compute Education Relevance Score (Weight 10%)
    const eduCount = (cvProfile.education || []).length;
    const eduScore = eduCount > 0 ? 90 : 60;

    // 7. Compute Formatting / Structure Score (Weight 5%)
    let formatScore = 85;
    if (cvProfile.name && cvProfile.email) formatScore += 10;
    if (skillCount > 3 && projCount > 0) formatScore += 5;
    formatScore = Math.min(100, formatScore);

    // 8. Compute Achievement Quality Score (Weight 5%)
    const achCount = (cvProfile.achievements || []).length + (cvProfile.certifications || []).length;
    const achScore = Math.min(100, 50 + achCount * 25);

    // Weighted Overall Math:
    // Keyword (20%), Skills (25%), Exp (20%), Project (15%), Edu (10%), Format (5%), Achievement (5%)
    const weightedScore = Math.round(
      keywordScore * 0.20 +
      skillsScore * 0.25 +
      expScore * 0.20 +
      projScore * 0.15 +
      eduScore * 0.10 +
      formatScore * 0.05 +
      achScore * 0.05
    );

    const overallAtsScore = Math.max(0, Math.min(100, weightedScore));

    let grade: AtsAnalysisResult['grade'] = 'C';
    if (overallAtsScore >= 90) grade = 'A+';
    else if (overallAtsScore >= 80) grade = 'A';
    else if (overallAtsScore >= 70) grade = 'B';
    else if (overallAtsScore >= 60) grade = 'C';
    else if (overallAtsScore >= 50) grade = 'D';
    else grade = 'F';

    const breakdown: AtsScoreBreakdown = {
      keywordMatchScore: keywordScore,
      skillsMatchScore: skillsScore,
      experienceRelevanceScore: expScore,
      projectRelevanceScore: projScore,
      educationRelevanceScore: eduScore,
      formattingStructureScore: formatScore,
      achievementQualityScore: achScore
    };

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (skillsScore >= 75) strengths.push(`Strong technical skill index (${skillCount} technologies identified).`);
    else improvements.push('Add more explicit technical skills and framework versions.');

    if (projScore >= 75) strengths.push(`Solid project portfolio (${projCount} major projects detected).`);
    else improvements.push('Include detailed technical projects with system design metrics.');

    if (detectedKeywords.length > 0) strengths.push(`Matched ${detectedKeywords.length} core technical keywords.`);
    if (missingKeywords.length > 0 && isJdProvided) improvements.push(`Add missing role keywords: ${missingKeywords.slice(0, 4).join(', ')}.`);

    const targetRole = isJdProvided ? 'Custom Target Role (from Job Description)' : 'General AI & Software Engineering Role';

    const summary = isJdProvided
      ? `Candidate CV achieved an AI ATS Compatibility Score of ${overallAtsScore}/100 (${grade}) against the provided Job Description.`
      : `Candidate CV achieved a general AI ATS Compatibility Score of ${overallAtsScore}/100 (${grade}) across general AI & Software Engineering benchmarks. Provide a specific Job Description for targeted keyword matching.`;

    return {
      overallAtsScore,
      grade,
      label: 'AI ATS Compatibility Score',
      targetRole,
      isJobDescriptionProvided: isJdProvided,
      breakdown,
      detectedKeywords,
      missingKeywords,
      strengths,
      improvements,
      summary
    };
  }
}
