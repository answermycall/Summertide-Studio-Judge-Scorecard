import React, { useState, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  CRITERIA_CONFIG,
  TIER_DESCRIPTIONS,
  getTier,
  getSummaryNarration,
  JudgeScoreSubmission,
} from '../types/contest';
import { SpreadsheetInfo } from '../services/sheets';

interface ScorecardViewProps {
  initialEntrantName?: string;
  defaultJudgeName?: string;
  connectedSheet: SpreadsheetInfo | null;
  onSubmitScore: (score: JudgeScoreSubmission) => Promise<boolean>;
  isSubmitting: boolean;
  knownJudges: string[];
  knownEntrants: string[];
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  initialEntrantName = '',
  defaultJudgeName = '',
  connectedSheet,
  onSubmitScore,
  isSubmitting,
  knownJudges,
  knownEntrants,
}) => {
  const [judgeName, setJudgeName] = useState(defaultJudgeName || '');
  const [entrantName, setEntrantName] = useState(initialEntrantName || '');
  const [comments, setComments] = useState('');

  // 4 Criteria scores (default to 18 like in the original scorecard)
  const [scores, setScores] = useState<{ [key: string]: number }>({
    writing: 18,
    originality: 18,
    emotion: 18,
    structure: 18,
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (initialEntrantName) {
      setEntrantName(initialEntrantName);
    }
  }, [initialEntrantName]);

  const totalScore =
    scores.writing + scores.originality + scores.emotion + scores.structure;
  const averageScore = totalScore / 4;
  const meterFillPercent = Math.min(100, Math.round(totalScore));
  const summaryNarration = getSummaryNarration(totalScore);

  const handleScoreChange = (key: string, val: number) => {
    // 24 is max awardable
    const clamped = Math.max(1, Math.min(24, val));
    setScores((prev) => ({
      ...prev,
      [key]: clamped,
    }));
  };

  const handleReset = () => {
    setScores({
      writing: 18,
      originality: 18,
      emotion: 18,
      structure: 18,
    });
    setStatusMessage({ type: 'info', text: 'All criteria reset to default 18.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a judge or producer name.' });
      return;
    }
    if (!entrantName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter an entrant or song title.' });
      return;
    }

    const submission: JudgeScoreSubmission = {
      timestamp: new Date().toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      judgeName: judgeName.trim(),
      entrantName: entrantName.trim(),
      comments: comments.trim(),
      writing: scores.writing,
      originality: scores.originality,
      emotion: scores.emotion,
      structure: scores.structure,
      totalScore,
      averageScore,
    };

    setStatusMessage(null);
    const success = await onSubmitScore(submission);
    if (success) {
      setStatusMessage({
        type: 'success',
        text: `Scorecard recorded! ${
          connectedSheet ? 'Synced directly to Google Sheet.' : 'Saved to contest session.'
        }`,
      });
      // Clear optional comments and entrant for next submission, keep judge name
      setComments('');
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Failed to record scorecard. Check your connection or permissions.',
      });
    }
  };

  const handleExportText = () => {
    const lines = [
      'SUMMERTIDE STUDIO — LYRIC CONTEST JUDGE SCORECARD',
      `Date & Time: ${new Date().toLocaleString()}`,
      `Judge / Producer: ${judgeName.trim() || 'Not provided'}`,
      `Entrant / Submission: ${entrantName.trim() || 'Not provided'}`,
      '',
      "Personal Opinion / Judge's Comments:",
      comments.trim() || 'None provided',
      '',
      `1. Writing Quality: ${scores.writing}/25 (${getTier(scores.writing).label})`,
      `2. Originality & Creativity: ${scores.originality}/25 (${getTier(scores.originality).label})`,
      `3. Emotional Impact & Storytelling: ${scores.emotion}/25 (${getTier(scores.emotion).label})`,
      `4. Structure & Cohesion: ${scores.structure}/25 (${getTier(scores.structure).label})`,
      '',
      `TOTAL JUDGE SCORE: ${totalScore}/100 (Max permitted: 96)`,
      `AVERAGE PER CRITERION: ${averageScore.toFixed(2)}/25`,
      `EVALUATION: ${summaryNarration}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summertide-scorecard-${(entrantName || 'submission')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'info', text: 'Scorecard text file exported.' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-[#426b63] mb-1">
          Summertide Studio · Producer Panel
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Lyric Contest Judge Scorecard
        </h2>
        <p className="text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Score each eligible submission across four criteria. Adjust the sliders to calculate the total
          instantly. Each criterion is worth up to 25 points, but <strong>24 is the highest score</strong> a
          judge may award.
        </p>
      </div>

      {/* Main Scorecard Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-stone-200/90 shadow-lg p-5 sm:p-8 space-y-6"
      >
        {/* Meta Info: Judge & Entrant */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Judge / Producer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="known-judges-list"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              placeholder="Enter judge or producer name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-[#426b63] focus:border-transparent transition-all"
              required
            />
            <datalist id="known-judges-list">
              {knownJudges.map((j) => (
                <option key={j} value={j} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Entrant / Song Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="known-entrants-list"
              value={entrantName}
              onChange={(e) => setEntrantName(e.target.value)}
              placeholder="Enter entrant or song title"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-[#426b63] focus:border-transparent transition-all"
              required
            />
            <datalist id="known-entrants-list">
              {knownEntrants.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Comments Section */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Personal Opinion / Judge's Comments{' '}
            <span className="text-stone-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share any additional thoughts, feedback, lyrical highlights, or impressions about this submission…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#426b63] focus:border-transparent transition-all"
          />
        </div>

        {/* Section Heading */}
        <div className="pt-2 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Scoring Criteria
            </h3>
            <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
              Awardable range: 1–24 each
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Choose the score that best reflects the lyric submission for each criterion.
          </p>
        </div>

        {/* The 4 Criteria Sliders */}
        <div className="space-y-6 divide-y divide-stone-100">
          {CRITERIA_CONFIG.map((c, idx) => {
            const currentScore = scores[c.key] || 18;
            const tier = getTier(currentScore);

            return (
              <div key={c.key} className={idx > 0 ? 'pt-5' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      {idx + 1}. {c.name}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">{c.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-stone-900 tabular-nums">
                      {currentScore}
                    </span>
                    <span className="text-xs text-stone-400 font-semibold"> / 25</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="mt-4">
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={currentScore}
                    onChange={(e) => handleScoreChange(c.key, Number(e.target.value))}
                    aria-label={`${c.name} score`}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#426b63]"
                  />
                  <div className="flex justify-between text-[11px] text-stone-400 mt-1 font-medium">
                    <span>1 · Poor</span>
                    <span>12 · Competent</span>
                    <span>24 · Exceptional</span>
                  </div>
                </div>

                {/* Tier Badge */}
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.bg} ${tier.color}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{tier.label}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Score Summary Banner */}
        <div className="p-6 rounded-2xl bg-[#202b31] text-white shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-stone-400 tracking-wider uppercase">
                Total Judge Score
              </div>
              <div className="text-3xl sm:text-5xl font-black tracking-tight mt-1 text-white tabular-nums">
                {totalScore}
                <span className="text-lg sm:text-2xl text-stone-400 font-bold ml-1.5">
                  / 100
                </span>
                <span className="text-xs text-stone-400 font-medium ml-2">
                  (96 max awardable)
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-stone-400">Average per criterion</div>
              <div className="text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
                {averageScore.toFixed(2)} / 25
              </div>
            </div>
          </div>

          {/* Progress Bar Meter */}
          <div className="w-full h-2 bg-stone-700/80 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-[#9ec6b9] transition-all duration-200 rounded-full"
              style={{ width: `${meterFillPercent}%` }}
            />
          </div>

          <div className="mt-3 text-xs sm:text-sm text-stone-300 font-medium">
            {summaryNarration}
          </div>
        </div>

        {/* Quick Scale Guide */}
        <div className="pt-2 border-t border-stone-200">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            Quick Scale Reference
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {TIER_DESCRIPTIONS.map((t) => (
              <div key={t.range} className="p-2.5 rounded-xl border border-stone-200 bg-stone-50">
                <div className="font-bold text-stone-900">{t.range}</div>
                <div className="text-stone-700 font-semibold text-[11px]">{t.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5">
            <strong>Reserved maximum:</strong> 25 is the theoretical ceiling only. Do not award 25;
            24 is the highest permitted score for any criterion.
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-stone-100 text-stone-800 border border-stone-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-stone-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Submission & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2e514a] hover:bg-[#23403a] text-white font-bold text-sm shadow-sm transition-all hover:shadow-md disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Submitting to Sheet...'
                : connectedSheet
                ? 'Submit Score to Google Sheet'
                : 'Record Scorecard'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportText}
              className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Export scorecard (.txt)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export .txt</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Print Scorecard"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Reset scores to default 18"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
