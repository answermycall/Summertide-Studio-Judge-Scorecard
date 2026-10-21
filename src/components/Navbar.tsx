import React from 'react';
import { User } from 'firebase/auth';
import {
  Trophy,
  Sliders,
  Table,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheets';

interface NavbarProps {
  activeTab: 'rankings' | 'scores' | 'scorecard' | 'sheet';
  setActiveTab: (tab: 'rankings' | 'scores' | 'scorecard' | 'sheet') => void;
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  connectedSheet: SpreadsheetInfo | null;
  onRefreshFromSheet: () => void;
  isSyncing: boolean;
  hasUnsavedLocalScores: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  connectedSheet,
  onRefreshFromSheet,
  isSyncing,
  hasUnsavedLocalScores,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Studio Brand & Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2e514a] to-[#426b63] flex items-center justify-center text-white shadow-sm font-black text-lg">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#426b63]">
                  Summertide Studio
                </span>
                <span className="text-[10px] bg-[#eaf2ef] text-[#2e514a] font-bold px-2 py-0.5 rounded-full">
                  Lyric Contest Panel
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-none mt-0.5">
                Judge Scorecards & Final Rankings
              </h1>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {connectedSheet && (
              <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-1.5 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium text-emerald-900 truncate max-w-[140px]">
                  {connectedSheet.title}
                </span>
                <button
                  onClick={onRefreshFromSheet}
                  disabled={isSyncing}
                  title="Reload scores from Google Sheet"
                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
                <a
                  href={connectedSheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors"
                  title="Open in Google Sheets"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-stone-300"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#426b63] text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'J')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-stone-900 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Google Connected
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all hover:shadow-sm disabled:opacity-60 cursor-pointer"
                aria-label="Sign in with Google"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
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
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 -mb-px">
          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border ${
              activeTab === 'rankings'
                ? 'bg-[#2e514a] text-white border-[#2e514a] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Final Rankings & Podium</span>
          </button>

          <button
            onClick={() => setActiveTab('scores')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border ${
              activeTab === 'scores'
                ? 'bg-[#2e514a] text-white border-[#2e514a] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>All Judges' Scores</span>
          </button>

          <button
            onClick={() => setActiveTab('scorecard')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border ${
              activeTab === 'scorecard'
                ? 'bg-[#2e514a] text-white border-[#2e514a] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Judge Scorecard</span>
            {hasUnsavedLocalScores && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border ${
              activeTab === 'sheet'
                ? 'bg-[#2e514a] text-white border-[#2e514a] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheet Sync</span>
            {connectedSheet ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                Connected
              </span>
            ) : (
              <span className="text-[10px] bg-stone-200 text-stone-600 font-bold px-1.5 py-0.2 rounded-full">
                Setup
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
