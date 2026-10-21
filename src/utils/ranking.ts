import {
  JudgeScoreSubmission,
  EntrantRanking,
  ContestSummaryStats,
} from '../types/contest';

export function calculateRankings(scores: JudgeScoreSubmission[]): EntrantRanking[] {
  if (!scores || scores.length === 0) return [];

  // Group by trimmed entrant name
  const groups: { [key: string]: JudgeScoreSubmission[] } = {};
  const displayNameMap: { [key: string]: string } = {};

  for (const score of scores) {
    const rawName = (score.entrantName || 'Untitled Submission').trim();
    if (!rawName) continue;
    const normalizedKey = rawName.toLowerCase();
    if (!groups[normalizedKey]) {
      groups[normalizedKey] = [];
      displayNameMap[normalizedKey] = rawName;
    }
    groups[normalizedKey].push(score);
  }

  const unrankedList: Omit<EntrantRanking, 'rank'>[] = Object.keys(groups).map((key) => {
    const entrantScores = groups[key];
    const entrantName = displayNameMap[key];
    const judgeCount = entrantScores.length;

    let totalPoints = 0;
    let writingSum = 0;
    let origSum = 0;
    let emotionSum = 0;
    let structSum = 0;
    let highestScore = -Infinity;
    let lowestScore = Infinity;

    const judgeBreakdowns = entrantScores.map((s) => {
      totalPoints += s.totalScore;
      writingSum += s.writing;
      origSum += s.originality;
      emotionSum += s.emotion;
      structSum += s.structure;

      if (s.totalScore > highestScore) highestScore = s.totalScore;
      if (s.totalScore < lowestScore) lowestScore = s.totalScore;

      return {
        judgeName: s.judgeName || 'Independent Judge',
        totalScore: s.totalScore,
        writing: s.writing,
        originality: s.originality,
        emotion: s.emotion,
        structure: s.structure,
        comments: s.comments || '',
        timestamp: s.timestamp,
      };
    });

    const averageScore = judgeCount > 0 ? totalPoints / judgeCount : 0;
    const writingAvg = judgeCount > 0 ? writingSum / judgeCount : 0;
    const originalityAvg = judgeCount > 0 ? origSum / judgeCount : 0;
    const emotionAvg = judgeCount > 0 ? emotionSum / judgeCount : 0;
    const structureAvg = judgeCount > 0 ? structSum / judgeCount : 0;

    return {
      entrantName,
      judgeCount,
      totalPoints,
      averageScore,
      writingAvg,
      originalityAvg,
      emotionAvg,
      structureAvg,
      highestScore: highestScore === -Infinity ? 0 : highestScore,
      lowestScore: lowestScore === Infinity ? 0 : lowestScore,
      judgeBreakdowns,
    };
  });

  // Sort: Average Score DESC, then Originality Avg DESC, then Writing Avg DESC
  unrankedList.sort((a, b) => {
    if (Math.abs(b.averageScore - a.averageScore) > 0.001) {
      return b.averageScore - a.averageScore;
    }
    if (Math.abs(b.originalityAvg - a.originalityAvg) > 0.001) {
      return b.originalityAvg - a.originalityAvg;
    }
    if (Math.abs(b.writingAvg - a.writingAvg) > 0.001) {
      return b.writingAvg - a.writingAvg;
    }
    return b.judgeCount - a.judgeCount;
  });

  // Assign ranks
  return unrankedList.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

export function computeSummaryStats(
  scores: JudgeScoreSubmission[],
  rankings: EntrantRanking[]
): ContestSummaryStats {
  const judgesSet = new Set<string>();
  let totalScoreSum = 0;

  scores.forEach((s) => {
    if (s.judgeName) judgesSet.add(s.judgeName.trim().toLowerCase());
    totalScoreSum += s.totalScore;
  });

  const overallAverage = scores.length > 0 ? totalScoreSum / scores.length : 0;
  const topEntrant = rankings[0];

  return {
    totalEntrants: rankings.length,
    totalJudges: judgesSet.size,
    totalSubmissions: scores.length,
    overallAverage,
    topEntrantName: topEntrant ? topEntrant.entrantName : 'None yet',
    topEntrantScore: topEntrant ? topEntrant.averageScore : 0,
  };
}

export const SAMPLE_CONTEST_SCORES: JudgeScoreSubmission[] = [
  {
    id: 'demo-1',
    timestamp: '2026-10-20 14:10',
    judgeName: 'Elena Rostova (Lead Producer)',
    entrantName: 'Golden Hour Glow — Clara Vance',
    writing: 23,
    originality: 22,
    emotion: 24,
    structure: 23,
    totalScore: 92,
    averageScore: 23,
    comments: 'Superb phrasing in the bridge. Heartbreaking emotional imagery with remarkable cohesion.',
  },
  {
    id: 'demo-2',
    timestamp: '2026-10-20 15:30',
    judgeName: 'Marcus Sterling (Sound & Melody)',
    entrantName: 'Golden Hour Glow — Clara Vance',
    writing: 22,
    originality: 21,
    emotion: 23,
    structure: 22,
    totalScore: 88,
    averageScore: 22,
    comments: 'Very strong lyrical cadence that naturally hums with rhythm. Top contender.',
  },
  {
    id: 'demo-3',
    timestamp: '2026-10-20 16:45',
    judgeName: 'Sarah Chen (Lyricist / A&R)',
    entrantName: 'Golden Hour Glow — Clara Vance',
    writing: 24,
    originality: 23,
    emotion: 23,
    structure: 23,
    totalScore: 93,
    averageScore: 23.25,
    comments: 'Masterclass in restraint and storytelling. Evocative and poetic.',
  },
  {
    id: 'demo-4',
    timestamp: '2026-10-20 14:22',
    judgeName: 'Elena Rostova (Lead Producer)',
    entrantName: 'Saltwater & Cedar — Liam O’Connor',
    writing: 20,
    originality: 24,
    emotion: 21,
    structure: 20,
    totalScore: 85,
    averageScore: 21.25,
    comments: 'Incredible coastal metaphor and unique rhyming patterns. Truly unique voice.',
  },
  {
    id: 'demo-5',
    timestamp: '2026-10-20 15:50',
    judgeName: 'Marcus Sterling (Sound & Melody)',
    entrantName: 'Saltwater & Cedar — Liam O’Connor',
    writing: 19,
    originality: 23,
    emotion: 22,
    structure: 21,
    totalScore: 85,
    averageScore: 21.25,
    comments: 'Original and atmospheric. Chorus stays with you long after reading.',
  },
  {
    id: 'demo-6',
    timestamp: '2026-10-20 17:05',
    judgeName: 'Sarah Chen (Lyricist / A&R)',
    entrantName: 'Saltwater & Cedar — Liam O’Connor',
    writing: 21,
    originality: 24,
    emotion: 20,
    structure: 21,
    totalScore: 86,
    averageScore: 21.5,
    comments: 'One of the freshest lyrical perspectives in this contest round.',
  },
  {
    id: 'demo-7',
    timestamp: '2026-10-20 14:40',
    judgeName: 'Elena Rostova (Lead Producer)',
    entrantName: 'Echoes in the Rain — Noah Reed',
    writing: 19,
    originality: 18,
    emotion: 20,
    structure: 19,
    totalScore: 76,
    averageScore: 19,
    comments: 'Solid emotional delivery; verse two has great pacing.',
  },
  {
    id: 'demo-8',
    timestamp: '2026-10-20 16:15',
    judgeName: 'Marcus Sterling (Sound & Melody)',
    entrantName: 'Echoes in the Rain — Noah Reed',
    writing: 18,
    originality: 17,
    emotion: 21,
    structure: 18,
    totalScore: 74,
    averageScore: 18.5,
    comments: 'Deeply heartfelt theme. Bridge could use slightly tighter rhyming structure.',
  },
  {
    id: 'demo-9',
    timestamp: '2026-10-20 14:55',
    judgeName: 'Elena Rostova (Lead Producer)',
    entrantName: 'Neon Dusk — Maya Thorne',
    writing: 17,
    originality: 21,
    emotion: 16,
    structure: 17,
    totalScore: 71,
    averageScore: 17.75,
    comments: 'Bold, cinematic synthwave imagery. Hook needs a touch more lyrical variety.',
  },
  {
    id: 'demo-10',
    timestamp: '2026-10-20 16:30',
    judgeName: 'Sarah Chen (Lyricist / A&R)',
    entrantName: 'Neon Dusk — Maya Thorne',
    writing: 18,
    originality: 20,
    emotion: 18,
    structure: 16,
    totalScore: 72,
    averageScore: 18,
    comments: 'Great visual metaphors. Good progression across the sections.',
  },
  {
    id: 'demo-11',
    timestamp: '2026-10-20 15:10',
    judgeName: 'Marcus Sterling (Sound & Melody)',
    entrantName: 'Wildflower Horizon — Rowan Diaz',
    writing: 16,
    originality: 15,
    emotion: 17,
    structure: 16,
    totalScore: 64,
    averageScore: 16,
    comments: 'Gentle folk song feel. Clean delivery, with room for sharper wordplay.',
  },
];
