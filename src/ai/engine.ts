import type { Difficulty, QAItem } from '@/store';

export const QUESTION_TIME: Record<Difficulty, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
};

const EASY_QUESTIONS = [
  'Explain the difference between var, let, and const in JavaScript.',
  'What is JSX in React and why is it useful?',
  'What is the purpose of useState in React?',
  'What does HTTP status 200 vs 404 indicate?',
  'What is npm and what is package.json used for?',
];

const MEDIUM_QUESTIONS = [
  'Describe how React Reconciliation works and what keys are used for.',
  'Explain how closures work in JavaScript and provide a use case.',
  'How would you structure a REST API in Node.js for a blog with posts and comments?',
  'What are React Context and Redux, and when would you choose one over the other?',
  'How does async/await compare to Promises and callbacks? Provide examples.',
];

const HARD_QUESTIONS = [
  'Design a scalable architecture for a full-stack app with React frontend and Node.js backend handling 100k concurrent users. Discuss caching, DB, and deployment.',
  'Explain event loop and task/microtask queues in Node.js, and how they affect performance in real apps.',
  'How would you implement server-side rendering (SSR) with hydration in a React app and what trade-offs exist?',
  'Discuss strategies to prevent and mitigate XSS/CSRF in a full-stack application.',
  'Given a slow React page, how would you diagnose and optimize performance end-to-end?',
];

function pickRandom<T>(arr: T[], exclude: Set<number>): { idx: number; value: T } {
  let idx = Math.floor(Math.random() * arr.length);
  while (exclude.has(idx)) idx = Math.floor(Math.random() * arr.length);
  return { idx, value: arr[idx] };
}

export function generateInterviewQuestions(): QAItem[] {
  const usedE = new Set<number>();
  const usedM = new Set<number>();
  const usedH = new Set<number>();

  const res: QAItem[] = [];
  for (let i = 0; i < 2; i++) {
    const { idx, value } = pickRandom(EASY_QUESTIONS, usedE); usedE.add(idx);
    res.push({ id: `easy-${idx}`, difficulty: 'easy', question: value });
  }
  for (let i = 0; i < 2; i++) {
    const { idx, value } = pickRandom(MEDIUM_QUESTIONS, usedM); usedM.add(idx);
    res.push({ id: `medium-${idx}`, difficulty: 'medium', question: value });
  }
  for (let i = 0; i < 2; i++) {
    const { idx, value } = pickRandom(HARD_QUESTIONS, usedH); usedH.add(idx);
    res.push({ id: `hard-${idx}`, difficulty: 'hard', question: value });
  }
  return res;
}

// Keyword maps per question pool index to increase scoring variance
const EASY_KEYWORDS: string[][] = [
  ['var', 'let', 'const', 'scope', 'hoisting', 'reassignment', 'temporal dead zone'],
  ['jsx', 'react', 'babel', 'html', 'components', 'syntax'],
  ['useState', 'state', 'hook', 'functional component'],
  ['http', 'status', '200', '404', 'success', 'not found'],
  ['npm', 'package.json', 'dependencies', 'scripts', 'registry'],
];

const MEDIUM_KEYWORDS: string[][] = [
  ['reconciliation', 'diffing', 'virtual dom', 'keys', 'list', 'identity'],
  ['closure', 'lexical', 'scope', 'encapsulation', 'factory', 'module'],
  ['rest', 'node', 'express', 'routes', 'crud', 'posts', 'comments'],
  ['context', 'redux', 'state management', 'provider', 'store', 'useReducer'],
  ['async', 'await', 'promises', 'callbacks', 'try', 'catch'],
];

const HARD_KEYWORDS: string[][] = [
  ['scalable', 'caching', 'redis', 'load balancer', 'horizontal', 'cdn', 'database', 'sharding', 'replication', 'kubernetes'],
  ['event loop', 'microtask', 'task queue', 'promise', 'io', 'non-blocking', 'throughput'],
  ['ssr', 'hydration', 'next.js', 'render', 'seo', 'trade-offs', 'bundle'],
  ['xss', 'csrf', 'sanitize', 'token', 'sameSite', 'csp', 'oauth'],
  ['profiling', 'memo', 'useMemo', 'useCallback', 'virtualize', 'lazy', 'code splitting'],
];

function keywordsFor(q: QAItem): string[] {
  const pool = q.difficulty === 'easy' ? EASY_KEYWORDS : q.difficulty === 'medium' ? MEDIUM_KEYWORDS : HARD_KEYWORDS;
  // id pattern is `${difficulty}-${idx}`
  const idx = Number(q.id.split('-')[1] || 0) % pool.length;
  return pool[idx];
}

