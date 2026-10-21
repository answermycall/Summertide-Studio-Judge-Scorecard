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
  Music,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  CRITERIA_CONFIG,
  TIER_DESCRIPTIONS,
  getTier,
  getSummaryNarration,
  JudgeScoreSubmission,
  ContestSongEntry,
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
  contestSongs?: ContestSongEntry[];
  isAdmin?: boolean;
  onGoToSongEntries?: () => void;
  onTriggerDuplicateModal?: (song: ContestSongEntry, filename?: string) => void;
  onRegisterNewSong?: (song: ContestSongEntry) => void;
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
  contestSongs = [],
  isAdmin = false,
  onGoToSongEntries,
  onTriggerDuplicateModal,
  onRegisterNewSong,
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

  // Sync with initial entrant or pre-loaded song
  useEffect(() => {
    if (initialEntrantName) {
      setEntrantName(initialEntrantName);

      // Check contestSongs first
      const songMatch = contestSongs.find(
        (s) =>
          s.songTitle.trim().toLowerCase() === initialEntrantName.trim().toLowerCase() ||
          s.formattedEntrantName.trim().toLowerCase() === initialEntrantName.trim().toLowerCase()
      );

      if (songMatch) {
        setParsedSubmission({
          songTitle: songMatch.songTitle,
          alias: songMatch.alias || '',
          discordUsername: songMatch.discordUsername || '',
          storyConcept: songMatch.storyConcept || '',
          lyrics: songMatch.lyrics || '',
          formattedEntrantName: songMatch.formattedEntrantName || songMatch.songTitle,
        });
        setIsLyricsOpen(true);
      } else {
        // Fallback to check if existing scores have lyrics
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
    }
  }, [initialEntrantName, contestSongs, existingScores]);

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

  // Upload Participant File with duplicate check
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseLyricSubmission(content);
        const titleToCheck = (parsed.songTitle || file.name.replace(/\.[^/.]+$/, '')).trim();

        // Check if an entry with this title already exists in registered contest songs
        const existing = contestSongs.find(
          (s) =>
            s.songTitle.trim().toLowerCase() === titleToCheck.toLowerCase() ||
            s.formattedEntrantName.trim().toLowerCase() === parsed.formattedEntrantName.trim().toLowerCase()
        );

        if (existing) {
          if (onTriggerDuplicateModal) {
            onTriggerDuplicateModal(existing, file.name);
          } else {
            handleSelectExistingSong(existing);
          }
          return;
        }

        // If not in contest songs but user is not admin
        if (!isAdmin) {
          setStatusMessage({
            type: 'error',
            text: `"${titleToCheck}" is not registered in the contest. Only Contest Producers can add new songs. Please pick a registered song.`,
          });
          return;
        }

        // Admin uploading new entry
        setParsedSubmission(parsed);
        if (parsed.formattedEntrantName) {
          setEntrantName(parsed.formattedEntrantName);
        }
        setIsLyricsOpen(true);

        if (onRegisterNewSong) {
          onRegisterNewSong({
            id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            songTitle: titleToCheck,
            alias: parsed.alias,
            discordUsername: parsed.discordUsername,
            storyConcept: parsed.storyConcept,
            lyrics: parsed.lyrics,
            formattedEntrantName: parsed.formattedEntrantName || titleToCheck,
            addedAt: new Date().toISOString(),
            addedBy: 'Scorecard Upload',
          });
        }

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
    const titleToCheck = parsed.songTitle?.trim();

    if (titleToCheck) {
      const existing = contestSongs.find(
        (s) =>
          s.songTitle.trim().toLowerCase() === titleToCheck.toLowerCase() ||
          s.formattedEntrantName.trim().toLowerCase() === parsed.formattedEntrantName.trim().toLowerCase()
      );
      if (existing) {
        if (onTriggerDuplicateModal) {
          onTriggerDuplicateModal(existing, 'Pasted text');
        } else {
          handleSelectExistingSong(existing);
        }
        return;
      }
    }

    if (!isAdmin && titleToCheck) {
      setStatusMessage({
        type: 'error',
        text: `"${titleToCheck}" is not registered in the contest. Only Contest Producers can add new entries.`,
      });
      return;
    }

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
  const handleSelectExistingSong = (song: ContestSongEntry) => {
    setEntrantName(song.formattedEntrantName || song.songTitle);
    setIsPickerOpen(false);

    setParsedSubmission({
      songTitle: song.songTitle,
      alias: song.alias || '',
      discordUsername: song.discordUsername || '',
      storyConcept: song.storyConcept || '',
      lyrics: song.lyrics || '',
      formattedEntrantName: song.formattedEntrantName || song.songTitle,
    });
    setIsLyricsOpen(true);
  };

  const handleSelectExistingEntrant = (selected: string) => {
    setEntrantName(selected);
    setIsPickerOpen(false);

    // Look for matching song entry first
    const songMatch = contestSongs.find(
      (s) =>
        s.songTitle.trim().toLowerCase() === selected.trim().toLowerCase() ||
        s.formattedEntrantName.trim().toLowerCase() === selected.trim().toLowerCase()
    );

    if (songMatch) {
      handleSelectExistingSong(songMatch);
      return;
    }

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
      setStatusMessage({ type: 'error', text: 'Please enter your Judge or Producer name.' });
      return;
    }

    if (!entrantName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter or select the Entrant / Song Title.' });
      return;
    }

    const payload: JudgeScoreSubmission = {
      timestamp: new Date().toISOString(),
      judgeName: judgeName.trim(),
      entrantName: entrantName.trim(),
      songTitle: parsedSubmission.songTitle || entrantName.trim(),
      alias: parsedSubmission.alias || undefined,
      discordUsername: parsedSubmission.discordUsername || undefined,
      storyConcept: parsedSubmission.storyConcept || undefined,
      lyrics: parsedSubmission.lyrics || undefined,
      comments: comments.trim(),
      writing: scores.writing,
      originality: scores.originality,
      emotion: scores.emotion,
      structure: scores.structure,
      totalScore,
      averageScore,
    };

    const success = await onSubmitScore(payload);
    if (success) {
      setStatusMessage({
        type: 'success',
        text: `Successfully scored "${entrantName}" with ${totalScore}/100 points!`,
      });
    }
  };

  const handleExportText = () => {
    const lines = [
      '==================================================',
      'SUMMERTIDE STUDIO — LYRIC CONTEST JUDGE SCORECARD',
      `Date & Time: ${new Date().toLocaleString()}`,
      `Judge / Producer: ${judgeName.trim() || 'Not provided'}`,
      `Entrant / Submission: ${entrantName.trim() || 'Not provided'}`,
      parsedSubmission.alias ? `Artist / Alias: ${parsedSubmission.alias}` : '',
      parsedSubmission.discordUsername ? `Discord: @${parsedSubmission.discordUsername}` : '',
      parsedSubmission.storyConcept ? `Story / Concept: ${parsedSubmission.storyConcept}` : '',
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
      "Personal Opinion / Judge's Comments:",
      comments.trim() || 'None provided',
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
        <div className="text-xs font-bold uppercase tracking-widest text-[#0284c7] mb-1">
          Summertide Studio · Judging Portal
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Lyric Contest Judge Scorecard
        </h2>
        <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
          Score each eligible submission across four criteria. View lyrics on the left while scoring on
          the right. Each criterion is worth up to 25 points, with <strong>24 as the highest score</strong>{' '}
          a judge may award.
        </p>
      </div>

      {/* Top Toggle Bar for Split Screen Lyrics */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200/90 p-3 sm:p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLyricsOpen(!isLyricsOpen)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs ${
              isLyricsOpen
                ? 'bg-[#0284c7] text-white shadow-xs hover:bg-[#0369a1]'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {isLyricsOpen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{isLyricsOpen ? 'Lyrics Visible (Split View)' : 'Lyrics Hidden (Scorecard Only)'}</span>
          </button>

          {parsedSubmission.songTitle ? (
            <span className="text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg truncate max-w-xs">
              🎵 {parsedSubmission.songTitle}
            </span>
          ) : (
            <span className="text-xs text-stone-400 hidden sm:inline">
              Select a contest song or upload participant .txt to view lyrics
            </span>
          )}
        </div>

        {/* Quick Upload Action */}
        <div className="flex items-center gap-2">
          {onGoToSongEntries && (
            <button
              type="button"
              onClick={onGoToSongEntries}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0284c7] text-xs font-bold transition-colors shadow-2xs"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Browse All Songs</span>
            </button>
          )}

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
          className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-200/90 shadow-xl p-5 sm:p-8 space-y-6"
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
                placeholder="Enter your judge name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:border-transparent transition-all"
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
                  Contest Song / Entrant <span className="text-rose-500">*</span>
                </label>
                {(contestSongs.length > 0 || knownEntrants.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
                    className="text-[11px] font-bold text-[#0284c7] hover:text-[#0369a1] underline inline-flex items-center gap-0.5"
                  >
                    <span>{isPickerOpen ? 'Hide' : 'Pick Song'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* If user is not admin, provide a clean song selector or display selected song */}
              {!isAdmin && contestSongs.length > 0 ? (
                <div>
                  <div
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-900 font-medium text-sm flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className={entrantName ? 'text-stone-900 font-bold' : 'text-stone-400'}>
                      {entrantName || 'Select a contest song to grade...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  list="known-entrants-list"
                  value={entrantName}
                  onChange={(e) => setEntrantName(e.target.value)}
                  placeholder="Enter entrant or song title"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 font-medium text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:border-transparent transition-all"
                  required
                />
              )}

              <datalist id="known-entrants-list">
                {contestSongs.map((s) => (
                  <option key={s.id} value={s.formattedEntrantName || s.songTitle} />
                ))}
                {knownEntrants.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>

              {/* Quick Pick Dropdown */}
              {isPickerOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-sky-200 rounded-2xl shadow-xl z-30 p-3 max-h-60 overflow-y-auto space-y-1.5 animate-in fade-in duration-100">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2">
                    Registered Contest Songs:
                  </div>
                  {contestSongs.length > 0 ? (
                    contestSongs.map((song) => {
                      const isGradedByMe = judgeName.trim() && existingScores.some(
                        (s) =>
                          s.judgeName.trim().toLowerCase() === judgeName.trim().toLowerCase() &&
                          (s.songTitle?.trim().toLowerCase() === song.songTitle.trim().toLowerCase() ||
                           s.entrantName.trim().toLowerCase() === song.formattedEntrantName.trim().toLowerCase())
                      );
                      const isSelected = entrantName.trim().toLowerCase() === (song.formattedEntrantName || song.songTitle).trim().toLowerCase();

                      return (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => handleSelectExistingSong(song)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-sky-100 text-[#0284c7] font-bold border border-sky-300'
                              : 'hover:bg-sky-50 text-stone-800'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-stone-900">{song.songTitle}</div>
                            <div className="text-[11px] text-stone-500">
                              {song.alias || 'Unknown'} {song.discordUsername && `@${song.discordUsername}`}
                            </div>
                          </div>
                          {isGradedByMe ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                              Graded
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                              Pending
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    knownEntrants.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleSelectExistingEntrant(item)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-50 text-xs font-semibold text-stone-800 transition-colors"
                      >
                        {item}
                      </button>
                    ))
                  )}
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
                      <em>"{entrantName}"</em>. Submitting will record an updated evaluation.
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* QUICK SCALE REFERENCE: Switched to the TOP as requested */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Quick Scale Reference</span>
              </h4>
              <span className="text-[11px] text-[#0284c7] font-semibold bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                1–24 Allowed (24 Max)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {TIER_DESCRIPTIONS.map((t) => (
                <div key={t.range} className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/50">
                  <div className="font-extrabold text-[#0284c7]">{t.range}</div>
                  <div className="text-stone-700 font-semibold text-[11px] mt-0.5">{t.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5">
              <strong>Reserved maximum:</strong> 25 is the theoretical ceiling only. 24 is the highest permitted awardable score for any single criterion.
            </div>
          </div>

          {/* Section Heading: Scoring Criteria */}
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
              Adjust sliders to score the lyric submission across each area.
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
                      <span className="text-xl font-extrabold text-[#0284c7] tabular-nums">
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
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
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

          {/* Live Score Summary Banner: Vibrant Sea Blue Theme */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] text-white shadow-xl border border-sky-400/30">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold text-sky-200 tracking-wider uppercase">
                  Total Judge Score
                </div>
                <div className="text-3xl sm:text-5xl font-black tracking-tight mt-1 text-white tabular-nums drop-shadow-xs">
                  {totalScore}
                  <span className="text-lg sm:text-2xl text-sky-200 font-bold ml-1.5">
                    / 100
                  </span>
                  <span className="text-xs text-sky-200/90 font-medium ml-2">
                    (96 max awardable)
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-sky-200">Average per criterion</div>
                <div className="text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
                  {averageScore.toFixed(2)} / 25
                </div>
              </div>
            </div>

            {/* Progress Bar Meter */}
            <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden mt-4 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-sky-300 to-cyan-200 transition-all duration-200 rounded-full shadow-xs"
                style={{ width: `${meterFillPercent}%` }}
              />
            </div>

            <div className="mt-3 text-xs sm:text-sm text-sky-100 font-medium">
              {summaryNarration}
            </div>
          </div>

          {/* PERSONAL OPINION / JUDGE'S COMMENTS: Switched to the BOTTOM as requested */}
          <div className="pt-2 border-t border-stone-200">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Personal Opinion / Judge's Comments{' '}
              <span className="text-stone-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share any additional thoughts, feedback, lyrical highlights, or impressions about this submission…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:border-transparent transition-all"
            />
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

          {/* Submission & Action Buttons in Sea Blue */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-60 cursor-pointer"
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
