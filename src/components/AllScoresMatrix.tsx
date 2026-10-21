import React, { useState } from 'react';
import {
  Table,
  Filter,
  Search,
  Users,
  Music,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  Download,
  AlertCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { JudgeScoreSubmission, getTier } from '../types/contest';

interface AllScoresMatrixProps {
  scores: JudgeScoreSubmission[];
  onOpenScorecardForEntrant: (entrantName: string) => void;
  onGoToScorecard?: () => void;
}

export const AllScoresMatrix: React.FC<AllScoresMatrixProps> = ({
  scores,
  onOpenScorecardForEntrant,
  onGoToScorecard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJudge, setSelectedJudge] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');

  // Extract unique judges and entrants
  const judges = Array.from(new Set(scores.map((s) => s.judgeName))).filter(Boolean);
  const entrants = Array.from(new Set(scores.map((s) => s.entrantName))).filter(Boolean);

  const filteredScores = scores.filter((s) => {
    const matchesSearch =
      s.entrantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.judgeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.comments && s.comments.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesJudge = selectedJudge === 'all' || s.judgeName === selectedJudge;
    return matchesSearch && matchesJudge;
  });

  // Build matrix mapping: [entrant][judge] -> JudgeScoreSubmission
  const matrix: { [entrant: string]: { [judge: string]: JudgeScoreSubmission } } = {};
  scores.forEach((s) => {
    if (!matrix[s.entrantName]) matrix[s.entrantName] = {};
    matrix[s.entrantName][s.judgeName] = s;
  });

  const filteredEntrants = entrants.filter((e) =>
    e.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Judge / Producer',
      'Entrant / Song Title',
      'Writing Quality (24)',
      'Originality & Creativity (24)',
      'Emotional Impact (24)',
      'Structure & Cohesion (24)',
      'Total Score (96)',
      'Average (/25)',
      'Comments',
    ];

    const rows = filteredScores.map((s) => [
      `"${s.timestamp}"`,
      `"${s.judgeName.replace(/"/g, '""')}"`,
      `"${s.entrantName.replace(/"/g, '""')}"`,
      s.writing,
      s.originality,
      s.emotion,
      s.structure,
      s.totalScore,
      s.averageScore.toFixed(2),
      `"${(s.comments || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'summertide-lyric-contest-all-scores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#426b63] mb-1">
            Judge Review & Calibration
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            All Judges' Scorecards & Matrix
          </h2>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            Compare scores across different judges, check for consensus or divergence, and review
            individual critique notes.
          </p>
        </div>

        {/* View switcher & CSV */}
        <div className="flex items-center gap-2">
          <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Cross Matrix
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Scorecard Log
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            title="Download CSV of all scores"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by entrant, judge, or comment keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#426b63]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <span className="text-xs font-semibold text-stone-600">Judge:</span>
            <select
              value={selectedJudge}
              onChange={(e) => setSelectedJudge(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-stone-800 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#426b63]"
            >
              <option value="all">All Judges ({judges.length})</option>
              {judges.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {scores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
          <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No judge scores recorded yet</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
            Connect your Google Sheet to pull your judges' scores, or start entering scores in the
            Judge Scorecard.
          </p>
          {onGoToScorecard && (
            <div className="mt-5">
              <button
                onClick={onGoToScorecard}
                className="px-4 py-2 bg-[#2e514a] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:bg-[#23403a] transition-all cursor-pointer"
              >
                + Go to Judge Scorecard
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'matrix' ? (
        /* Cross Matrix View */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 pl-4 sm:pl-6 pr-3 min-w-[200px]">Entrant / Song Title</th>
                  {judges.map((j) => (
                    <th key={j} className="py-3.5 px-3 text-center min-w-[140px]">
                      <div className="font-bold text-stone-900 truncate max-w-[130px] mx-auto">
                        {j}
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-center min-w-[100px]">Consensus</th>
                  <th className="py-3.5 pr-4 sm:pr-6 pl-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredEntrants.map((entrantName) => {
                  const entrantScores = judges
                    .map((j) => matrix[entrantName]?.[j])
                    .filter(Boolean);
                  const scoreValues = entrantScores.map((s) => s.totalScore);
                  const min = scoreValues.length ? Math.min(...scoreValues) : 0;
                  const max = scoreValues.length ? Math.max(...scoreValues) : 0;
                  const spread = max - min;
                  const isDivergent = spread >= 10;

                  return (
                    <tr key={entrantName} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-4 pl-4 sm:pl-6 pr-3">
                        <div className="font-bold text-stone-900">{entrantName}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {entrantScores.length} of {judges.length} judges evaluated
                        </div>
                      </td>

                      {/* Judge Cells */}
                      {judges.map((j) => {
                        const entry = matrix[entrantName]?.[j];
                        if (!entry) {
                          return (
                            <td key={j} className="py-4 px-3 text-center text-stone-300 italic text-xs">
                              —
                            </td>
                          );
                        }

                        const tier = getTier(entry.averageScore);
                        return (
                          <td key={j} className="py-4 px-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-black text-stone-900 text-sm tabular-nums">
                                {entry.totalScore}
                                <span className="text-[10px] text-stone-400 font-normal"> / 96</span>
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 ${tier.bg} ${tier.color}`}
                              >
                                {tier.label}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Consensus / Spread Badge */}
                      <td className="py-4 px-3 text-center">
                        {entrantScores.length > 1 ? (
                          isDivergent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              Spread: {spread} pts
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Tight consensus
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-stone-400">1 score</span>
                        )}
                      </td>

                      <td className="py-4 pr-4 sm:pr-6 pl-2 text-right">
                        <button
                          onClick={() => onOpenScorecardForEntrant(entrantName)}
                          className="text-xs font-bold text-[#426b63] hover:text-[#2e514a] p-1.5 hover:bg-stone-100 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Score</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Chronological Scorecard Log */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 pl-4 sm:pl-6 pr-3">Timestamp</th>
                  <th className="py-3.5 px-3">Judge</th>
                  <th className="py-3.5 px-3">Entrant / Song Title</th>
                  <th className="py-3.5 px-2 text-center">Writing</th>
                  <th className="py-3.5 px-2 text-center">Orig</th>
                  <th className="py-3.5 px-2 text-center">Emotion</th>
                  <th className="py-3.5 px-2 text-center">Struct</th>
                  <th className="py-3.5 px-3 text-right">Total</th>
                  <th className="py-3.5 pr-4 sm:pr-6 pl-3">Comments / Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredScores.map((score, idx) => (
                  <tr key={score.id || idx} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 pl-4 sm:pl-6 pr-3 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                      {score.timestamp}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-stone-900 whitespace-nowrap">
                      {score.judgeName}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-stone-800">
                      {score.entrantName}
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-stone-700">
                      {score.writing}
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-stone-700">
                      {score.originality}
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-stone-700">
                      {score.emotion}
                    </td>
                    <td className="py-3.5 px-2 text-center font-bold text-stone-700">
                      {score.structure}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-stone-900 tabular-nums">
                      {score.totalScore}
                      <span className="text-[10px] text-stone-400 font-normal"> / 96</span>
                    </td>
                    <td className="py-3.5 pr-4 sm:pr-6 pl-3 text-stone-600 italic text-xs max-w-xs truncate">
                      {score.comments ? `“${score.comments}”` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
