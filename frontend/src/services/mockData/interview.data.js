export const mockInterview = {
  id: 'demo-interview-1',
  candidateName: 'Jordan Lee',
  role: 'Frontend Engineer',
  status: 'in_progress',
  currentQuestionIndex: 1,
  skills: [
    { name: 'React', level: 'Strong' },
    { name: 'System Design', level: 'Developing' },
    { name: 'CSS', level: 'Strong' },
  ],
  transcript: [
    { id: 't1', role: 'agent', text: "Let's start practical — walk me through how React's reconciliation works." },
    { id: 't2', role: 'candidate', text: 'React builds a virtual DOM tree and diffs it against the previous one to compute the minimal set of real DOM updates...' },
  ],
  questions: [
    { id: 'q1', text: "Walk me through how React's reconciliation works.", skill: 'React', difficulty: 'Medium' },
    { id: 'q2', text: 'How would you debug a memory leak in a long-running single-page app?', skill: 'React', difficulty: 'Hard' },
    { id: 'q3', text: 'Explain CSS specificity with a concrete example.', skill: 'CSS', difficulty: 'Easy' },
    { id: 'q4', text: 'Design the data flow for a real-time collaborative editor.', skill: 'System Design', difficulty: 'Hard' },
  ],
};
