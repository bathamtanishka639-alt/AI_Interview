export const mockReport = {
  interviewId: 'demo-interview-1',
  candidateName: 'Jordan Lee',
  role: 'Frontend Engineer',
  overallScore: 82,
  scoreCards: [
    { label: 'Technical Accuracy', value: 85, outOf: 100 },
    { label: 'Communication', value: 78, outOf: 100 },
    { label: 'Problem Solving', value: 88, outOf: 100 },
    { label: 'Code Quality', value: 80, outOf: 100 },
  ],
  feedback: [
    { tone: 'positive', text: 'Explained virtual DOM diffing trade-offs clearly and accurately.' },
    { tone: 'positive', text: 'Debugged the memory-leak scenario methodically, checking listeners first.' },
    { tone: 'improvement', text: 'Answers on CSS specificity could be more concise.' },
  ],
  recommendations: [
    { title: 'Advance to system design round', description: 'Strong fundamentals support a deeper architecture conversation.' },
    { title: 'Review CSS cascade & specificity', description: 'A short refresher would tighten up a couple of borderline answers.' },
  ],
};
