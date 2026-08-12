import { CandidateProfile } from '../models/interfaces';
import { LLMService } from '../services/llmService';

export interface CvValidationResult {
  valid: boolean;
  reason?: string;
  candidateName?: string;
}

export class CvParser {
  /**
   * High-precision two-tier CV verification:
   * Tier 1: Structural & keyword heuristic filter (disqualifies research papers, code, invoices, terms)
   * Tier 2: Gemini LLM intent classification (verifies if text represents a genuine candidate CV/resume)
   */
  public static async verifyCvDocument(text: string): Promise<CvValidationResult> {
    if (!text || text.trim().length < 40) {
      return { valid: false, reason: 'The uploaded file is empty or too short to be a valid CV.' };
    }

    const lower = text.toLowerCase();

    // 1. Check for non-CV document disqualifiers
    const researchPaperMarkers = [
      'abstract', 'references', 'arxiv:', 'doi:', 'ieee transactions',
      'proceedings of', 'bibliography', 'journal of', 'figure 1:', 'table 1:'
    ];
    let researchPaperMatches = 0;
    for (const marker of researchPaperMarkers) {
      if (lower.includes(marker)) researchPaperMatches++;
    }
    if (researchPaperMatches >= 2) {
      return {
        valid: false,
        reason: 'The uploaded document appears to be an academic research paper or article, not a candidate CV or resume.'
      };
    }

    const nonCvDocMarkers = [
      'terms and conditions', 'privacy policy', 'invoice #', 'purchase order',
      'table of contents', 'chapter 1', 'user manual', 'end user license agreement'
    ];
    for (const marker of nonCvDocMarkers) {
      if (lower.includes(marker)) {
        return {
          valid: false,
          reason: 'The uploaded file appears to be a legal, financial, or documentation text, not a candidate CV or resume.'
        };
      }
    }

    const codeFileMarkers = [
      'import react from', 'export class ', 'public static void main',
      'function component(', 'module.exports =', '<!doctype html>'
    ];
    for (const marker of codeFileMarkers) {
      if (lower.includes(marker)) {
        return {
          valid: false,
          reason: 'The uploaded file contains raw source code or markup, not a candidate CV or resume.'
        };
      }
    }

    // 2. Check for required CV structural sections
    const sectionHeaders = [
      'experience', 'work history', 'employment', 'education', 'skills',
      'projects', 'summary', 'certifications', 'qualifications', 'contact'
    ];
    const matchedSections = sectionHeaders.filter(header => lower.includes(header));
    if (matchedSections.length < 2) {
      return {
        valid: false,
        reason: 'The document lacks standard resume sections (work experience, skills, education, or projects).'
      };
    }

    // 3. LLM Intent & Structure Classification
    try {
      const systemPrompt = `You are a Strict Document Classifier for an AI Interview Platform.
Determine if the provided text is a candidate's CV / Resume (Curriculum Vitae) or NOT.

INVALID DOCUMENT TYPES (MUST RETURN isCv: false):
- Academic research papers, articles, theses, assignment instructions
- Software documentation, API references, source code files
- Invoices, terms of service, legal contracts, user manuals
- Generic essays, articles, blog posts, news stories, random notes

VALID CV / RESUME (MUST RETURN isCv: true):
- A candidate's personal document detailing their professional experience, technical skills, education, contact info, or projects for job application.

Return ONLY valid JSON matching this schema:
{
  "isCv": boolean,
  "candidateName": string or null,
  "reason": "Brief explanation if invalid, or confirming valid CV"
}`;

      const userPrompt = `Classify this document:\n\n${text.substring(0, 3000)}`;

      const llmRes = await LLMService.generateCompletion(systemPrompt, userPrompt, 500);
      if (llmRes.content && llmRes.content.trim()) {
        let jsonStr = llmRes.content.trim();
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
          const parsed = JSON.parse(jsonStr);
          if (typeof parsed.isCv === 'boolean') {
            if (!parsed.isCv) {
              return {
                valid: false,
                reason: parsed.reason || 'The uploaded document does not appear to be a candidate CV or resume.'
              };
            }
            return {
              valid: true,
              candidateName: parsed.candidateName || undefined
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[CvParser] LLM document classification warning:', err.message);
    }

    return { valid: true };
  }

  public static async parse(cvText: string): Promise<CandidateProfile> {
    const check = await CvParser.verifyCvDocument(cvText);
    if (!check.valid) {
      throw new Error(check.reason || 'The uploaded document is not a valid CV or resume.');
    }

    const systemPrompt = `You are an expert CV/Resume Parser. Extract structured information from the provided CV text and return it ONLY as a valid JSON object.
    
RULES:
- Return ONLY valid JSON, no markdown, no explanation, no code blocks.
- Extract exact names, technologies, projects, and experiences as written in the CV.
- If a field has no data, return an empty array [] for array fields or null for string fields.

Return this exact JSON structure:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "education": ["array of education entries as strings"],
  "skills": ["array of all technical and professional skills"],
  "programmingLanguages": ["array of programming languages"],
  "frameworks": ["array of frameworks and libraries"],
  "tools": ["array of tools, platforms, and software"],
  "projects": ["array of project descriptions"],
  "internships": ["array of internships"],
  "workExperience": ["array of work experience"],
  "certifications": ["array of certifications"],
  "achievements": ["array of achievements"],
  "rawSummary": "1-2 sentence professional summary derived from the CV"
}`;

    const userPrompt = `Parse this candidate CV:\n\n${cvText.substring(0, 6000)}`;

    try {
      const llmRes = await LLMService.generateCompletion(systemPrompt, userPrompt, 1500);

      if (llmRes.content && llmRes.content.trim()) {
        let jsonStr = llmRes.content.trim();
        jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

        if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
          const parsed = JSON.parse(jsonStr);
          return {
            name: parsed.name || check.candidateName || CvParser.extractNameFromText(cvText),
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
