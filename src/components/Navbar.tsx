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
  Shield,
  Lock,
  Unlock,
} from 'lucide-react';
import { SpreadsheetInfo } from '../services/sheets';

interface NavbarProps {
  activeTab: 'rankings' | 'scores' | 'scorecard' | 'sheet' | 'admin';
  setActiveTab: (tab: 'rankings' | 'scores' | 'scorecard' | 'sheet' | 'admin') => void;
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  connectedSheet: SpreadsheetInfo | null;
  onRefreshFromSheet: () => void;
  isSyncing: boolean;
  hasUnsavedLocalScores: boolean;
  isAdmin: boolean;
  onRequestAdminUnlock: () => void;
  onLockAdmin: () => void;
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
  isAdmin,
  onRequestAdminUnlock,
  onLockAdmin,
}) => {
  const logoUrl = `${import.meta.env.BASE_URL}assets/aistudio/hibiscus-flower-vector-logo_fbb8b643.png`;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Studio Brand & Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100/80 border border-pink-200/90 flex items-center justify-center p-1 shadow-xs overflow-hidden shrink-0">
              <div
                className="w-8 h-8 bg-gradient-to-tr from-[#ec4899] via-[#f43f5e] to-[#fb7185] transition-transform hover:scale-105"
                style={{
                  maskImage: `url(${logoUrl})`,
                  WebkitMaskImage: `url(${logoUrl})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
                  Summertide Studio
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-pink-100 text-pink-900 border border-pink-200'
                  }`}
                >
                  {isAdmin ? 'Producer / Admin Panel' : 'Judge Portal (Blind)'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-none mt-0.5">
                Lyric Contest Judging Portal
              </h1>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Lock / Unlock Toggle */}
            {isAdmin ? (
              <button
                onClick={onLockAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-all shadow-2xs"
                title="Lock Producer view and switch back to Judge mode"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="text-[10px] text-amber-700 underline ml-0.5">Lock</span>
              </button>
            ) : (
              <button
                onClick={onRequestAdminUnlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all shadow-2xs"
                title="Enter Producer PIN to view leaderboard, all scores, and manage entries"
              >
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Producer Access</span>
              </button>
            )}

            {connectedSheet && isAdmin && (
              <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-1.5 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium text-emerald-900 truncate max-w-[130px]">
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
                  <div className="text-xs font-semibold text-stone-900 truncate max-w-[110px]">
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
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all hover:shadow-sm disabled:opacity-60 cursor-pointer"
                aria-label="Sign in with Google"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
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
                <span className="hidden sm:inline">
                  {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
                </span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 -mb-px">
          {/* Scorecard is always accessible to both judges and admin */}
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 ${
              activeTab === 'scorecard'
                ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs hover:bg-[#1d4ed8]'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Judge Scorecard</span>
            {hasUnsavedLocalScores && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Producer / Admin Protected Tabs */}
          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('rankings')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 ${
                  activeTab === 'rankings'
                    ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs hover:bg-[#1d4ed8]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Final Rankings & Podium</span>
              </button>

              <button
                onClick={() => setActiveTab('scores')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 ${
                  activeTab === 'scores'
                    ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs hover:bg-[#1d4ed8]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>All Judges' Scores</span>
              </button>

              <button
                onClick={() => setActiveTab('sheet')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 ${
                  activeTab === 'sheet'
                    ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs hover:bg-[#1d4ed8]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Sheet Sync</span>
                {connectedSheet && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                    Connected
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all border shrink-0 ${
                  activeTab === 'admin'
                    ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs hover:bg-[#1d4ed8]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border-transparent'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin Control</span>
              </button>
            </>
          ) : (
            <div className="flex items-center text-xs text-stone-400 pl-2">
              <span className="italic">
                (Blind Judging Mode active · Leaderboard hidden from judges)
              </span>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
