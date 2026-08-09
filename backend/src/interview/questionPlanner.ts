import { CandidateProfile, DifficultyLevel, InterviewMode, Question } from '../models/interfaces';
import { CurriculumLoader } from '../curriculum/curriculumLoader';

export class QuestionPlanner {
  /**
   * Plans an interview question set grounded in both the candidate's CV and the
   * 30-Day AI Engineer Curriculum.
   *
   * Enforces requirement A2: minimum 8 questions across at least 4 curriculum days.
   * Enforces requirement A6: incorporates candidate learning progress & weak topics.
   * Enforces requirement A7: grounds each question in explicit curriculum modules/days.
   */
  public static planQuestions(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    difficulty: DifficultyLevel
  ): Question[] {
    const questions: Question[] = [];
    const curriculum = CurriculumLoader.getCurriculum();
    const candidateData = CurriculumLoader.getCandidate();

    // 1. Gather candidate CV anchors
    const cvAnchors = QuestionPlanner.getCvAnchors(cvProfile, mode);

    // 2. Select 5 distinct curriculum days spanning at least 4 different modules
    // Days: 3 (Mod 1), 8 (Mod 2), 14 (Mod 3), 20 (Mod 4), 26 (Mod 5)
    const curriculumDays = [3, 8, 14, 20, 26, 5, 11, 17, 23, 29];

    // Target total count: minimum 8 questions (up to 10)
    const TARGET_COUNT = Math.max(8, Math.min(cvAnchors.length + candidateData.weakTopics.length, 10));

    for (let i = 0; i < TARGET_COUNT; i++) {
      const day = curriculumDays[i % curriculumDays.length];
      const module = CurriculumLoader.getModuleForDay(day);
      const dayTopic = module ? module.keyTopics[i % module.keyTopics.length] : 'AI Engineering Core';

      // Pick corresponding CV anchor if available, else generate curriculum anchor
      const anchor = cvAnchors[i] || QuestionPlanner.getFallbackAnchor(cvProfile, dayTopic);

      // Check if candidate has a documented weak topic related to this day/area
      const matchingWeakness = candidateData.weakTopics.find(wt =>
        wt.toLowerCase().includes(dayTopic.toLowerCase()) ||
        (anchor.topic && wt.toLowerCase().includes(anchor.topic.toLowerCase()))
      ) || (i < candidateData.weakTopics.length ? candidateData.weakTopics[i] : undefined);

      let questionText = '';
      if (matchingWeakness) {
        questionText = `[Curriculum Day ${day} - ${module?.title || 'Core'}] Based on your background with "${anchor.cvFact}", let's address your growth focus in "${matchingWeakness}". How do you approach this technical challenge at ${difficulty} level?`;
      } else {
        questionText = `[Curriculum Day ${day} - ${module?.title || 'Core'}] ` + QuestionPlanner.formatCvQuestion(anchor, mode, difficulty, dayTopic);
      }

      questions.push({
        questionId: `q-${mode}-d${day}-${i + 1}`,
        topic: anchor.topic || dayTopic,
        difficulty,
        promptText: questionText,
        expectedKeyPoints: [...anchor.keyPoints, `Curriculum Day ${day} (${dayTopic})`],
        cvGrounding: anchor.cvFact,
        curriculumDay: day,
        curriculumModule: module?.title || 'AI Engineering'
      });
    }

    return questions;
  }

