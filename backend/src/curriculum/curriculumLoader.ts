import fs from 'fs';
import path from 'path';
import { Candidate, Curriculum, CurriculumModule } from '../models/interfaces';

export class CurriculumLoader {
  private static curriculumCache: Curriculum | null = null;
  private static candidateCache: Candidate | null = null;

  public static getCurriculum(): Curriculum {
    if (CurriculumLoader.curriculumCache) {
      return CurriculumLoader.curriculumCache;
    }

    try {
      const filePath = path.join(__dirname, '../../sample/curriculum.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        CurriculumLoader.curriculumCache = JSON.parse(raw);
        return CurriculumLoader.curriculumCache!;
      }
    } catch (err: any) {
      console.warn('[CurriculumLoader] Failed to read curriculum.json:', err.message);
    }

    CurriculumLoader.curriculumCache = {
      curriculumId: 'curr-ai-eng-30d',
      title: '30-Day AI Engineer Mastery Curriculum',
      track: 'Full-Stack AI Engineering',
      totalModules: 5,
      modules: [
        {
          moduleId: 'mod-1',
          title: 'Foundations of LLM App Architecture',
          days: [1, 2, 3, 4, 5, 6],
          keyTopics: ['Prompts', 'Tokenization', 'Cost Optimization', 'API Wrappers']
        },
        {
          moduleId: 'mod-2',
          title: 'Advanced Retrieval & Vector DBs',
          days: [7, 8, 9, 10, 11, 12],
          keyTopics: ['Embeddings', 'Cosine Similarity', 'Hybrid Search', 'RAG Chunking']
        },
        {
          moduleId: 'mod-3',
          title: 'Autonomous Agents & LangChain',
          days: [13, 14, 15, 16, 17, 18],
          keyTopics: ['ReAct Loop', 'Tool Calling', 'Memory Management', 'Multi-Agent']
        },
        {
          moduleId: 'mod-4',
          title: 'Fine-Tuning & Evaluation',
          days: [19, 20, 21, 22, 23, 24],
          keyTopics: ['LoRA', 'QLoRA', 'Ragas', 'Evals', 'Hallucination Metrics']
        },
        {
          moduleId: 'mod-5',
          title: 'Production Deployment & Scaling',
          days: [25, 26, 27, 28, 29, 30],
          keyTopics: ['Kubernetes', 'vLLM', 'Inference Optimization', 'Guardrails']
        }
      ]
    };

    return CurriculumLoader.curriculumCache;
  }

  public static getCandidate(): Candidate {
    if (CurriculumLoader.candidateCache) {
      return CurriculumLoader.candidateCache;
    }

    try {
      const filePath = path.join(__dirname, '../../sample/candidate.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        CurriculumLoader.candidateCache = JSON.parse(raw);
        return CurriculumLoader.candidateCache!;
      }
    } catch (err: any) {
      console.warn('[CurriculumLoader] Failed to read candidate.json:', err.message);
    }

    CurriculumLoader.candidateCache = {
      candidateId: 'cand-001',
      name: 'Alex Mercer',
      email: 'alex.mercer@example.com',
      targetRole: 'Senior Full-Stack AI Engineer',
      progress: { currentDay: 12, totalDays: 30, completionPercentage: 40 },
      skills: ['TypeScript', 'Node.js', 'React', 'Python', 'LangChain', 'Vector Databases', 'FastAPI', 'Docker'],
      completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      weakTopics: [
        'Asynchronous memory management in Node.js',
        'RAG chunking strategy optimization',
        'Kubernetes ingress timeouts'
      ],
      experienceLevel: 'Senior'
    };

    return CurriculumLoader.candidateCache;
  }

  public static getModuleForDay(day: number): CurriculumModule | undefined {
    const curr = CurriculumLoader.getCurriculum();
    return curr.modules.find(m => m.days.includes(day));
  }
}
