/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  SpreadsheetInfo,
  parseSpreadsheetId,
  fetchSpreadsheetMetadata,
  readScoresFromSheet,
  appendScoreToSheet,
  createContestSpreadsheet,
  writeRankingsToSheet,
} from './services/sheets';
import {
  JudgeScoreSubmission,
  EntrantRanking,
} from './types/contest';
import {
  calculateRankings,
  computeSummaryStats,
} from './utils/ranking';
import { Navbar } from './components/Navbar';
import { LeaderboardView } from './components/LeaderboardView';
import { ScorecardView } from './components/ScorecardView';
import { AllScoresMatrix } from './components/AllScoresMatrix';
import { SheetSettingsView } from './components/SheetSettingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, AlertCircle, X, Lock, KeyRound } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'rankings' | 'scores' | 'scorecard' | 'sheet' | 'admin'>(
    'scorecard'
  );

  // Producer / Admin State (Blind Judging by default if shared with judges)
  const [isAdmin, setIsAdmin] = useState(true);
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem('summertide_admin_pin') || '1234';
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Google Sheets Connection State
  const [connectedSheet, setConnectedSheet] = useState<SpreadsheetInfo | null>(null);
  const [rawSheetTitle, setRawSheetTitle] = useState('Raw Scores');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingRankings, setIsSyncingRankings] = useState(false);

  // Contest Scores (starts fresh with no fake/placeholder entries)
  const [scores, setScores] = useState<JudgeScoreSubmission[]>([]);
  const [scorecardEntrantPreFill, setScorecardEntrantPreFill] = useState('');

  // Toast Notification
  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Confirmation Modals (for Workspace destructive/mutation operations)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detailItems?: string[];
    confirmLabel?: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: Date.now(), type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Check URL query parameters for ?role=judge
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'judge') {
      setIsAdmin(false);
      setActiveTab('scorecard');
    } else {
      const savedAuth = sessionStorage.getItem('summertide_admin_unlocked');
      if (savedAuth === 'false') {
        setIsAdmin(false);
        setActiveTab('scorecard');
      } else {
        setIsAdmin(true);
        setActiveTab('rankings');
      }
    }
  }, []);

  // Initialize Firebase Auth listener on app load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Calculate live rankings and statistics in real time whenever scores change
  const rankings = useMemo(() => calculateRankings(scores), [scores]);
  const stats = useMemo(() => computeSummaryStats(scores, rankings), [scores, rankings]);

  // Lists for autocomplete in scorecard
  const knownJudges = useMemo(() => {
    return Array.from(new Set(scores.map((s) => s.judgeName))).filter(Boolean);
  }, [scores]);

  const knownEntrants = useMemo(() => {
    return Array.from(new Set(scores.map((s) => s.entrantName))).filter(Boolean);
  }, [scores]);

  // Auth Handlers
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showToast(`Signed in as ${result.user.displayName || result.user.email}`);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      showToast('Could not sign in with Google. Please try again.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('Signed out of Google account', 'info');
  };

  const ensureToken = async (): Promise<string | null> => {
    if (token) return token;
    const cached = await getAccessToken();
    if (cached) {
      setToken(cached);
      return cached;
    }
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        return res.accessToken;
      }
    } catch (e) {
      console.error('Failed to get token:', e);
    }
    return null;
  };

  // Google Sheets: Connect Existing Sheet
  const handleConnectExistingSheet = async (idOrUrl: string): Promise<boolean> => {
    const id = parseSpreadsheetId(idOrUrl);
    if (!id) {
      showToast('Invalid Google Sheet URL or ID format.', 'error');
      return false;
    }

    const currentToken = await ensureToken();
    if (!currentToken) {
      showToast('Please sign in with Google first.', 'error');
      return false;
    }

    setIsSyncing(true);
    try {
      const meta = await fetchSpreadsheetMetadata(currentToken, id);
      setConnectedSheet(meta);

      const targetTab =
        meta.sheets.find((s) => s.title.toLowerCase().includes('score'))?.title ||
        meta.sheets[0]?.title ||
        'Raw Scores';
      setRawSheetTitle(targetTab);

      const sheetScores = await readScoresFromSheet(currentToken, id, targetTab);
      if (sheetScores.length > 0) {
        setScores(sheetScores);
        showToast(
          `Connected to "${meta.title}"! Loaded ${sheetScores.length} scorecards from sheet.`,
          'success'
        );
      } else {
        showToast(
          `Connected to "${meta.title}". No scores found yet in tab "${targetTab}".`,
          'info'
        );
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to spreadsheet';
      console.error('Sheet connection error:', err);
      showToast(msg, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets: Create New Contest Sheet
  const handleCreateNewSheet = async (title?: string): Promise<boolean> => {
    const currentToken = await ensureToken();
    if (!currentToken) {
      showToast('Please sign in with Google first.', 'error');
      return false;
    }

    setIsSyncing(true);
    try {
      const newSheet = await createContestSpreadsheet(currentToken, title);
      setConnectedSheet(newSheet);
      setRawSheetTitle('Raw Scores');
      showToast(`Created new contest sheet "${newSheet.title}" in your Google Drive!`, 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create sheet';
      console.error('Create sheet error:', err);
      showToast(msg, 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets: Disconnect
  const handleDisconnectSheet = () => {
    setConnectedSheet(null);
    showToast('Spreadsheet disconnected.', 'info');
  };

  // Google Sheets: Refresh Scores
  const handleRefreshFromSheet = async () => {
    if (!connectedSheet) {
      showToast('No Google Sheet currently connected.', 'info');
      return;
    }

    const currentToken = await ensureToken();
    if (!currentToken) {
      showToast('Please sign in with Google.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const freshScores = await readScoresFromSheet(
        currentToken,
        connectedSheet.id,
        rawSheetTitle
      );
      if (freshScores.length > 0) {
        setScores(freshScores);
        showToast(`Refreshed! Loaded ${freshScores.length} scorecards from Google Sheet.`, 'success');
      } else {
        showToast(
          `Sheet tab "${rawSheetTitle}" has no score entries yet.`,
          'info'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh scores from sheet';
      console.error('Refresh error:', err);
      showToast(msg, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit Scorecard
  const handleSubmitScore = async (submission: JudgeScoreSubmission): Promise<boolean> => {
    if (connectedSheet) {
      const currentToken = await ensureToken();
      if (currentToken) {
        try {
          await appendScoreToSheet(currentToken, connectedSheet.id, rawSheetTitle, submission);
        } catch (err) {
          console.error('Error appending score to sheet:', err);
          showToast('Failed to append row to Google Sheet, but saved locally.', 'error');
        }
      }
    }

    setScores((prev) => [
      {
        ...submission,
        id: `score-${Date.now()}`,
      },
      ...prev,
    ]);

    showToast(
      `Score recorded for "${submission.entrantName}"! Total: ${submission.totalScore}/96`,
      'success'
    );
    return true;
  };

  // Write Final Rankings to Google Sheet
  const handleSyncRankingsToSheetRequest = () => {
    if (!connectedSheet) {
      setActiveTab('sheet');
      showToast('Connect or create a Google Sheet first to sync rankings.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Write Final Rankings to Google Sheet?',
      message: `This will update the "Final Rankings" tab in spreadsheet "${connectedSheet.title}" with current standings for ${rankings.length} entrants.`,
      detailItems: [
        `Target Sheet: ${connectedSheet.title}`,
        `Destination Tab: Final Rankings`,
        `Entrants to rank: ${rankings.length} (${stats.totalSubmissions} scorecards)`,
      ],
      confirmLabel: 'Yes, Write Rankings to Sheet',
      isDestructive: false,
      action: async () => {
        const currentToken = await ensureToken();
        if (!currentToken) return;

        setIsSyncingRankings(true);
        try {
          await writeRankingsToSheet(currentToken, connectedSheet.id, 'Final Rankings', rankings);
          showToast(
            `Successfully wrote official rankings for ${rankings.length} entrants to Google Sheet!`,
            'success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to write rankings';
          console.error('Sync rankings error:', err);
          showToast(msg, 'error');
        } finally {
          setIsSyncingRankings(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Admin PIN Unlock
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === adminPin) {
      setIsAdmin(true);
      sessionStorage.setItem('summertide_admin_unlocked', 'true');
      setIsPinModalOpen(false);
      setEnteredPin('');
      setPinError(null);
      setActiveTab('admin');
      showToast('Producer Control Center unlocked.', 'success');
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    sessionStorage.setItem('summertide_admin_unlocked', 'false');
    setActiveTab('scorecard');
    showToast('Switched to Judge Mode (Blind). Leaderboard hidden from view.', 'info');
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('summertide_admin_pin', newPin);
    showToast('Producer PIN updated successfully!', 'success');
  };

  // Admin: Delete a single score
  const handleDeleteScore = (scoreId: string) => {
    const target = scores.find((s, idx) => (s.id || `idx-${idx}`) === scoreId);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Scorecard?',
      message: `Are you sure you want to delete the scorecard by ${target?.judgeName || 'this judge'} for "${target?.entrantName || 'this entry'}"? This action recalculates contest rankings.`,
      confirmLabel: 'Delete Scorecard',
      isDestructive: true,
      action: async () => {
        setScores((prev) => prev.filter((s, idx) => (s.id || `idx-${idx}`) !== scoreId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Scorecard removed and rankings updated.', 'info');
      },
    });
  };

  // Admin: Delete an entire entrant and all their scores
  const handleDeleteEntrant = (entrantName: string) => {
    const affected = scores.filter(
      (s) => s.entrantName.trim().toLowerCase() === entrantName.trim().toLowerCase()
    );
    setConfirmModal({
      isOpen: true,
      title: `Delete Entry "${entrantName}"?`,
      message: `This will remove "${entrantName}" from the contest and permanently delete all ${affected.length} judge scorecard(s) associated with it.`,
      confirmLabel: 'Delete Entry & All Scores',
      isDestructive: true,
      action: async () => {
        setScores((prev) =>
          prev.filter((s) => s.entrantName.trim().toLowerCase() !== entrantName.trim().toLowerCase())
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(`Removed "${entrantName}" and ${affected.length} scorecard(s).`, 'info');
      },
    });
  };

  // Admin: Rename an entrant across all historical scores
  const handleRenameEntrant = (oldName: string, newName: string) => {
    setScores((prev) =>
      prev.map((s) =>
        s.entrantName.trim().toLowerCase() === oldName.trim().toLowerCase()
          ? { ...s, entrantName: newName }
          : s
      )
    );
    showToast(`Renamed "${oldName}" to "${newName}" across all scorecards.`, 'success');
  };

  const handleOpenScorecardForEntrant = (name: string) => {
    setScorecardEntrantPreFill(name);
    setActiveTab('scorecard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#fff5f8] to-[#fce7f3] text-[#20242d] font-sans antialiased flex flex-col selection:bg-pink-200 selection:text-pink-900">
      {/* Navbar with Studio Header & Google Auth */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        connectedSheet={connectedSheet}
        onRefreshFromSheet={handleRefreshFromSheet}
        isSyncing={isSyncing}
        hasUnsavedLocalScores={!connectedSheet && scores.length > 0}
        isAdmin={isAdmin}
        onRequestAdminUnlock={() => {
          setPinError(null);
          setEnteredPin('');
          setIsPinModalOpen(true);
        }}
        onLockAdmin={handleLockAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scorecard' && (
          <ScorecardView
            initialEntrantName={scorecardEntrantPreFill}
            defaultJudgeName={user?.displayName || ''}
            connectedSheet={connectedSheet}
            onSubmitScore={handleSubmitScore}
            isSubmitting={isSyncing}
            knownJudges={knownJudges}
            knownEntrants={knownEntrants}
            existingScores={scores}
          />
        )}

        {isAdmin && activeTab === 'rankings' && (
          <LeaderboardView
            rankings={rankings}
            stats={stats}
            connectedSheet={connectedSheet}
            onSyncRankingsToSheet={handleSyncRankingsToSheetRequest}
            isSyncingRankings={isSyncingRankings}
            onRefreshFromSheet={handleRefreshFromSheet}
            isRefreshing={isSyncing}
            onOpenScorecardForEntrant={handleOpenScorecardForEntrant}
            onGoToScorecard={() => setActiveTab('scorecard')}
            onGoToSheet={() => setActiveTab('sheet')}
          />
        )}

        {isAdmin && activeTab === 'scores' && (
          <AllScoresMatrix
            scores={scores}
            onOpenScorecardForEntrant={handleOpenScorecardForEntrant}
            onGoToScorecard={() => setActiveTab('scorecard')}
          />
        )}

        {isAdmin && activeTab === 'sheet' && (
          <SheetSettingsView
            user={user}
            onLogin={handleLogin}
            isLoggingIn={isLoggingIn}
            connectedSheet={connectedSheet}
            onConnectExistingSheet={handleConnectExistingSheet}
            onCreateNewSheet={handleCreateNewSheet}
            onDisconnectSheet={handleDisconnectSheet}
            onRefreshFromSheet={handleRefreshFromSheet}
            isProcessing={isSyncing}
            rawSheetTitle={rawSheetTitle}
            setRawSheetTitle={setRawSheetTitle}
          />
        )}

        {isAdmin && activeTab === 'admin' && (
          <AdminDashboard
            scores={scores}
            rankings={rankings}
            connectedSheet={connectedSheet}
            onDeleteScore={handleDeleteScore}
            onDeleteEntrant={handleDeleteEntrant}
            onRenameEntrant={handleRenameEntrant}
            onSyncRankingsToSheet={handleSyncRankingsToSheetRequest}
            isSyncingRankings={isSyncingRankings}
            adminPin={adminPin}
            onUpdateAdminPin={handleUpdateAdminPin}
            onSwitchToJudgeMode={handleLockAdmin}
          />
        )}
      </main>

      {/* Admin Unlock PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-stone-900">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-stone-900">Producer Access</h3>
            <p className="text-xs text-stone-500 mt-1">
              Enter your Producer PIN to unlock the live leaderboard, all scores matrix, and
              administrative controls. (Default: <code>1234</code>)
            </p>

            <form onSubmit={handleUnlockAdmin} className="mt-4 space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={8}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full text-center text-xl tracking-widest font-mono py-2.5 px-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 text-center">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Google Sheets Mutating Operations */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        detailItems={confirmModal.detailItems}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        isLoading={isSyncingRankings || isSyncing}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-stone-900 text-white rounded-2xl shadow-xl border border-stone-700 animate-in slide-in-from-bottom-5 duration-200 text-xs sm:text-sm">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-stone-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Summertide Studio Lyric Contest · Producer & Judging System</div>
          <div className="text-stone-400">
            Four criteria · Maximum awardable: 96/100 · Google Sheets Live Sync
          </div>
        </div>
      </footer>
    </div>
  );
}
