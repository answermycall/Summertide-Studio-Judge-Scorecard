export interface CriterionScore {
  key: 'writing' | 'originality' | 'emotion' | 'structure';
  name: string;
  description: string;
  score: number; // 1 to 24
}

export interface JudgeScoreSubmission {
  id?: string;
  timestamp: string;
  judgeName: string;
  entrantName: string;
  songTitle?: string;
  alias?: string;
  discordUsername?: string;
  storyConcept?: string;
  lyrics?: string;
  comments: string;
  writing: number;
  originality: number;
  emotion: number;
  structure: number;
  totalScore: number;
  averageScore: number;
  sheetRowIndex?: number;
}

export interface EntrantRanking {
  rank: number;
  entrantName: string;
  songTitle?: string;
  alias?: string;
  discordUsername?: string;
  storyConcept?: string;
  lyrics?: string;
  judgeCount: number;
  totalPoints: number;
  averageScore: number;
  writingAvg: number;
  originalityAvg: number;
  emotionAvg: number;
  structureAvg: number;
  highestScore: number;
  lowestScore: number;
  judgeBreakdowns: {
    judgeName: string;
    totalScore: number;
    writing: number;
    originality: number;
    emotion: number;
    structure: number;
    comments: string;
    timestamp: string;
  }[];
}

export interface ContestSummaryStats {
  totalEntrants: number;
  totalJudges: number;
  totalSubmissions: number;
  overallAverage: number;
  topEntrantName: string;
  topEntrantScore: number;
}

export const CRITERIA_CONFIG = [
  {
    key: 'writing' as const,
    name: 'Writing Quality',
    description: 'Vocabulary, phrasing, spacing, clarity, and readability.',
  },
  {
    key: 'originality' as const,
    name: 'Originality & Creativity',
    description: 'Distinctive ideas, imagery, wordplay, and creative rhymes.',
  },
  {
    key: 'emotion' as const,
    name: 'Emotional Impact & Storytelling',
    description: 'Emotional resonance, narrative clarity, depth, and engagement.',
  },
  {
    key: 'structure' as const,
    name: 'Structure & Cohesion',
    description: 'Section transitions, progression, consistency, and unity.',
  },
];

export const TIER_DESCRIPTIONS = [
  { range: '1–5', label: 'Poor', desc: 'Major weaknesses; criterion barely fulfilled.' },
  { range: '6–10', label: 'Below Standard', desc: 'Some merit, but significant weaknesses remain.' },
  { range: '11–15', label: 'Competent', desc: 'Meets basic expectations; generally satisfactory.' },
  { range: '16–20', label: 'Strong', desc: 'Skilled, thoughtful execution with minor weaknesses.' },
  { range: '21–24', label: 'Exceptional', desc: 'Outstanding execution; distinctive and close to mastery.' },
];

export function getTier(score: number): { label: string; color: string; bg: string } {
  if (score <= 5) return { label: 'Poor', color: 'text-amber-800', bg: 'bg-amber-100' };
  if (score <= 10) return { label: 'Below Standard', color: 'text-orange-800', bg: 'bg-orange-100' };
  if (score <= 15) return { label: 'Competent', color: 'text-blue-800', bg: 'bg-blue-100' };
  if (score <= 20) return { label: 'Strong', color: 'text-emerald-800', bg: 'bg-emerald-100' };
  return { label: 'Exceptional', color: 'text-teal-900', bg: 'bg-teal-100' };
}

export function getSummaryNarration(total: number): string {
  if (total <= 20) return 'This entry needs substantial development across the criteria.';
  if (total <= 40) return 'Some promising elements, but significant weaknesses remain.';
  if (total <= 60) return 'A competent entry that meets many basic expectations.';
  if (total <= 80) return 'A strong entry with clear skill and thoughtful execution.';
  if (total <= 91) return 'An outstanding entry with many exceptional qualities.';
  return 'Exceptional across the board — near the highest awardable score.';
}
