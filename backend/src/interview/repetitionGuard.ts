export class RepetitionGuard {
  private askedNormalized: string[] = [];
  private askedWordSets: Set<string>[] = [];

  constructor(existingQuestions: string[] = []) {
    for (const q of existingQuestions) {
      this.register(q);
    }
  }

  public register(question: string): void {
    const norm = this.normalize(question);
    this.askedNormalized.push(norm);
    this.askedWordSets.push(this.wordSet(norm));
  }

  public isDuplicate(candidate: string): boolean {
    const norm = this.normalize(candidate);
    const wset = this.wordSet(norm);

    for (let i = 0; i < this.askedNormalized.length; i++) {
      if (this.askedNormalized[i] === norm) return true;
      if (this.jaccard(wset, this.askedWordSets[i]) >= 0.65) return true;

      const candidateStart = norm.split(' ').slice(0, 8).join(' ');
      const existingStart = this.askedNormalized[i].split(' ').slice(0, 8).join(' ');
      if (candidateStart.length > 20 && candidateStart === existingStart) return true;
    }

    return false;
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private wordSet(normalized: string): Set<string> {
    const STOPWORDS = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'your', 'you', 'me', 'we', 'they', 'it',
      'this', 'that', 'how', 'what', 'when', 'where', 'why', 'which', 'who'
    ]);
    return new Set(
      normalized.split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w))
    );
  }

  private jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 1;
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  }
}
