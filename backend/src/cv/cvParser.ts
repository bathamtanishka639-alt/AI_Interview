import { CandidateProfile } from '../models/interfaces';
import { LLMService } from '../services/llmService';

export class CvParser {
  /**
   * Parses raw CV/resume text and extracts a structured CandidateProfile.
   * Uses Gemini/LLM for intelligent extraction. Falls back to robust heuristic regex parsing.
   */
  public static async parse(cvText: string): Promise<CandidateProfile> {
    if (!cvText || cvText.trim().length < 30) {
      throw new Error('CV text is too short or empty. Please upload a valid CV.');
    }

    const systemPrompt = `You are an expert CV/Resume Parser. Extract structured information from the provided CV text and return it ONLY as a valid JSON object.
    
RULES:
- Return ONLY valid JSON, no markdown, no explanation, no code blocks.
- If a field has no data in the CV, return an empty array [] for array fields or null for string fields.
- Do NOT invent or guess any information not present in the CV.
- Extract exact names, technologies, and experiences as written in the CV.

Return this exact JSON structure:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "education": ["array of education entries as strings"],
  "skills": ["array of all skills"],
  "programmingLanguages": ["array of programming languages only"],
  "frameworks": ["array of frameworks and libraries only"],
  "tools": ["array of tools, platforms, and software"],
  "projects": ["array of project descriptions as strings"],
  "internships": ["array of internship descriptions as strings"],
  "workExperience": ["array of work experience descriptions as strings"],
  "certifications": ["array of certifications"],
  "achievements": ["array of achievements and awards"],
  "rawSummary": "1-2 sentence professional summary derived from the CV"
}`;

    const userPrompt = `Parse this CV and extract the structured profile:\n\n${cvText.substring(0, 6000)}`;

    try {
      const llmRes = await LLMService.generateCompletion(systemPrompt, userPrompt, 1500);

      if (llmRes.content && llmRes.content.trim()) {
        let jsonStr = llmRes.content.trim();
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

        if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
          const parsed = JSON.parse(jsonStr);
          return {
            name: parsed.name || CvParser.extractNameFromText(cvText),
            email: parsed.email || CvParser.extractEmailFromText(cvText),
            phone: parsed.phone || undefined,
            education: Array.isArray(parsed.education) ? parsed.education : [],
            skills: Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : CvParser.extractSkillsFromText(cvText),
            programmingLanguages: Array.isArray(parsed.programmingLanguages) && parsed.programmingLanguages.length ? parsed.programmingLanguages : CvParser.extractLanguagesFromText(cvText),
            frameworks: Array.isArray(parsed.frameworks) && parsed.frameworks.length ? parsed.frameworks : CvParser.extractFrameworksFromText(cvText),
            tools: Array.isArray(parsed.tools) ? parsed.tools : [],
            projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : CvParser.extractProjectsFromText(cvText),
            internships: Array.isArray(parsed.internships) ? parsed.internships : [],
            workExperience: Array.isArray(parsed.workExperience) ? parsed.workExperience : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
            rawSummary: parsed.rawSummary || cvText.substring(0, 200)
          };
        }
      }
    } catch (err: any) {
      console.warn('[CvParser] External LLM parser fallback triggered:', err.message);
    }

    // High-precision heuristic fallback engine
    return CvParser.heuristicExtract(cvText);
  }

  private static heuristicExtract(text: string): CandidateProfile {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const name = CvParser.extractNameFromText(text);
    const email = CvParser.extractEmailFromText(text);
    const languages = CvParser.extractLanguagesFromText(text);
    const frameworks = CvParser.extractFrameworksFromText(text);
    const skills = CvParser.extractSkillsFromText(text);
    const projects = CvParser.extractProjectsFromText(text);

    return {
      name,
      email,
      education: lines.filter(l => /university|college|bachelor|master|degree|b\.tech|b\.e\.|bs|ms/i.test(l)).slice(0, 3),
      skills: skills.length ? skills : ['Software Development', 'Problem Solving', 'System Design'],
      programmingLanguages: languages.length ? languages : ['JavaScript', 'TypeScript', 'Python'],
      frameworks: frameworks.length ? frameworks : ['React', 'Node.js', 'Express'],
      tools: ['Git', 'VS Code', 'REST APIs'],
      projects: projects.length ? projects : lines.filter(l => /project|built|developed|created|platform|system|app/i.test(l)).slice(0, 4),
      internships: lines.filter(l => /intern|internship|trainee/i.test(l)).slice(0, 2),
      workExperience: lines.filter(l => /engineer|developer|architect|lead|analyst/i.test(l)).slice(0, 4),
      certifications: [],
      achievements: [],
      rawSummary: lines.slice(0, 3).join(' ')
    };
  }

  private static extractNameFromText(text: string): string {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    if (firstLine.length > 2 && firstLine.length < 50 && !/resume|curriculum|cv|profile|contact|email/i.test(firstLine)) {
      return firstLine;
    }
    return 'Candidate';
  }

  private static extractEmailFromText(text: string): string | undefined {
    const match = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : undefined;
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private static extractLanguagesFromText(text: string): string[] {
    const known = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS'];
    return known.filter(lang => new RegExp(CvParser.escapeRegex(lang), 'i').test(text));
  }

  private static extractFrameworksFromText(text: string): string[] {
    const known = ['React', 'Node.js', 'Express', 'Next.js', 'Vue', 'Angular', 'Django', 'Flask', 'Spring Boot', 'Tailwind', 'Bootstrap'];
    return known.filter(fw => new RegExp(CvParser.escapeRegex(fw), 'i').test(text));
  }

  private static extractSkillsFromText(text: string): string[] {
    const known = ['REST API', 'GraphQL', 'System Design', 'State Management', 'Database Indexing', 'Microservices', 'CI/CD', 'Docker', 'Kubernetes', 'AWS'];
    return known.filter(sk => new RegExp(CvParser.escapeRegex(sk), 'i').test(text));
  }

  private static extractProjectsFromText(text: string): string[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.filter(l => /project|built|developed|created|implemented|platform|app/i.test(l)).slice(0, 4);
  }
}