  private static getCvAnchors(
    cvProfile: CandidateProfile,
    mode: InterviewMode
  ): Array<{ topic: string; cvFact: string; keyPoints: string[] }> {
    const anchors: Array<{ topic: string; cvFact: string; keyPoints: string[] }> = [];

    if (mode === 'technical') {
      cvProfile.projects.forEach(project => {
        anchors.push({
          topic: 'Project Architecture',
          cvFact: project,
          keyPoints: ['System design decisions', 'Tech stack choices', 'Scalability & concurrency', 'Performance bottlenecks']
        });
      });

      cvProfile.programmingLanguages.forEach(lang => {
        anchors.push({
          topic: `${lang} Engineering`,
          cvFact: `${lang} listed as programming language`,
          keyPoints: [`Advanced ${lang} idioms`, 'Memory management', 'Asynchronous execution', 'Design patterns']
        });
      });

      cvProfile.frameworks.forEach(fw => {
        anchors.push({
          topic: `${fw} Architecture`,
          cvFact: `${fw} listed as framework/library`,
          keyPoints: [`${fw} architecture`, 'State management & hooks', 'Optimization techniques', 'Production deployments']
        });
      });

      cvProfile.tools.forEach(tool => {
        anchors.push({
          topic: `${tool} Infrastructure`,
          cvFact: `${tool} listed in tools`,
          keyPoints: [`${tool} setup & orchestration`, 'CI/CD pipeline integration', 'Monitoring & recovery']
        });
      });
    } else if (mode === 'hr') {
      cvProfile.education.forEach(edu => {
        anchors.push({
          topic: 'Academic Foundation',
          cvFact: edu,
          keyPoints: ['Key learnings', 'Coursework application', 'Academic projects']
        });
      });

      cvProfile.internships.forEach(intern => {
        anchors.push({
          topic: 'Internship Experience',
          cvFact: intern,
          keyPoints: ['Role & responsibilities', 'Mentorship & collaboration', 'Key deliverables', 'Career growth']
        });
      });

      cvProfile.workExperience.forEach(work => {
        anchors.push({
          topic: 'Work Experience & Impact',
          cvFact: work,
          keyPoints: ['Project ownership', 'Team cross-collaboration', 'Business impact delivered']
        });
      });

      cvProfile.achievements.forEach(ach => {
        anchors.push({
          topic: 'Professional Recognition',
          cvFact: ach,
          keyPoints: ['Context of achievement', 'Initiative taken', 'Outcomes']
        });
      });
    } else if (mode === 'behavioral') {
      const experiences = [
        ...cvProfile.projects.map(p => ({ fact: p, type: 'Project Experience' })),
        ...cvProfile.workExperience.map(w => ({ fact: w, type: 'Professional Experience' })),
        ...cvProfile.internships.map(i => ({ fact: i, type: 'Internship Role' }))
      ];

      experiences.forEach((exp, idx) => {
        anchors.push({
          topic: `Behavioral: ${exp.type} #${idx + 1}`,
          cvFact: exp.fact,
          keyPoints: ['STAR situation framework', 'Conflict resolution', 'Leadership & ownership', 'Lessons learned']
        });
      });
    } else {
      // Mixed mode
      if (cvProfile.projects.length > 0) {
        anchors.push({
          topic: 'Technical Architecture',
          cvFact: cvProfile.projects[0],
          keyPoints: ['System design', 'Tech choices', 'Performance']
        });
      }
      if (cvProfile.workExperience.length > 0 || cvProfile.internships.length > 0) {
        const exp = cvProfile.workExperience[0] || cvProfile.internships[0];
        anchors.push({
          topic: 'Professional Collaboration',
          cvFact: exp,
          keyPoints: ['Role impact', 'Teamwork', 'Deliverables']
        });
      }
      if (cvProfile.programmingLanguages.length > 0) {
        anchors.push({
          topic: `${cvProfile.programmingLanguages[0]} Core Concepts`,
          cvFact: cvProfile.programmingLanguages[0],
          keyPoints: ['Language paradigms', 'Best practices']
        });
      }
      if (cvProfile.education.length > 0) {
        anchors.push({
          topic: 'Academic Background',
          cvFact: cvProfile.education[0],
          keyPoints: ['Education background', 'Continuous learning']
        });
      }
    }

    if (anchors.length < 8) {
      cvProfile.skills.forEach(skill => {
        anchors.push({
          topic: `Skill Proficiency: ${skill}`,
          cvFact: `${skill} listed as skill`,
          keyPoints: [`Hands-on ${skill} experience`, 'Real-world application', 'Trade-offs']
        });
      });
    }

    return anchors;
  }

  private static getFallbackAnchor(
    cvProfile: CandidateProfile,
    dayTopic: string
  ): { topic: string; cvFact: string; keyPoints: string[] } {
    const mainSkill = cvProfile.skills[0] || cvProfile.programmingLanguages[0] || 'Software Engineering';
    return {
      topic: `${dayTopic} in ${mainSkill}`,
      cvFact: `${mainSkill} experience`,
      keyPoints: [`Applying ${dayTopic}`, 'Architecture choices', 'Production readiness']
    };
  }

  private static formatCvQuestion(
    anchor: { topic: string; cvFact: string; keyPoints: string[] },
    mode: InterviewMode,
    difficulty: DifficultyLevel,
    dayTopic?: string
  ): string {
    const factSnippet = anchor.cvFact.length > 100 ? `${anchor.cvFact.substring(0, 95)}…` : anchor.cvFact;
    const topicRef = dayTopic ? ` (focusing on ${dayTopic})` : '';

    if (mode === 'technical') {
      return `Looking at your experience with "${factSnippet}"${topicRef}, walk me through the key architectural decisions you made, the specific trade-offs involved, and how you ensured system reliability at ${difficulty} level.`;
    } else if (mode === 'hr') {
      return `Regarding "${factSnippet}"${topicRef}, what were your primary responsibilities, how did you collaborate with your team, and what was the key outcome of your work?`;
    } else if (mode === 'behavioral') {
      return `Tell me about a specific technical challenge or team disagreement you faced while working on "${factSnippet}"${topicRef}. How did you navigate the situation and what did you learn?`;
    }
    return `Can you elaborate on your work with "${factSnippet}"${topicRef} and explain how that experience shaped your technical problem-solving approach?`;
  }
}
