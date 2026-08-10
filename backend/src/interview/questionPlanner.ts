import { CandidateProfile, DifficultyLevel, InterviewMode, Question } from '../models/interfaces';
import { CurriculumLoader } from '../curriculum/curriculumLoader';

interface CvAnchor {
  topic: string;
  cvFact: string;        // internal, used for coverage tracking / logging only
  displayFact: string;   // natural phrase, safe to show the candidate
  keyPoints: string[];
  priority: number;      // higher = should be covered earlier
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
      return [QuestionPlanner.buildFallbackQuestion(cvProfile, mode, difficulty)];
    }

    const targetCount = Math.max(8, Math.min(anchors.length, 10));
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
        promptText:
          i === 0
            ? QuestionPlanner.buildOpeningQuestion(anchor, mode)
            : QuestionPlanner.buildFallbackText(anchor, mode),
        expectedKeyPoints: anchor.keyPoints,
        cvGrounding: anchor.cvFact,
        displayFact: anchor.displayFact,
        curriculumDay: day,
        curriculumModule: module?.title || 'AI Engineering'
      });
    }

    return plan;
  }

  private static buildOpeningQuestion(anchor: CvAnchor, mode: InterviewMode): string {
    if (mode === 'technical' || mode === 'mixed') {
      return `Let's start with ${anchor.displayFact}. Could you walk me through the overall architecture and the key technical decisions behind it?`;
    }
    if (mode === 'behavioral') {
      return `I'd like to hear about ${anchor.displayFact}. Can you walk me through your specific role and what you were responsible for?`;
    }
    return `Tell me more about ${anchor.displayFact} and what you took away from it.`;
  }

  private static buildFallbackText(anchor: CvAnchor, mode: InterviewMode): string {
    if (mode === 'technical' || mode === 'mixed') {
      return `Thinking about ${anchor.displayFact}, what was the most significant technical challenge you had to solve, and how did you approach it?`;
    }
    if (mode === 'behavioral') {
      return `Thinking about ${anchor.displayFact}, describe a moment where something didn't go as planned — how did you handle it?`;
    }
    return `Can you elaborate on ${anchor.displayFact}?`;
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
      displayFact: 'your background and experience',
      curriculumDay: undefined,
      curriculumModule: 'AI Engineering'
    };
  }

  private static getRankedCvAnchors(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    weakTopics: string[]
  ): CvAnchor[] {
    const anchors: CvAnchor[] = [];
    const seenTopics = new Set<string>();

    const push = (topic: string, cvFact: string, displayFact: string, keyPoints: string[], priority: number) => {
      const norm = topic.toLowerCase().trim();
      if (seenTopics.has(norm) || !cvFact) return;
      seenTopics.add(norm);
      anchors.push({ topic, cvFact, displayFact, keyPoints, priority });
    };

    const isWeak = (label: string) =>
      weakTopics.some(wt => label.toLowerCase().includes(wt.toLowerCase()) || wt.toLowerCase().includes(label.toLowerCase()));

    if (mode === 'technical' || mode === 'mixed') {
      (cvProfile.projects || []).forEach(project => {
        push(
          'Project Architecture',
          `Project: ${project}`,
          `your project ${project}`,
          ['System design decisions', 'Tech stack choices', 'Scalability & concurrency', 'Performance bottlenecks'],
          isWeak(project) ? 10 : 8
        );
      });
      (cvProfile.programmingLanguages || []).forEach(lang => {
        push(
          `${lang} Engineering`,
          `${lang} — programming language`,
          `your work with ${lang}`,
          [`Advanced ${lang} idioms`, 'Memory/resource management', 'Asynchronous execution', 'Design patterns'],
          isWeak(lang) ? 9 : 6
        );
      });
      (cvProfile.frameworks || []).forEach(fw => {
        push(
          `${fw} Architecture`,
          `${fw} — framework/library`,
          `the ${fw} work on your CV`,
          [`${fw} architecture`, 'State management', 'Optimization techniques', 'Production deployment'],
          isWeak(fw) ? 9 : 6
        );
      });
      (cvProfile.tools || []).forEach(tool => {
        push(
          `${tool} Infrastructure`,
          `${tool} — tool`,
          `your experience with ${tool}`,
          [`${tool} setup & orchestration`, 'CI/CD integration', 'Monitoring & recovery'],
          isWeak(tool) ? 8 : 5
        );
      });
    }

    if (mode === 'hr' || mode === 'mixed') {
      (cvProfile.workExperience || []).forEach(w =>
        push('Work Experience', `Role: ${w}`, `your experience as ${w}`, ['Role & responsibilities', 'Impact delivered', 'Career growth'], 7)
      );
      (cvProfile.internships || []).forEach(i =>
        push('Internship Experience', `Internship: ${i}`, `your internship as ${i}`, ['Role & responsibilities', 'Mentorship & collaboration', 'Key deliverables'], 6)
      );
      (cvProfile.education || []).forEach(e =>
        push('Academic Foundation', `Degree: ${e}`, `your studies in ${e}`, ['Key learnings', 'Coursework application'], 4)
      );
      (cvProfile.achievements || []).forEach(a =>
        push('Achievement', `Achievement: ${a}`, `your achievement (${a})`, ['Context', 'Impact', 'What it demonstrates'], 5)
      );
      (cvProfile.certifications || []).forEach(c =>
        push('Certification', `Certification: ${c}`, `your certification in ${c}`, ['Depth of knowledge gained', 'Practical application'], 4)
      );
    }

    if (mode === 'behavioral' || mode === 'mixed') {
      (cvProfile.projects || []).forEach(p =>
        push('Team Collaboration', `Project: ${p}`, `your collaboration on ${p}`, ['Ownership', 'Conflict handling', 'Adaptability'], 6)
      );
      (cvProfile.workExperience || []).forEach(w =>
        push('Workplace Behavior', `Role: ${w}`, `your experience handling responsibilities as ${w}`, ['Deadline pressure', 'Team dynamics', 'Decision-making'], 6)
      );
    }

    if (anchors.length === 0) {
      (cvProfile.skills || []).forEach(s =>
        push(s, `Skill: ${s}`, `your experience with ${s}`, ['General understanding'], 3)
      );
    }

    return anchors.sort((a, b) => b.priority - a.priority);
  }
}
