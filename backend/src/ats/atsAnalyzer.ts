import { AtsAnalysisInput, AtsAnalysisResult, DEFAULT_ATS_WEIGHTS } from './atsTypes';
import { AtsScoring } from './atsScoring';

export class AtsAnalyzer {
  public static analyze(input: AtsAnalysisInput): AtsAnalysisResult {
    const w = DEFAULT_ATS_WEIGHTS;
    const jobDescriptionProvided = Boolean(input.jobDescription && input.jobDescription.trim().length > 0);

    const components = [
      AtsScoring.scoreKeywordMatch(input, w.keywordMatch),
      AtsScoring.scoreSkillsMatch(input, w.skillsMatch),
      AtsScoring.scoreExperienceRelevance(input, w.experienceRelevance),
      AtsScoring.scoreProjectRelevance(input, w.projectRelevance),
      AtsScoring.scoreEducationRelevance(input, w.educationRelevance),
      AtsScoring.scoreFormattingStructure(input, w.formattingStructure),
      AtsScoring.scoreAchievementQuality(input, w.achievementQuality)
    ];

    const overallScore = AtsScoring.computeOverallScore(components);

    const weakest = [...components].sort((a, b) => a.score - b.score).slice(0, 3);
    const topRecommendations = weakest.map(c => {
      if (c.missingItems.length > 0) {
        return `${c.label}: address — ${c.missingItems.slice(0, 3).join('; ')}`;
      }
      return `${c.label}: score is low (${c.score}/100) — consider strengthening this area.`;
    });

    const summary = jobDescriptionProvided
      ? `This CV scores ${overallScore}/100 for AI ATS compatibility against the provided job description. Strongest area: ${[...components].sort((a, b) => b.score - a.score)[0].label}. Weakest area: ${weakest[0].label}.`
      : `This CV scores ${overallScore}/100 for general AI ATS compatibility (no job description was provided, so this reflects structural and content quality only, not role-fit).`;

    return {
      overallScore,
      label: 'AI ATS Compatibility Score',
      jobDescriptionProvided,
      components,
      summary,
      topRecommendations,
      generatedAt: new Date().toISOString()
    };
  }
}
