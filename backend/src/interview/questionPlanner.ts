import { CandidateProfile, DifficultyLevel, InterviewMode, Question } from '../models/interfaces';
import { CurriculumLoader } from '../curriculum/curriculumLoader';

/**
 * QuestionPlanner no longer writes the interview. It produces a ranked, CV-grounded
 * topic plan that seeds the interview's scope (total questions, priority order,
 * curriculum grounding) and generates ONLY the opening question — the one text the
 * candidate actually sees verbatim. Every question after that is generated live by
 * ConversationOrchestrator based on the candidate's real answers; this planner's job
 * is to make sure the orchestrator always has a well-ordered, non-redundant list of
 * CV topics to draw from, prioritized toward what matters most (weak topics first,
 * then projects, then core skills).
 */

interface CvAnchor {
  topic: string;
  cvFact: string;
  keyPoints: string[];
  priority: number; // higher = should be covered earlier
}

export class QuestionPlanner {
  public static planQuestions(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    difficulty: DifficultyLevel
  ): Question[] {
    const candidateData = CurriculumLoader.getCandidate();
    const anchors = QuestionPlanner.getRankedCvAnchors(cvProfile, mode, candidateData.weakTopics);

    if (anchors.length === 0) {
      // CV had nothing usable for this mode — fall back to a single generic
      // CV-summary opener rather than crashing the interview.
      return [QuestionPlanner.buildFallbackQuestion(cvProfile, mode, difficulty)];
    }

    // Bound the plan size: never fewer than 8 (spec minimum), never more than the
    // number of genuinely distinct CV anchors we found, capped at 12 to keep the
    // interview within a reasonable duration.
    const targetCount = Math.max(8, Math.min(anchors.length, 12));

    const curriculumDays = [3, 8, 14, 20, 26, 5, 11, 17, 23, 29];
    const plan: Question[] = [];

    for (let i = 0; i < targetCount; i++) {
      const anchor = anchors[i % anchors.length];
      const day = curriculumDays[i % curriculumDays.length];
      const module = CurriculumLoader.getModuleForDay(day);

      plan.push({
        questionId: `q-${mode}-${i + 1}`,
        topic: anchor.topic,
        difficulty,
        // Only index 0's promptText is ever shown to the candidate (used as the
        // interview's opening line in interviewEngine.startInterview). Every other
        // slot's promptText is a fallback only used if the orchestrator's live
        // Gemini call fails outright — so it must still be a real, usable question,
        // not a placeholder string.
        promptText:
          i === 0
            ? QuestionPlanner.buildOpeningQuestion(anchor, mode)
            : QuestionPlanner.buildFallbackText(anchor, mode),
        expectedKeyPoints: anchor.keyPoints,
        cvGrounding: anchor.cvFact,
        curriculumDay: day,
        curriculumModule: module?.title || 'AI Engineering'
      });
    }

    return plan;
  }

  private static buildOpeningQuestion(anchor: CvAnchor, mode: InterviewMode): string {
    if (mode === 'technical' || mode === 'mixed') {
      return `You mentioned "${anchor.cvFact}" on your CV. Could you walk me through the overall architecture and the key technical decisions behind it?`;
    }
    if (mode === 'behavioral') {
      return `You listed "${anchor.cvFact}" as part of your experience. Can you walk me through your specific role and what you were responsible for?`;
    }
    return `I see "${anchor.cvFact}" on your CV. Could you tell me more about that experience and what you took away from it?`;
  }

  private static buildFallbackText(anchor: CvAnchor, mode: InterviewMode): string {
    // Used only if Gemini is unreachable for an entire turn — needs to stand on
    // its own as a coherent question, not read as a template.
    if (mode === 'technical' || mode === 'mixed') {
      return `Regarding "${anchor.cvFact}", what was the most significant technical challenge you had to solve, and how did you approach it?`;
    }
    if (mode === 'behavioral') {
      return `Thinking about "${anchor.cvFact}", describe a moment where something didn't go as planned — how did you handle it?`;
    }
    return `Can you elaborate on "${anchor.cvFact}" and how it connects to the role you're interviewing for?`;
  }

