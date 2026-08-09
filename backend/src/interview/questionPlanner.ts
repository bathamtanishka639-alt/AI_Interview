import { CandidateProfile, DifficultyLevel, InterviewMode, Question } from '../models/interfaces';
import { CurriculumLoader } from '../curriculum/curriculumLoader';

export class QuestionPlanner {
  public static planQuestions(
    cvProfile: CandidateProfile,
    mode: InterviewMode,
    difficulty: DifficultyLevel
  ): Question[] {
    const questions: Question[] = [];
    const curriculum = CurriculumLoader.getCurriculum();
    const candidateData = CurriculumLoader.getCandidate();

    const cvAnchors = QuestionPlanner.getCvAnchors(cvProfile, mode);
    const curriculumDays = [3, 8, 14, 20, 26, 5, 11, 17, 23, 29];

    const TARGET_COUNT = Math.max(8, Math.min(cvAnchors.length + candidateData.weakTopics.length, 10));

    for (let i = 0; i < TARGET_COUNT; i++) {
      const day = curriculumDays[i % curriculumDays.length];
      const module = CurriculumLoader.getModuleForDay(day);
      const dayTopic = module ? module.keyTopics[i % module.keyTopics.length] : 'AI Engineering Core';

      const anchor = cvAnchors[i] || QuestionPlanner.getFallbackAnchor(cvProfile, dayTopic);

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

    const projects = cvProfile.projects || [];
    const programmingLanguages = cvProfile.programmingLanguages || [];
    const frameworks = cvProfile.frameworks || [];
    const tools = cvProfile.tools || [];
    const education = cvProfile.education || [];
    const internships = cvProfile.internships || [];
    const workExperience = cvProfile.workExperience || [];
    const achievements = cvProfile.achievements || [];
    const skills = cvProfile.skills || [];

    if (mode === 'technical') {
      projects.forEach(project => {
        anchors.push({
          topic: 'Project Architecture',
          cvFact: project,
          keyPoints: ['System design decisions', 'Tech stack choices', 'Scalability & concurrency', 'Performance bottlenecks']
        });
      });

      programmingLanguages.forEach(lang => {
        anchors.push({
          topic: `${lang} Engineering`,
          cvFact: `${lang} listed as programming language`,
          keyPoints: [`Advanced ${lang} idioms`, 'Memory management', 'Asynchronous execution', 'Design patterns']
        });
      });

      frameworks.forEach(fw => {
        anchors.push({
          topic: `${fw} Architecture`,
          cvFact: `${fw} listed as framework/library`,
          keyPoints: [`${fw} architecture`, 'State management & hooks', 'Optimization techniques', 'Production deployments']
        });
      });

      tools.forEach(tool => {
        anchors.push({
          topic: `${tool} Infrastructure`,
          cvFact: `${tool} listed in tools`,
          keyPoints: [`${tool} setup & orchestration`, 'CI/CD pipeline integration', 'Monitoring & recovery']
        });
      });
    } else if (mode === 'hr') {
      education.forEach(edu => {
        anchors.push({
          topic: 'Academic Foundation',
          cvFact: edu,
          keyPoints: ['Key learnings', 'Coursework application', 'Academic projects']
        });
      });

      internships.forEach(intern => {
        anchors.push({
          topic: 'Internship Experience',
          cvFact: intern,
          keyPoints: ['Role & responsibilities', 'Mentorship & collaboration', 'Key deliverables', 'Career growth']
        });
      });

      workExperience.forEach(work => {
        anchors.push({
          topic: 'Work Experience & Impact',
          cvFact: work,
          keyPoints: ['Project ownership', 'Team cross-collaboration', 'Business impact delivered']
        });
      });

      achievements.forEach(ach => {
        anchors.push({
          topic: 'Professional Recognition',
          cvFact: ach,
          keyPoints: ['Context of achievement', 'Initiative taken', 'Outcomes']
        });
      });
    } else if (mode === 'behavioral') {
      const experiences = [
        ...projects.map(p => ({ fact: p, type: 'Project Experience' })),
        ...workExperience.map(w => ({ fact: w, type: 'Professional Experience' })),
        ...internships.map(i => ({ fact: i, type: 'Internship Role' }))
      ];

      experiences.forEach((exp, idx) => {
        anchors.push({
          topic: `Behavioral: ${exp.type} #${idx + 1}`,
          cvFact: exp.fact,
          keyPoints: ['STAR situation framework', 'Conflict resolution', 'Leadership & ownership', 'Lessons learned']
        });
      });
    } else {
      if (projects.length > 0) {
        anchors.push({
          topic: 'Technical Architecture',
          cvFact: projects[0],
          keyPoints: ['System design', 'Tech choices', 'Performance']
        });
      }
      if (workExperience.length > 0 || internships.length > 0) {
        const exp = workExperience[0] || internships[0];
        anchors.push({
          topic: 'Professional Collaboration',
          cvFact: exp,
          keyPoints: ['Role impact', 'Teamwork', 'Deliverables']
        });
      }
      if (programmingLanguages.length > 0) {
        anchors.push({
          topic: `${programmingLanguages[0]} Core Concepts`,
          cvFact: programmingLanguages[0],
          keyPoints: ['Language paradigms', 'Best practices']
        });
      }
      if (education.length > 0) {
        anchors.push({
          topic: 'Academic Background',
          cvFact: education[0],
          keyPoints: ['Education background', 'Continuous learning']
        });
      }
    }

    if (anchors.length < 8) {
      skills.forEach(skill => {
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
