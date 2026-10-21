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
  BookOpen,
  Eye,
  EyeOff,
  Upload,
  FileText,
} from 'lucide-react';
import {
  CRITERIA_CONFIG,
  TIER_DESCRIPTIONS,
  getTier,
  getSummaryNarration,
  JudgeScoreSubmission,
} from '../types/contest';
import { SpreadsheetInfo } from '../services/sheets';
import { LyricReaderPanel } from './LyricReaderPanel';
import { parseLyricSubmission, ParsedLyricSubmission } from '../utils/lyricParser';

interface ScorecardViewProps {
  initialEntrantName?: string;
  defaultJudgeName?: string;
  connectedSheet: SpreadsheetInfo | null;
  onSubmitScore: (score: JudgeScoreSubmission) => Promise<boolean>;
  isSubmitting: boolean;
  knownJudges: string[];
  knownEntrants: string[];
  existingScores?: JudgeScoreSubmission[];
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  initialEntrantName = '',
  defaultJudgeName = '',
  connectedSheet,
  onSubmitScore,
  isSubmitting,
  knownJudges,
  knownEntrants,
  existingScores = [],
}) => {
  const [judgeName, setJudgeName] = useState(defaultJudgeName || '');
  const [entrantName, setEntrantName] = useState(initialEntrantName || '');
  const [comments, setComments] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Split-Screen Lyrics Panel State
  const [isLyricsOpen, setIsLyricsOpen] = useState(true);
  const [parsedSubmission, setParsedSubmission] = useState<ParsedLyricSubmission>({
    songTitle: '',
    alias: '',
    discordUsername: '',
    storyConcept: '',
    lyrics: '',
    formattedEntrantName: '',
  });

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
      // Check if existing scores have lyrics for this entrant
      const matched = existingScores.find(
        (s) => s.entrantName.trim().toLowerCase() === initialEntrantName.trim().toLowerCase()
      );
      if (matched && matched.lyrics) {
        setParsedSubmission({
          songTitle: matched.songTitle || initialEntrantName,
          alias: matched.alias || '',
          discordUsername: matched.discordUsername || '',
          storyConcept: matched.storyConcept || '',
          lyrics: matched.lyrics || '',
          formattedEntrantName: initialEntrantName,
        });
        setIsLyricsOpen(true);
      }
    }
  }, [initialEntrantName, existingScores]);

  const totalScore =
    scores.writing + scores.originality + scores.emotion + scores.structure;
  const averageScore = totalScore / 4;
  const meterFillPercent = Math.min(100, Math.round(totalScore));
  const summaryNarration = getSummaryNarration(totalScore);

  const handleScoreChange = (key: string, val: number) => {
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

  // Upload Participant File
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseLyricSubmission(content);
        setParsedSubmission(parsed);
        if (parsed.formattedEntrantName) {
          setEntrantName(parsed.formattedEntrantName);
        }
        setIsLyricsOpen(true);
        setStatusMessage({
          type: 'success',
          text: `Loaded lyric submission: "${parsed.songTitle || file.name}".`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Paste Participant Text
  const handlePasteText = (text: string) => {
    const parsed = parseLyricSubmission(text);
    setParsedSubmission(parsed);
    if (parsed.formattedEntrantName) {
      setEntrantName(parsed.formattedEntrantName);
    }
    setIsLyricsOpen(true);
    setStatusMessage({
      type: 'success',
      text: `Loaded lyric submission: "${parsed.songTitle || 'Pasted Submission'}".`,
    });
  };

  const handleClearLyrics = () => {
    setParsedSubmission({
      songTitle: '',
      alias: '',
      discordUsername: '',
      storyConcept: '',
      lyrics: '',
      formattedEntrantName: '',
    });
  };

  // Auto-fill lyrics when an existing song is picked
  const handleSelectExistingEntrant = (selected: string) => {
    setEntrantName(selected);
    setIsPickerOpen(false);

    // Look for previous lyrics stored in session
    const matched = existingScores.find(
      (s) => s.entrantName.trim().toLowerCase() === selected.trim().toLowerCase() && s.lyrics
    );
    if (matched && matched.lyrics) {
      setParsedSubmission({
        songTitle: matched.songTitle || selected,
        alias: matched.alias || '',
        discordUsername: matched.discordUsername || '',
        storyConcept: matched.storyConcept || '',
        lyrics: matched.lyrics || '',
        formattedEntrantName: selected,
      });
      setIsLyricsOpen(true);
    }
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
      songTitle: parsedSubmission.songTitle || entrantName.trim(),
      alias: parsedSubmission.alias || '',
      discordUsername: parsedSubmission.discordUsername || '',
      storyConcept: parsedSubmission.storyConcept || '',
      lyrics: parsedSubmission.lyrics || '',
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
      setEntrantName('');
      handleClearLyrics();
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
      parsedSubmission.alias ? `Artist / Alias: ${parsedSubmission.alias}` : '',
      parsedSubmission.discordUsername ? `Discord: @${parsedSubmission.discordUsername}` : '',
      parsedSubmission.storyConcept ? `Story / Concept: ${parsedSubmission.storyConcept}` : '',
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
      '',
      parsedSubmission.lyrics ? '--- LYRICS ---\n' + parsedSubmission.lyrics : '',
    ].filter(Boolean);

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
    <div
      className={`mx-auto py-2 sm:py-6 animate-in fade-in duration-200 transition-all ${
        isLyricsOpen ? 'max-w-7xl' : 'max-w-3xl'
      }`}
    >
      {/* Header Info */}
      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-[#426b63] mb-1">
          Summertide Studio · Producer Panel
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Lyric Contest Judge Scorecard
        </h2>
        <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
          Score each eligible submission across four criteria. Upload or paste the participant's lyric
          sheet to view lyrics on the left while scoring on the right. Each criterion is worth up to 25
          points, but <strong>24 is the highest score</strong> a judge may award.
        </p>
      </div>

      {/* Top Toggle Bar for Split Screen Lyrics */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLyricsOpen(!isLyricsOpen)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs ${
              isLyricsOpen
                ? 'bg-[#2563eb] text-white shadow-xs hover:bg-[#1d4ed8]'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {isLyricsOpen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{isLyricsOpen ? 'Lyrics Visible (Split View)' : 'Lyrics Hidden (Scorecard Only)'}</span>
          </button>

          {parsedSubmission.songTitle ? (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg truncate max-w-xs">
              🎵 {parsedSubmission.songTitle}
            </span>
          ) : (
            <span className="text-xs text-stone-400 hidden sm:inline">
              Upload participant .txt to auto-fill title, artist, discord & story
            </span>
          )}
        </div>

        {/* Quick Upload Action */}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Upload Lyrics (.txt)</span>
            <input
              type="file"
              accept=".txt,.doc,.docx,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Split Layout: Left side lyrics, Right side scorecard */}
      <div
        className={`gap-6 items-start ${
          isLyricsOpen ? 'grid grid-cols-1 lg:grid-cols-2' : 'max-w-3xl mx-auto'
        }`}
      >
        {/* Left Column: Lyric Reader Panel */}
        {isLyricsOpen && (
          <div className="lg:sticky lg:top-24">
            <LyricReaderPanel
              submission={parsedSubmission}
              onUpdateSubmission={setParsedSubmission}
              onUploadFile={handleFileUpload}
              onPasteText={handlePasteText}
              onClear={handleClearLyrics}
            />
          </div>
        )}

        {/* Right Column: Scorecard Form */}
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

            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Entrant / Song Title <span className="text-rose-500">*</span>
                </label>
                {knownEntrants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    {isPickerOpen ? 'Hide Song List' : `Pick Existing Song (${knownEntrants.length})`}
                  </button>
                )}
              </div>

              <input
                type="text"
                list="known-entrants-list"
                value={entrantName}
                onChange={(e) => setEntrantName(e.target.value)}
                placeholder="Enter entrant or song title"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <datalist id="known-entrants-list">
                {knownEntrants.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>

              {/* Matching Suggestions dropdown when typing */}
              {entrantName.trim() &&
                knownEntrants.some(
                  (e) =>
                    e.toLowerCase().includes(entrantName.trim().toLowerCase()) &&
                    e.toLowerCase() !== entrantName.trim().toLowerCase()
                ) && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-20 p-2 text-xs space-y-1">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-0.5">
                      Suggested Existing Entries:
                    </div>
                    {knownEntrants
                      .filter(
                        (e) =>
                          e.toLowerCase().includes(entrantName.trim().toLowerCase()) &&
                          e.toLowerCase() !== entrantName.trim().toLowerCase()
                      )
                      .slice(0, 5)
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSelectExistingEntrant(suggestion)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 font-semibold text-stone-800 transition-colors flex items-center justify-between"
                        >
                          <span>{suggestion}</span>
                          <span className="text-[10px] text-stone-400 font-normal">Use this exact title</span>
                        </button>
                      ))}
                  </div>
                )}

              {/* Quick Pick Chips List */}
              {isPickerOpen && knownEntrants.length > 0 && (
                <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1.5">
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Select an Existing Song to Score:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {knownEntrants.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelectExistingEntrant(item)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          entrantName.toLowerCase() === item.toLowerCase()
                            ? 'bg-[#2563eb] text-white border-[#2563eb]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-blue-500'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate Submission Warning */}
              {judgeName.trim() &&
                entrantName.trim() &&
                existingScores.some(
                  (s) =>
                    s.judgeName.trim().toLowerCase() === judgeName.trim().toLowerCase() &&
                    s.entrantName.trim().toLowerCase() === entrantName.trim().toLowerCase()
                ) && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <div>
                      <strong>Previous evaluation exists:</strong> You ({judgeName}) have already scored{' '}
                      <em>"{entrantName}"</em>. Submitting now will record an updated evaluation.
                    </div>
                  </div>
                )}
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
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
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-sm transition-all hover:shadow-md disabled:opacity-60 cursor-pointer"
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
    </div>
  );
};
