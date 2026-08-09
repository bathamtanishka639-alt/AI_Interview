import { CandidateProfile, InterviewMode } from '../models/interfaces';

export class CoverageTracker {
  private topicWhitelist: string[];
  private coveredTopics: Set<string> = new Set();

  constructor(cvProfile: CandidateProfile, mode: InterviewMode) {
    this.topicWhitelist = CoverageTracker.buildWhitelist(cvProfile, mode);
  }

  public markCovered(topic: string): void {
    const norm = this.normalizeTopic(topic);
    this.coveredTopics.add(norm);
  }

  public getUncoveredTopics(): string[] {
    return this.topicWhitelist.filter(
      t => !this.coveredTopics.has(this.normalizeTopic(t))
    );
  }

  public getCoveredTopics(): string[] {
    return [...this.coveredTopics];
  }

  public getWhitelist(): string[] {
    return [...this.topicWhitelist];
  }

  public findMatchingCvTopic(proposedTopic: string): string | null {
    const norm = this.normalizeTopic(proposedTopic);
    for (const t of this.topicWhitelist) {
      if (this.normalizeTopic(t) === norm) return t;
    }
    for (const t of this.topicWhitelist) {
      const tNorm = this.normalizeTopic(t);
      if (tNorm.includes(norm) || norm.includes(tNorm)) return t;
    }
    const normWords = new Set(norm.split(' ').filter(w => w.length > 2));
    for (const t of this.topicWhitelist) {
      const tWords = new Set(this.normalizeTopic(t).split(' ').filter(w => w.length > 2));
      const shared = [...normWords].filter(w => tWords.has(w)).length;
      const total = Math.max(normWords.size, tWords.size, 1);
      if (shared / total >= 0.5) return t;
    }
    return null;
  }

  public coverageRatio(): number {
    if (this.topicWhitelist.length === 0) return 1;
    return this.coveredTopics.size / this.topicWhitelist.length;
  }

  private normalizeTopic(topic: string): string {
    return topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  private static buildWhitelist(cvProfile: CandidateProfile, mode: InterviewMode): string[] {
    const topics: string[] = [];

    if (mode === 'technical' || mode === 'mixed') {
      (cvProfile.projects || []).forEach(p => topics.push(p.substring(0, 60)));
      (cvProfile.programmingLanguages || []).forEach(l => topics.push(`${l} engineering`));
      (cvProfile.frameworks || []).forEach(f => topics.push(`${f} architecture`));
      (cvProfile.tools || []).forEach(t => topics.push(`${t} infrastructure`));
    }

    if (mode === 'hr' || mode === 'mixed') {
      (cvProfile.education || []).forEach(e => topics.push(e.substring(0, 60)));
      (cvProfile.internships || []).forEach(i => topics.push(i.substring(0, 60)));
      (cvProfile.workExperience || []).forEach(w => topics.push(w.substring(0, 60)));
      (cvProfile.achievements || []).forEach(a => topics.push(a.substring(0, 60)));
    }

    if (mode === 'behavioral' || mode === 'mixed') {
      (cvProfile.projects || []).forEach(p => topics.push(`behavioral: ${p.substring(0, 50)}`));
      (cvProfile.workExperience || []).forEach(w => topics.push(`behavioral: ${w.substring(0, 50)}`));
    }

    (cvProfile.skills || []).forEach(s => topics.push(s));

    return [...new Set(topics)].filter(Boolean);
  }
}
