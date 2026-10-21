import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Link2,
  Database,
  Unlink,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheets';

interface SheetSettingsViewProps {
  user: User | null;
  onLogin: () => void;
  isLoggingIn: boolean;
  connectedSheet: SpreadsheetInfo | null;
  onConnectExistingSheet: (idOrUrl: string) => Promise<boolean>;
  onCreateNewSheet: (title?: string) => Promise<boolean>;
  onDisconnectSheet: () => void;
  onRefreshFromSheet: () => void;
  isProcessing: boolean;
  rawSheetTitle: string;
  setRawSheetTitle: (title: string) => void;
}

export const SheetSettingsView: React.FC<SheetSettingsViewProps> = ({
  user,
  onLogin,
  isLoggingIn,
  connectedSheet,
  onConnectExistingSheet,
  onCreateNewSheet,
  onDisconnectSheet,
  onRefreshFromSheet,
  isProcessing,
  rawSheetTitle,
  setRawSheetTitle,
}) => {
  const [sheetInput, setSheetInput] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState(
    'Summertide Studio — Lyric Contest Scores & Rankings'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) {
      setErrorMessage('Please enter a Google Spreadsheet URL or ID.');
      return;
    }
    setErrorMessage(null);
    const ok = await onConnectExistingSheet(sheetInput.trim());
    if (ok) {
      setSheetInput('');
    } else {
      setErrorMessage('Could not load spreadsheet. Please check the URL and permissions.');
    }
  };

  const handleCreate = async () => {
    setErrorMessage(null);
    const ok = await onCreateNewSheet(newSheetTitle.trim());
    if (!ok) {
      setErrorMessage('Failed to create new spreadsheet in your Google Drive.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#426b63] mb-1">
          Google Workspace Integration
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Google Sheets Sync & Configuration
        </h2>
        <p className="text-sm text-stone-600 mt-1 max-w-2xl">
          Connect your Google Sheet so judges' submissions flow into a central spreadsheet, and
          final rankings are calculated and saved automatically without manual spreadsheets formulas.
        </p>
      </div>

      {/* Google Authentication Check */}
      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-800 shrink-0">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">
                Google Account Sign-In Required
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed max-w-xl">
                To connect or create spreadsheets in your Google Drive, sign in with your Google
                account. Permission is granted solely to read and record contest scores in your
                sheets.
              </p>
            </div>
          </div>

          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-2xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
      )}

      {/* Connected Sheet Card */}
      {connectedSheet ? (
        <div className="bg-white rounded-3xl border border-emerald-300 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-800 shrink-0">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active Connection
                  </span>
                  <span className="text-xs text-stone-400">ID: {connectedSheet.id.slice(0, 12)}...</span>
                </div>
                <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                  {connectedSheet.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Connected to your Google Drive account. Scores and rankings are synchronized with this sheet.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={connectedSheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors"
              >
                <span>Open in Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onDisconnectSheet}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-500 hover:text-rose-700 text-xs font-semibold transition-colors"
                title="Disconnect this spreadsheet"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          </div>

          {/* Sheet Details & Tab Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="font-bold text-stone-800 uppercase tracking-wide">
                Detected Sheet Tabs ({connectedSheet.sheets.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {connectedSheet.sheets.map((s) => (
                  <span
                    key={s.id}
                    className="bg-white border border-stone-200 px-2.5 py-1 rounded-lg text-stone-700 font-medium"
                  >
                    📄 {s.title}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="font-bold text-stone-800 uppercase tracking-wide">
                Scores Tab Target
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={rawSheetTitle}
                  onChange={(e) => setRawSheetTitle(e.target.value)}
                  placeholder="Raw Scores"
                  className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-stone-900 font-medium text-xs flex-1"
                />
                <button
                  onClick={onRefreshFromSheet}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-[#0284c7] text-white rounded-lg font-bold hover:bg-[#0369a1] transition-colors shrink-0"
                >
                  Sync Now
                </button>
              </div>
              <p className="text-[11px] text-stone-400">
                The tab where judge score entries are read from and added to.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Not Connected State: Choice to Create or Connect */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: 1-Click Create New Sheet */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 font-bold" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Create New Summertide Contest Sheet
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Automatically provisions a new spreadsheet in your Google Drive with ready-to-use
                tabs for <strong>Raw Scores</strong> and <strong>Final Rankings</strong> with all
                formatting.
              </p>

              <div className="mt-4">
                <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Spreadsheet Title
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Summertide Studio — Lyric Contest"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs font-medium focus:ring-2 focus:ring-[#0284c7] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={isProcessing || !user}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Creating Sheet...' : 'Create Contest Sheet in Drive'}</span>
            </button>
          </div>

          {/* Card 2: Connect Existing Sheet */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mb-3">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Connect an Existing Google Sheet
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                Already have a Google Sheet with judge scores? Paste the link or Sheet ID to
                import existing scorecards and compute rankings.
              </p>

              <form onSubmit={handleConnect} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Google Sheets URL or ID
                  </label>
                  <input
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs..."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-xs font-medium focus:ring-2 focus:ring-[#426b63] focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !user}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{isProcessing ? 'Connecting...' : 'Connect Existing Sheet'}</span>
                </button>
              </form>
            </div>

            <div className="text-[11px] text-stone-400">
              Columns supported: Timestamp, Judge, Entrant / Song, Writing, Originality, Emotion,
              Structure, Total, Comments.
            </div>
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* How It Works Diagram / Explanation */}
      <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-4">
        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
          How Google Sheets Sync & Ranking Works
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-sky-50 text-[#0284c7] font-black flex items-center justify-center text-xs">
              1
            </div>
            <div className="font-bold text-stone-900">Judges Submit Scorecards</div>
            <div className="text-stone-500 text-[11px] leading-relaxed">
              Judges evaluate songs using the 4 criteria sliders (Writing, Originality, Emotion,
              Structure). Scores are appended as new rows into your Google Sheet.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-sky-50 text-[#0284c7] font-black flex items-center justify-center text-xs">
              2
            </div>
            <div className="font-bold text-stone-900">Automatic Ranking Engine</div>
            <div className="text-stone-500 text-[11px] leading-relaxed">
              The application aggregates scores by entrant, computes criterion averages, determines
              spread, and ranks songs with official tie-breakers in real time.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-sky-50 text-[#0284c7] font-black flex items-center justify-center text-xs">
              3
            </div>
            <div className="font-bold text-stone-900">Write Back to Spreadsheet</div>
            <div className="text-stone-500 text-[11px] leading-relaxed">
              With 1 click, write the calculated Leaderboard directly into the "Final Rankings" tab in
              Google Sheets so producers and entrants can view the official results.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