  private static buildFallbackQuestion(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    difficulty: DifficultyLevel
  ): Question {
    return {
      questionId: `q-${mode}-1`,
      topic: 'General Background',
      difficulty,
      promptText: `Could you walk me through your background and the experience most relevant to this role, ${cvProfile.name || 'there'}?`,
      expectedKeyPoints: ['Relevant experience', 'Clear communication'],
      cvGrounding: 'General CV summary',
      curriculumDay: undefined,
      curriculumModule: 'AI Engineering'
    };
  }

  /**
   * Builds a priority-ranked, de-duplicated anchor list from real CV content.
   * Weak topics (from CurriculumLoader candidate data) are ranked highest so the
   * interview naturally gravitates toward areas that most need probing, without
   * hardcoding that as a rigid "always ask weak topics first" rule — priority is
   * a ranking signal for the planner, not a guarantee the orchestrator follows
   * turn-by-turn (the orchestrator still decides dynamically based on answers).
   */
  private static getRankedCvAnchors(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    weakTopics: string[]
  ): CvAnchor[] {
    const anchors: CvAnchor[] = [];
    const seenTopics = new Set<string>();

    const push = (topic: string, cvFact: string, keyPoints: string[], priority: number) => {
      const norm = topic.toLowerCase().trim();
      if (seenTopics.has(norm) || !cvFact) return;
      seenTopics.add(norm);
      anchors.push({ topic, cvFact, keyPoints, priority });
    };

    const isWeak = (label: string) =>
      weakTopics.some(wt => label.toLowerCase().includes(wt.toLowerCase()) || wt.toLowerCase().includes(label.toLowerCase()));

    if (mode === 'technical' || mode === 'mixed') {
      (cvProfile.projects || []).forEach(project => {
        push('Project Architecture', project, [
          'System design decisions', 'Tech stack choices', 'Scalability & concurrency', 'Performance bottlenecks'
        ], isWeak(project) ? 10 : 8);
      });
      (cvProfile.programmingLanguages || []).forEach(lang => {
        push(`${lang} Engineering`, `${lang} listed as a programming language`, [
          `Advanced ${lang} idioms`, 'Memory/resource management', 'Asynchronous execution', 'Design patterns'
        ], isWeak(lang) ? 9 : 6);
      });
      (cvProfile.frameworks || []).forEach(fw => {
        push(`${fw} Architecture`, `${fw} listed as a framework/library`, [
          `${fw} architecture`, 'State management', 'Optimization techniques', 'Production deployment'
        ], isWeak(fw) ? 9 : 6);
      });
      (cvProfile.tools || []).forEach(tool => {
        push(`${tool} Infrastructure`, `${tool} listed as a tool`, [
          `${tool} setup & orchestration`, 'CI/CD integration', 'Monitoring & recovery'
        ], isWeak(tool) ? 8 : 5);
      });
    }

    if (mode === 'hr' || mode === 'mixed') {
      (cvProfile.workExperience || []).forEach(w => push('Work Experience', w, ['Role & responsibilities', 'Impact delivered', 'Career growth'], 7));
      (cvProfile.internships || []).forEach(i => push('Internship Experience', i, ['Role & responsibilities', 'Mentorship & collaboration', 'Key deliverables'], 6));
      (cvProfile.education || []).forEach(e => push('Academic Foundation', e, ['Key learnings', 'Coursework application'], 4));
      (cvProfile.achievements || []).forEach(a => push('Achievement', a, ['Context', 'Impact', 'What it demonstrates'], 5));
      (cvProfile.certifications || []).forEach(c => push('Certification', c, ['Depth of knowledge gained', 'Practical application'], 4));
    }

    if (mode === 'behavioral' || mode === 'mixed') {
      (cvProfile.projects || []).forEach(p => push('Team Collaboration', p, ['Ownership', 'Conflict handling', 'Adaptability'], 6));
      (cvProfile.workExperience || []).forEach(w => push('Workplace Behavior', w, ['Deadline pressure', 'Team dynamics', 'Decision-making'], 6));
    }

    if (anchors.length === 0) {
      (cvProfile.skills || []).forEach(s => push(s, s, ['General understanding'], 3));
    }

    return anchors.sort((a, b) => b.priority - a.priority);
  }
}
