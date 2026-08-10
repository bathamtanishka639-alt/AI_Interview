import { AtsAnalysisInput, AtsScoreComponent } from './atsTypes';

const STOPWORDS = new Set(['the','a','an','and','or','of','to','in','for','with','on','at','by','is','are','was','were','be','this','that']);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function extractKeywords(jobDescription: string): string[] {
  const tokens = tokenize(jobDescription);
  const freq = new Map<string, number>();
  tokens.forEach(t => freq.set(t, (freq.get(t) || 0) + 1));
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([word]) => word);
}

export class AtsScoring {
  public static scoreKeywordMatch(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    if (!input.jobDescription) {
      return {
        label: 'Keyword Match',
        score: 0,
        weight,
        rationale: 'No job description provided — keyword match not applicable.',
        matchedItems: [],
        missingItems: []
      };
    }
    const jdKeywords = extractKeywords(input.jobDescription);
    const cvTokens = new Set(tokenize(input.rawCvText));
    const matched = jdKeywords.filter(k => cvTokens.has(k));
    const missing = jdKeywords.filter(k => !cvTokens.has(k)).slice(0, 15);
    const score = jdKeywords.length ? Math.round((matched.length / jdKeywords.length) * 100) : 0;

    return {
      label: 'Keyword Match',
      score,
      weight,
      rationale: `${matched.length} of ${jdKeywords.length} top job-description keywords found in the CV text.`,
      matchedItems: matched,
      missingItems: missing
    };
  }

  public static scoreSkillsMatch(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    const cvSkills = [
      ...(input.cvProfile.skills || []),
      ...(input.cvProfile.programmingLanguages || []),
      ...(input.cvProfile.frameworks || []),
      ...(input.cvProfile.tools || [])
    ].map(s => s.toLowerCase());

    if (!input.jobDescription) {
      return {
        label: 'Skills Match',
        score: cvSkills.length > 0 ? Math.min(100, cvSkills.length * 8) : 0,
        weight,
        rationale: cvSkills.length
          ? `${cvSkills.length} distinct skills/tools/frameworks listed on the CV (no job description to match against, so this reflects breadth only).`
          : 'No skills, languages, frameworks, or tools detected on the CV.',
        matchedItems: cvSkills,
        missingItems: []
      };
    }

    const jdTokens = tokenize(input.jobDescription);
    const jdTokenSet = new Set(jdTokens);
    const matched = cvSkills.filter(s => s.split(/\s+/).some(part => jdTokenSet.has(part)));
    const uniqueJdSkillLikeTerms = Array.from(new Set(jdTokens)).filter(t => t.length > 2);
    const missing = uniqueJdSkillLikeTerms
      .filter(t => !cvSkills.some(s => s.includes(t)))
      .slice(0, 10);
    const score = cvSkills.length ? Math.round((matched.length / Math.max(cvSkills.length, 1)) * 100) : 0;

    return {
      label: 'Skills Match',
      score: Math.min(100, score),
      weight,
      rationale: `${matched.length} of ${cvSkills.length} listed skills appear relevant to the job description.`,
      matchedItems: matched,
      missingItems: missing
    };
  }

  public static scoreExperienceRelevance(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    const experience = [...(input.cvProfile.workExperience || []), ...(input.cvProfile.internships || [])];
    if (experience.length === 0) {
      return {
        label: 'Experience Relevance',
        score: 0,
        weight,
        rationale: 'No work experience or internships detected on the CV.',
        matchedItems: [],
        missingItems: []
      };
    }

    if (!input.jobDescription) {
      const score = Math.min(100, experience.length * 20);
      return {
        label: 'Experience Relevance',
        score,
        weight,
        rationale: `${experience.length} experience entr${experience.length === 1 ? 'y' : 'ies'} found (no job description to assess relevance against).`,
        matchedItems: experience,
        missingItems: []
      };
    }

    const jdTokens = new Set(tokenize(input.jobDescription));
    const relevant = experience.filter(e => tokenize(e).some(t => jdTokens.has(t)));
    const score = Math.round((relevant.length / experience.length) * 100);

    return {
      label: 'Experience Relevance',
      score,
      weight,
      rationale: `${relevant.length} of ${experience.length} experience entries share terminology with the job description.`,
      matchedItems: relevant,
      missingItems: experience.filter(e => !relevant.includes(e))
    };
  }

