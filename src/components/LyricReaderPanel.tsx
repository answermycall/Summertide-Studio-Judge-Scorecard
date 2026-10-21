import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Copy,
  Check,
  Type,
  Sparkles,
  User,
  MessageCircle,
  BookOpen,
  Edit3,
  X,
  FileCode,
} from 'lucide-react';
import { ParsedLyricSubmission } from '../utils/lyricParser';

interface LyricReaderPanelProps {
  submission: ParsedLyricSubmission;
  onUpdateSubmission: (parsed: ParsedLyricSubmission) => void;
  onUploadFile: (file: File) => void;
  onPasteText: (text: string) => void;
  onClear: () => void;
}

export const LyricReaderPanel: React.FC<LyricReaderPanelProps> = ({
  submission,
  onUpdateSubmission,
  onUploadFile,
  onPasteText,
  onClear,
}) => {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isCopied, setIsCopied] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteInput, setPasteInput] = useState('');

  const hasContent = !!(
    submission.songTitle ||
    submission.alias ||
    submission.lyrics ||
    submission.storyConcept
  );

  const handleCopyLyrics = () => {
    if (!submission.lyrics) return;
    navigator.clipboard.writeText(submission.lyrics);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pasteInput.trim()) {
      onPasteText(pasteInput.trim());
      setIsPasteModalOpen(false);
      setPasteInput('');
    }
  };

  const handleLoadTemplate = () => {
    const template = `Song Title: Midnight Horizon
Alias: Luna Starlight
Discord Username: lunastarlight#0001

Optional Story/Concept: A solitary night drive across a quiet coastal highway reflecting on changes and letting go of the past.

[Verse 1]
Streetlights flickering across the asphalt sea
Shadows tracing steps where we used to be
Turn the dial to a melody we made
Watch the neon memories begin to fade

[Pre-Chorus]
There's a whisper in the rearview mirror's glass
Telling me the heavy days will pass

[Chorus]
Catch the midnight horizon, burn away the cold
Every quiet highway has a story untold
I am letting go of what I couldn't save
Riding on the crest of a brand new wave

[Verse 2]
Salt air rolling through the open window frame
Whispering the silence of an unspoken name
No regrets left parked along the gravel shore
I don't look behind this dashboard anymore

[Bridge]
Let the headlights pierce the dark
Let the engine heal the spark
We are more than what we lost along the line

[Final Chorus]
Catch the midnight horizon, burn away the cold
Every quiet highway has a story untold
I am letting go of what I couldn't save
Riding on the crest of a brand new wave

[Outro]
Across the horizon...
Just me and the open road.`;
    onPasteText(template);
  };

  // Render stylized lyrics with colored badges for section tags
  const renderFormattedLyrics = () => {
    if (!submission.lyrics) {
      return (
        <div className="text-stone-400 italic text-sm text-center py-8">
          No lyric sections provided yet.
        </div>
      );
    }

    const lines = submission.lyrics.split(/\r?\n/);

    return (
      <div className="space-y-1">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          const isSectionHeader = /^\[[^\]]+\]/i.test(trimmed);

          if (isSectionHeader) {
            return (
              <div key={idx} className="pt-4 pb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs uppercase tracking-wider shadow-2xs border border-blue-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  {trimmed}
                </span>
              </div>
            );
          }

          if (!trimmed) {
            return <div key={idx} className="h-3" />;
          }

          return (
            <div
              key={idx}
              className={`leading-relaxed text-stone-800 font-serif tracking-normal ${
                fontSize === 'sm'
                  ? 'text-xs'
                  : fontSize === 'lg'
                  ? 'text-base sm:text-lg'
                  : 'text-sm sm:text-base'
              }`}
            >
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const wordCount = submission.lyrics
    ? submission.lyrics.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const lineCount = submission.lyrics
    ? submission.lyrics.split(/\r?\n/).filter((l) => l.trim()).length
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-lg p-5 sm:p-7 flex flex-col h-full animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#426b63] bg-[#eaf2ef] px-2.5 py-0.5 rounded-full">
              Lyric Sheet Viewer
            </span>
            {hasContent && (
              <span className="text-[11px] text-stone-400">
                {wordCount} words · {lineCount} lines
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1 leading-tight">
            {submission.songTitle || 'Participant Submission'}
          </h3>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasContent && (
            <>
              {/* Font Size Selector */}
              <div className="hidden sm:flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-1 rounded font-bold ${
                    fontSize === 'sm' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Small text"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-1 rounded font-bold ${
                    fontSize === 'base' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Default text"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-1 rounded font-bold ${
                    fontSize === 'lg' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                  }`}
                  title="Large text"
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyLyrics}
                className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors"
                title="Copy raw lyrics"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onClear}
                className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-600 text-stone-400 transition-colors"
                title="Clear current lyric sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {hasContent ? (
        <div className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1">
          {/* Metadata Badges (Alias & Discord) */}
          <div className="flex flex-wrap items-center gap-2">
            {submission.alias && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-800">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-400 font-normal">Artist / Alias:</span>
                <span className="font-bold text-stone-900">{submission.alias}</span>
              </div>
            )}

            {submission.discordUsername && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-xs font-semibold text-[#5865F2]">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-mono">@{submission.discordUsername}</span>
              </div>
            )}
          </div>

          {/* Optional Story / Concept Callout */}
          {submission.storyConcept && (
            <div className="p-4 rounded-2xl bg-[#fbf7ef] border-l-4 border-[#c28c3b] shadow-2xs text-stone-800 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#91621f]">
                <BookOpen className="w-3.5 h-3.5" />
                Story & Concept Inspiration
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed text-[#5e4a2f]">
                “{submission.storyConcept}”
              </p>
            </div>
          )}

          {/* Formatted Lyrics Body */}
          <div className="pt-2">{renderFormattedLyrics()}</div>
        </div>
      ) : (
        /* Empty Upload / Paste State */
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <FileText className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-stone-900">Upload Participant Submission</h4>
            <p className="text-xs text-stone-500 max-w-sm mt-1 leading-relaxed">
              Upload the participant's lyric text file or paste the text directly. Song title, artist
              alias, Discord handle, story, and lyrics will auto-fill instantly.
            </p>
          </div>

          {/* Upload Button & Paste Button */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>Upload .txt File</span>
              <input
                type="file"
                accept=".txt,.doc,.docx,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsPasteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-stone-500" />
              <span>Paste Text</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleLoadTemplate}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load sample formatted lyrics to test</span>
            </button>
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-stone-900">
                  Paste Participant Lyric Submission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Paste the submission text following the template (Song Title, Alias, Discord Username,
              Optional Story/Concept, and section tags like [Verse 1], [Chorus]):
            </p>

            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <textarea
                rows={12}
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder={`Song Title: Your song name\nAlias: Your artist name\nDiscord Username: Your username\n\nOptional Story/Concept: Briefly describe the inspiration...\n\n[Verse 1]\nWrite lyrics here...\n\n[Chorus]\nWrite lyrics here...`}
                className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs text-stone-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                autoFocus
                required
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] shadow-xs cursor-pointer"
                >
                  Auto-Fill & Display Lyrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
