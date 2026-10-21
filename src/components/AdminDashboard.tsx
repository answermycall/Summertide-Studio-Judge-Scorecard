import React, { useState } from 'react';
import {
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Shield,
  Music,
  Users,
  FileSpreadsheet,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { JudgeScoreSubmission, EntrantRanking } from '../types/contest';
import { SpreadsheetInfo } from '../services/sheets';

interface AdminDashboardProps {
  scores: JudgeScoreSubmission[];
  rankings: EntrantRanking[];
  connectedSheet: SpreadsheetInfo | null;
  onDeleteScore: (scoreId: string) => void;
  onDeleteEntrant: (entrantName: string) => void;
  onRenameEntrant: (oldName: string, newName: string) => void;
  onSyncRankingsToSheet: () => void;
  isSyncingRankings: boolean;
  adminPin: string;
  onUpdateAdminPin: (newPin: string) => void;
  onSwitchToJudgeMode: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  scores,
  rankings,
  connectedSheet,
  onDeleteScore,
  onDeleteEntrant,
  onRenameEntrant,
  onSyncRankingsToSheet,
  isSyncingRankings,
  adminPin,
  onUpdateAdminPin,
  onSwitchToJudgeMode,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'scores' | 'entrants' | 'settings'>('scores');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJudge, setSelectedJudge] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Rename modal state
  const [renamingTarget, setRenamingTarget] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // PIN settings state
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Distinct judges
  const judges = Array.from(new Set(scores.map((s) => s.judgeName))).filter(Boolean);

  const filteredScores = scores.filter((s) => {
    const matchesSearch =
      s.entrantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.judgeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.comments && s.comments.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesJudge = selectedJudge === 'all' || s.judgeName === selectedJudge;
    return matchesSearch && matchesJudge;
  });

  const filteredRankings = rankings.filter((r) =>
    r.entrantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyJudgeLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'judge');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStartRename = (currentName: string) => {
    setRenamingTarget(currentName);
    setNewTitle(currentName);
  };

  const handleConfirmRename = () => {
    if (renamingTarget && newTitle.trim() && newTitle.trim() !== renamingTarget) {
      onRenameEntrant(renamingTarget, newTitle.trim());
      setRenamingTarget(null);
      setNewTitle('');
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length >= 4) {
      onUpdateAdminPin(newPinInput.trim());
      setNewPinInput('');
      setPinChangeSuccess(true);
      setTimeout(() => setPinChangeSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-[#202b31] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9ec6b9] bg-stone-800/80 px-3 py-1 rounded-full mb-2">
            <Shield className="w-3.5 h-3.5" />
            Lead Producer & Contest Administration
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Contest Control Center
          </h2>
          <p className="text-sm text-stone-300 mt-1 max-w-xl">
            Manage submitted judge scorecards, fix song titles, remove invalid entries, and
            distribute blind judge links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyJudgeLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 shadow-xs transition-all cursor-pointer"
            title="Copy blind link to share with judges"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Share Judge-Only Link</span>
              </>
            )}
          </button>

          <button
            onClick={onSwitchToJudgeMode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9ec6b9] hover:bg-[#86b5a7] text-stone-900 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>Preview Judge View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
            <Music className="w-4 h-4 text-[#426b63]" />
            Registered Songs
          </div>
          <div className="text-3xl font-black text-stone-900 mt-1">{rankings.length}</div>
          <div className="text-xs text-stone-500 mt-1">Unique entries in the contest</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#426b63]" />
            Active Judges
          </div>
          <div className="text-3xl font-black text-stone-900 mt-1">{judges.length}</div>
          <div className="text-xs text-stone-500 mt-1">{scores.length} total scorecards awarded</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Google Sheet Status
          </div>
          <div className="text-base sm:text-lg font-bold text-stone-900 mt-1 truncate">
            {connectedSheet ? connectedSheet.title : 'Not Connected'}
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {connectedSheet ? 'Live Sync Active' : 'Scores saved in local app session'}
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex border-b border-stone-200 space-x-4">
        <button
          onClick={() => setActiveAdminTab('scores')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeAdminTab === 'scores'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          All Recorded Scores ({scores.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('entrants')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeAdminTab === 'entrants'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Song Roster & Rename ({rankings.length})
        </button>
        <button
          onClick={() => setActiveAdminTab('settings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeAdminTab === 'settings'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Admin Security & Share Links
        </button>
      </div>

      {/* Tab 1: Scores Management */}
      {activeAdminTab === 'scores' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden space-y-4">
          {/* Filter Bar */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scorecards by song, judge, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#426b63]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">Filter Judge:</span>
              <select
                value={selectedJudge}
                onChange={(e) => setSelectedJudge(e.target.value)}
                className="bg-white border border-stone-300 text-stone-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#426b63]"
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

          {filteredScores.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm">
              No scorecards match the current filter or search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 pl-4 sm:pl-6 pr-3">Judge / Producer</th>
                    <th className="py-3 px-3">Entrant / Song Title</th>
                    <th className="py-3 px-2 text-center">Writing</th>
                    <th className="py-3 px-2 text-center">Orig</th>
                    <th className="py-3 px-2 text-center">Emotion</th>
                    <th className="py-3 px-2 text-center">Struct</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3">Comments</th>
                    <th className="py-3 pr-4 sm:pr-6 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredScores.map((score, idx) => (
                    <tr key={score.id || idx} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 pl-4 sm:pl-6 pr-3 font-bold text-stone-900 whitespace-nowrap">
                        {score.judgeName}
                        <div className="text-[10px] text-stone-400 font-normal">{score.timestamp}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-800">{score.entrantName}</td>
                      <td className="py-3 px-2 text-center font-bold text-stone-700">{score.writing}</td>
                      <td className="py-3 px-2 text-center font-bold text-stone-700">{score.originality}</td>
                      <td className="py-3 px-2 text-center font-bold text-stone-700">{score.emotion}</td>
                      <td className="py-3 px-2 text-center font-bold text-stone-700">{score.structure}</td>
                      <td className="py-3 px-3 text-right font-black text-stone-900 tabular-nums">
                        {score.totalScore}
                        <span className="text-[10px] text-stone-400 font-normal"> / 96</span>
                      </td>
                      <td className="py-3 px-3 text-stone-500 italic text-xs max-w-xs truncate">
                        {score.comments ? `“${score.comments}”` : '—'}
                      </td>
                      <td className="py-3 pr-4 sm:pr-6 pl-2 text-right">
                        <button
                          onClick={() => onDeleteScore(score.id || `idx-${idx}`)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="Delete this judge's score"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Entrants Management & Rename */}
      {activeAdminTab === 'entrants' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <h3 className="font-bold text-stone-800 text-sm">Contest Song Roster</h3>
            <span className="text-xs text-stone-500">
              Rename songs to fix typos across all scorecards or delete an entire entry.
            </span>
          </div>

          {filteredRankings.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-sm">
              No contest songs have been entered yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredRankings.map((entrant) => (
                <div
                  key={entrant.entrantName}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded-md">
                        Rank #{entrant.rank}
                      </span>
                      <h4 className="font-bold text-stone-900 text-base">{entrant.entrantName}</h4>
                    </div>
                    <div className="text-xs text-stone-500 mt-1 flex items-center gap-3">
                      <span>{entrant.judgeCount} {entrant.judgeCount === 1 ? 'judge scored' : 'judges scored'}</span>
                      <span>•</span>
                      <span>Average: <strong>{entrant.averageScore.toFixed(2)}</strong> / 96</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartRename(entrant.entrantName)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Rename</span>
                    </button>

                    <button
                      onClick={() => onDeleteEntrant(entrant.entrantName)}
                      className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-rose-600 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Delete this entrant and all associated judge scores"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entry</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security & Link Settings */}
      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Share Links */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Shareable Judge Link
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Send this link to your judges/producers. When they open it, they will only see the
              independent scorecard with automatic song suggestions. The full leaderboard and other
              judges' scores are hidden.
            </p>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs font-mono text-stone-700 break-all">
              <span>{window.location.origin + window.location.pathname}?role=judge</span>
              <button
                onClick={handleCopyJudgeLink}
                className="shrink-0 p-2 bg-white rounded-lg border border-stone-300 hover:bg-stone-100 transition-colors"
                title="Copy link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Change PIN */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Producer / Admin PIN
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              The PIN required to unlock this Admin Dashboard when switching from Judge mode. Current
              PIN is <strong>{adminPin}</strong>.
            </p>

            <form onSubmit={handleSavePin} className="flex items-center gap-2">
              <input
                type="password"
                maxLength={8}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="New 4-8 digit PIN"
                className="px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 font-mono w-44 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={newPinInput.trim().length < 4}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                Update PIN
              </button>
            </form>

            {pinChangeSuccess && (
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Admin PIN successfully updated!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 text-stone-900">
            <h3 className="text-base font-bold text-stone-900">Rename Contest Entry</h3>
            <p className="text-xs text-stone-500 mt-1">
              Updating this title will automatically update all previous judges' scorecards linked to
              this song.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Song Title / Entrant
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                autoFocus
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] shadow-xs cursor-pointer"
              >
                Save New Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