  public static scoreProjectRelevance(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    const projects = input.cvProfile.projects || [];
    if (projects.length === 0) {
      return {
        label: 'Project Relevance',
        score: 0,
        weight,
        rationale: 'No projects detected on the CV.',
        matchedItems: [],
        missingItems: []
      };
    }
    if (!input.jobDescription) {
      return {
        label: 'Project Relevance',
        score: Math.min(100, projects.length * 25),
        weight,
        rationale: `${projects.length} project${projects.length === 1 ? '' : 's'} found (no job description to assess relevance against).`,
        matchedItems: projects,
        missingItems: []
      };
    }
    const jdTokens = new Set(tokenize(input.jobDescription));
    const relevant = projects.filter(p => tokenize(p).some(t => jdTokens.has(t)));
    const score = Math.round((relevant.length / projects.length) * 100);
    return {
      label: 'Project Relevance',
      score,
      weight,
      rationale: `${relevant.length} of ${projects.length} projects share terminology with the job description.`,
      matchedItems: relevant,
      missingItems: projects.filter(p => !relevant.includes(p))
    };
  }

  public static scoreEducationRelevance(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    const education = input.cvProfile.education || [];
    if (education.length === 0) {
      return {
        label: 'Education Relevance',
        score: 0,
        weight,
        rationale: 'No education entries detected on the CV.',
        matchedItems: [],
        missingItems: []
      };
    }
    if (!input.jobDescription) {
      return {
        label: 'Education Relevance',
        score: 70,
        weight,
        rationale: `${education.length} education entr${education.length === 1 ? 'y' : 'ies'} found — general presence check only, no job description provided.`,
        matchedItems: education,
        missingItems: []
      };
    }
    const jdTokens = new Set(tokenize(input.jobDescription));
    const relevant = education.filter(e => tokenize(e).some(t => jdTokens.has(t)));
    const score = relevant.length > 0 ? 90 : 50;
    return {
      label: 'Education Relevance',
      score,
      weight,
      rationale: relevant.length
        ? `Education background overlaps with terms in the job description (${relevant.join('; ')}).`
        : 'Education entries present but no direct overlap with job description terminology found.',
      matchedItems: relevant,
      missingItems: []
    };
  }

  public static scoreFormattingStructure(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    const text = input.rawCvText || '';
    const issues: string[] = [];
    const good: string[] = [];

    const hasBullets = /(^|\n)\s*[•\-*]/.test(text);
    hasBullets ? good.push('Uses bullet points') : issues.push('No bullet points detected — ATS parsers favor bulleted content');

    const hasClearSections = /(experience|education|skills|projects)/i.test(text);
    hasClearSections ? good.push('Clear section headings present') : issues.push('No standard section headings (Experience/Education/Skills) detected');

    const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const avgWordsPerLine = lineCount ? wordCount / lineCount : 0;
    if (avgWordsPerLine > 0 && avgWordsPerLine < 25) {
      good.push('Reasonable line density (not a dense wall of text)');
    } else if (avgWordsPerLine >= 25) {
      issues.push('Text is dense — long unbroken lines can hurt ATS and human readability');
    }

    const hasTables = /\t{2,}|\|.*\|/.test(text);
    hasTables && issues.push('Possible table/column formatting detected — many ATS parsers misread tables');

    const score = Math.max(0, Math.min(100, 100 - issues.length * 20));

    return {
      label: 'Formatting & Structure',
      score,
      weight,
      rationale: issues.length
        ? `${issues.length} formatting concern(s) found that could affect ATS parsing.`
        : 'No major ATS-unfriendly formatting patterns detected.',
      matchedItems: good,
      missingItems: issues
    };
  }

  public static scoreAchievementQuality(input: AtsAnalysisInput, weight: number): AtsScoreComponent {
    const achievements = input.cvProfile.achievements || [];
    const workExperience = input.cvProfile.workExperience || [];
    const allBullets = [...achievements, ...workExperience];

    if (allBullets.length === 0) {
      return {
        label: 'Achievement Quality',
        score: 0,
        weight,
        rationale: 'No achievements or experience bullets detected to evaluate.',
        matchedItems: [],
        missingItems: []
      };
    }

    const hasQuantifier = (s: string) => /\d/.test(s);
    const hasActionVerb = (s: string) =>
      /^(led|built|designed|implemented|improved|reduced|increased|created|launched|optimized|architected|managed|drove|delivered)/i.test(s.trim());

    const quantified = allBullets.filter(hasQuantifier);
    const actionOriented = allBullets.filter(hasActionVerb);

    const score = Math.round(
      ((quantified.length / allBullets.length) * 60) + ((actionOriented.length / allBullets.length) * 40)
    );

    return {
      label: 'Achievement Quality',
      score,
      weight,
      rationale: `${quantified.length} of ${allBullets.length} entries include measurable results; ${actionOriented.length} of ${allBullets.length} start with a strong action verb.`,
      matchedItems: quantified,
      missingItems: allBullets.filter(b => !hasQuantifier(b) && !hasActionVerb(b))
    };
  }

  public static computeOverallScore(components: AtsScoreComponent[]): number {
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0) || 1;
    const weighted = components.reduce((sum, c) => sum + c.score * c.weight, 0);
    return Math.round(weighted / totalWeight);
  }
}