export function evaluateAnswer(q: QAItem, answer: string | undefined, timeTakenSec: number): {
  score: number;
  contentScore: number;
  structureScore: number;
  lengthScore: number;
  timePenalty: number;
  diffWeight: number;
  keywordHits: number;
  keywords: string[];
} {
  if (!answer || !answer.trim()) {
    return { score: 0, contentScore: 0, structureScore: 0, lengthScore: 0, timePenalty: 0, diffWeight: q.difficulty === 'easy' ? 1.0 : q.difficulty === 'medium' ? 1.2 : 1.4, keywordHits: 0, keywords: keywordsFor(q) };
  }

  const a = answer.trim();
  const words = a.split(/\s+/);
  const len = words.length;
  const lower = a.toLowerCase();
  const kws = keywordsFor(q);

  // Content score based on keyword hits (stem-lite by lowercase inclusion)
  let hits = 0;
  for (const kw of kws) {
    if (lower.includes(kw)) hits += 1;
  }
  const contentScore = Math.min(10, Math.round((hits / Math.max(3, kws.length)) * 12)); // 0..10

  // Structure score: presence of lists, code, or clear connectors
  const hasList = /\n\s*[-*\d]/.test(a) || /\d+\)/.test(a);
  const hasCode = /`[^`]+`/.test(a) || /\bconst\b|\bfunction\b|=>/.test(a);
  const hasConnectors = /(because|therefore|however|trade-?off|in addition|for example)/i.test(a);
  let structureScore = 0;
  structureScore += hasList ? 3 : 0;
  structureScore += hasCode ? 3 : 0;
  structureScore += hasConnectors ? 2 : 0;
  structureScore = Math.min(10, structureScore);

  // Length score: encourage concise but substantive answers
  let lengthScore = 0;
  if (len < 10) lengthScore = 1;
  else if (len < 30) lengthScore = 4;
  else if (len < 80) lengthScore = 7;
  else if (len < 150) lengthScore = 9;
  else lengthScore = 8; // penalize rambling slightly

  // Combine with difficulty weighting
  const diffWeight = q.difficulty === 'easy' ? 1.0 : q.difficulty === 'medium' ? 1.2 : 1.4;
  let raw = (contentScore * 0.5 + structureScore * 0.3 + lengthScore * 0.2) * diffWeight; // 0..(10*1.4)

  // Time penalty if exceeding limit
  const limit = QUESTION_TIME[q.difficulty];
  const timeOver = Math.max(0, timeTakenSec - limit);
  const timePenalty = timeOver > 0 ? Math.min(3, timeOver / (limit * 0.5)) : 0;
  if (timePenalty > 0) raw -= timePenalty;

  // Normalize to 0..100 with some granularity
  let final = Math.max(0, Math.min(10, raw));
  final = Math.round(final * 9); // 0..90
  // Add small variance for partial keyword coverage
  final += Math.min(10, hits * 2);

  const score = Math.max(0, Math.min(100, Math.round(final)));
  return { score, contentScore, structureScore, lengthScore, timePenalty: Number(timePenalty.toFixed(2)), diffWeight, keywordHits: hits, keywords: kws };
}

export function scoreAnswer(q: QAItem, answer: string | undefined, timeTakenSec: number): number {
  const res = evaluateAnswer(q, answer, timeTakenSec);
  // Backward-compatible simple score
  // @ts-ignore
  if (typeof res === 'number') return res as unknown as number;
  return res.score;
}

export function summarizeCandidate(name: string, qas: QAItem[], finalScore: number): string {
  const strengths: string[] = [];
  const areas: string[] = [];

  const avgEasy = average(qas.filter((q) => q.difficulty === 'easy').map((q) => q.score || 0));
  const avgMed = average(qas.filter((q) => q.difficulty === 'medium').map((q) => q.score || 0));
  const avgHard = average(qas.filter((q) => q.difficulty === 'hard').map((q) => q.score || 0));

  if (avgEasy >= avgMed && avgEasy >= avgHard) strengths.push('fundamentals');
  if (avgMed >= avgEasy && avgMed >= avgHard) strengths.push('application design');
  if (avgHard >= avgEasy && avgHard >= avgMed) strengths.push('scalability and depth');

  if (avgHard < 50) areas.push('deep system understanding');
  if (avgMed < 50) areas.push('architecture and API design');

  return `${name} scored ${finalScore}. Strengths: ${strengths.join(', ')}. Improvement areas: ${areas.join(', ') || 'n/a'}.`;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
