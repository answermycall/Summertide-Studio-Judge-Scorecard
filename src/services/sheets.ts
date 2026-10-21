import { JudgeScoreSubmission, EntrantRanking } from '../types/contest';

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheets: { id: number; title: string }[];
}

export function parseSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  // Check if it's a full Google Sheets URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function fetchSpreadsheetMetadata(
  token: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error?.message ||
        `Failed to fetch spreadsheet (status ${res.status}). Verify you have access permissions.`
    );
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Contest Spreadsheet',
    url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets: (data.sheets || []).map((s: { properties: { sheetId: number; title: string } }) => ({
      id: s.properties.sheetId,
      title: s.properties.title,
    })),
  };
}

export async function createContestSpreadsheet(
  token: string,
  title: string = 'Summertide Studio — Lyric Contest Scores & Rankings'
): Promise<SpreadsheetInfo> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Raw Scores',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Final Rankings',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to create spreadsheet in Google Sheets');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize Headers in both sheets
  const rawHeaders = [
    'Timestamp',
    'Judge / Producer',
    'Entrant / Submission',
    'Writing Quality (24)',
    'Originality & Creativity (24)',
    'Emotional Impact (24)',
    'Structure & Cohesion (24)',
    'Total Score (96)',
    'Average per Criterion',
    'Judge Comments / Feedback',
  ];

  const rankingHeaders = [
    'Rank',
    'Entrant / Song Title',
    'Judges Evaluated',
    'Aggregate Points',
    'Final Average Score (/100)',
    'Writing Avg (/24)',
    'Originality Avg (/24)',
    'Emotion Avg (/24)',
    'Structure Avg (/24)',
    'High Score',
    'Low Score',
    'Contest Standing',
  ];

  // Populate headers
  await Promise.all([
    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Raw%20Scores!A1:J1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rawHeaders] }),
      }
    ),
    fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Final%20Rankings!A1:L1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rankingHeaders] }),
      }
    ),
  ]);

  return {
    id: spreadsheetId,
    title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheets: [
      { id: 0, title: 'Raw Scores' },
      { id: 1, title: 'Final Rankings' },
    ],
  };
}

export async function appendScoreToSheet(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  score: JudgeScoreSubmission
): Promise<void> {
  const row = [
    score.timestamp || new Date().toLocaleString(),
    score.judgeName,
    score.entrantName,
    score.writing,
    score.originality,
    score.emotion,
    score.structure,
    score.totalScore,
    score.averageScore.toFixed(2),
    score.comments,
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(sheetTitle)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to append score to Google Sheets');
  }
}

export async function readScoresFromSheet(
  token: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<JudgeScoreSubmission[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(sheetTitle)}!A1:Z500`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to read scores from Google Sheets');
  }

  const data = await res.json();
  const rows: (string | number)[][] = data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  // Parse header mapping
  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  const findCol = (...keywords: string[]): number => {
    return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const timestampCol = findCol('timestamp', 'date', 'time');
  const judgeCol = findCol('judge', 'producer', 'evaluator');
  const entrantCol = findCol('entrant', 'submission', 'song', 'title', 'artist');
  const writingCol = findCol('writing', 'quality');
  const origCol = findCol('originality', 'creativity');
  const emotionCol = findCol('emotion', 'storytelling', 'impact');
  const structCol = findCol('structure', 'cohesion');
  const totalCol = findCol('total');
  const commentCol = findCol('comment', 'opinion', 'feedback', 'notes');

  const scores: JudgeScoreSubmission[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Entrant or Judge must exist
    const entrantName = (entrantCol >= 0 ? String(row[entrantCol] || '') : String(row[2] || '')).trim();
    const judgeName = (judgeCol >= 0 ? String(row[judgeCol] || '') : String(row[1] || '')).trim();

    if (!entrantName && !judgeName) continue;

    const parseNum = (val: unknown, fallback: number = 18): number => {
      const n = Number(val);
      return !isNaN(n) && n >= 0 ? n : fallback;
    };

    const writing = writingCol >= 0 ? parseNum(row[writingCol]) : parseNum(row[3]);
    const originality = origCol >= 0 ? parseNum(row[origCol]) : parseNum(row[4]);
    const emotion = emotionCol >= 0 ? parseNum(row[emotionCol]) : parseNum(row[5]);
    const structure = structCol >= 0 ? parseNum(row[structCol]) : parseNum(row[6]);
    const totalScore = totalCol >= 0 ? parseNum(row[totalCol], writing + originality + emotion + structure) : (writing + originality + emotion + structure);
    const comments = commentCol >= 0 ? String(row[commentCol] || '') : String(row[9] || '');
    const timestamp = timestampCol >= 0 ? String(row[timestampCol] || '') : String(row[0] || new Date().toLocaleDateString());

    scores.push({
      id: `score-${i}`,
      timestamp,
      judgeName: judgeName || 'Independent Judge',
      entrantName: entrantName || 'Untitled Submission',
      writing,
      originality,
      emotion,
      structure,
      totalScore,
      averageScore: totalScore / 4,
      comments,
      sheetRowIndex: i + 1,
    });
  }

  return scores;
}

export async function writeRankingsToSheet(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  rankings: EntrantRanking[]
): Promise<void> {
  const rankingHeaders = [
    'Rank',
    'Entrant / Song Title',
    'Judges Evaluated',
    'Aggregate Points',
    'Final Average Score (/100)',
    'Writing Avg (/24)',
    'Originality Avg (/24)',
    'Emotion Avg (/24)',
    'Structure Avg (/24)',
    'High Score',
    'Low Score',
    'Contest Standing',
  ];

  const rows = rankings.map((r) => [
    `#${r.rank}`,
    r.entrantName,
    r.judgeCount,
    r.totalPoints,
    r.averageScore.toFixed(2),
    r.writingAvg.toFixed(1),
    r.originalityAvg.toFixed(1),
    r.emotionAvg.toFixed(1),
    r.structureAvg.toFixed(1),
    r.highestScore,
    r.lowestScore,
    r.rank === 1
      ? '1st Place — Contest Winner'
      : r.rank === 2
      ? '2nd Place — Runner Up'
      : r.rank === 3
      ? '3rd Place — Bronze Honoree'
      : r.averageScore >= 75
      ? 'Finalist Honor Roll'
      : 'Completed Evaluation',
  ]);

  const allValues = [rankingHeaders, ...rows];

  // Clear existing sheet content first to avoid stale rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(sheetTitle)}!A1:L500:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // Write new rankings
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(sheetTitle)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allValues,
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to write rankings to Google Sheet');
  }
}
