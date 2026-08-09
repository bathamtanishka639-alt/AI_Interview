import { CandidateProfile, DifficultyLevel, InterviewMode, Question } from '../models/interfaces';

export class QuestionPlanner {
  /**
   * Plans an interview question set grounded in the candidate's CV without wasting API credits.
   * Dynamically constructs tailored CV questions directly from candidate's extracted profile.
   */
  public static planQuestions(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    difficulty: DifficultyLevel
  ): Question[] {
    const questions: Question[] = [];
    const anchors = QuestionPlanner.getCvAnchors(cvProfile, mode);

    for (let i = 0; i < Math.min(anchors.length, 5); i++) {
      const anchor = anchors[i];
      const questionText = QuestionPlanner.formatCvQuestion(anchor, mode, difficulty);

      questions.push({
        questionId: `q-${mode}-${i + 1}`,
        topic: anchor.topic,
        difficulty,
        promptText: questionText,
        expectedKeyPoints: anchor.keyPoints,
        cvGrounding: anchor.cvFact
      });
    }

    if (questions.length === 0) {
      questions.push(QuestionPlanner.fallbackQuestion(cvProfile, mode, difficulty));
    }

    return questions;
  }

  private static getCvAnchors(cvProfile: CandidateProfile, mode: InterviewMode): Array<{ topic: string; cvFact: string; keyPoints: string[] }> {
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

    if (anchors.length < 3) {
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

  private static formatCvQuestion(
    anchor: { topic: string; cvFact: string; keyPoints: string[] },
    mode: InterviewMode,
    difficulty: DifficultyLevel
  ): string {
    const factSnippet = anchor.cvFact.length > 100 ? `${anchor.cvFact.substring(0, 95)}…` : anchor.cvFact;

    if (mode === 'technical') {
      return `Looking at your experience with "${factSnippet}", walk me through the key architectural decisions you made, the specific trade-offs involved, and how you ensured system reliability at ${difficulty} level.`;
    } else if (mode === 'hr') {
      return `Regarding "${factSnippet}", what were your primary responsibilities, how did you collaborate with your team, and what was the key outcome of your work?`;
    } else if (mode === 'behavioral') {
      return `Tell me about a specific technical challenge or team disagreement you faced while working on "${factSnippet}". How did you navigate the situation and what did you learn?`;
    }
    return `Can you elaborate on your work with "${factSnippet}" and explain how that experience shaped your technical problem-solving approach?`;
  }

  private static fallbackQuestion(cvProfile: CandidateProfile, mode: InterviewMode, difficulty: DifficultyLevel): Question {
    const firstSkill = cvProfile.skills[0] || cvProfile.programmingLanguages[0] || 'your primary technology';
    return {
      questionId: 'q-fallback-1',
      topic: firstSkill,
      difficulty,
      promptText: `Walk me through your experience with ${firstSkill} and explain a complex technical problem you solved using it.`,
      expectedKeyPoints: ['Concrete problem solving', 'Technical depth', 'Trade-offs'],
      cvGrounding: `${firstSkill} from CV skills`
    };
  }
}
