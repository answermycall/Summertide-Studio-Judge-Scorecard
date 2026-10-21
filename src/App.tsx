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
  SAMPLE_CONTEST_SCORES,
} from './utils/ranking';
import { Navbar } from './components/Navbar';
import { LeaderboardView } from './components/LeaderboardView';
import { ScorecardView } from './components/ScorecardView';
import { AllScoresMatrix } from './components/AllScoresMatrix';
import { SheetSettingsView } from './components/SheetSettingsView';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'rankings' | 'scores' | 'scorecard' | 'sheet'>(
    'rankings'
  );

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Google Sheets Connection State
  const [connectedSheet, setConnectedSheet] = useState<SpreadsheetInfo | null>(null);
  const [rawSheetTitle, setRawSheetTitle] = useState('Raw Scores');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingRankings, setIsSyncingRankings] = useState(false);

  // Contest Scores & Pre-populated Data
  const [scores, setScores] = useState<JudgeScoreSubmission[]>(SAMPLE_CONTEST_SCORES);
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
    // Trigger sign in if token is missing
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

      // Try reading raw scores tab
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
    // If a Google Sheet is connected, append the row to Google Sheets
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

    // Update local state to immediately update leaderboard rankings
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

  // Write Final Rankings to Google Sheet (With Workspace mandatory confirmation dialog)
  const handleSyncRankingsToSheetRequest = () => {
    if (!connectedSheet) {
      // If no sheet connected yet, switch to sheet tab
      setActiveTab('sheet');
      showToast('Connect or create a Google Sheet first to sync rankings.', 'info');
      return;
    }

    // Workspace guidelines require explicit user confirmation for mutating spreadsheet data
    setConfirmModal({
      isOpen: true,
      title: 'Write Final Rankings to Google Sheet?',
      message: `This will update the "Final Rankings" tab in spreadsheet "${connectedSheet.title}" with the current standings for ${rankings.length} entrants. Any prior ranking data in that tab will be replaced with fresh calculations.`,
      detailItems: [
        `Target Sheet: ${connectedSheet.title}`,
        `Destination Tab: Final Rankings`,
        `Entrants to rank: ${rankings.length} (${stats.totalSubmissions} judge scorecards)`,
        `Top ranked: ${rankings[0]?.entrantName || 'None'} (${rankings[0]?.averageScore.toFixed(2)} pts)`,
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

  // Seed sample data to connected sheet
  const handleSeedSampleDataToSheet = () => {
    if (!connectedSheet) return;

    setConfirmModal({
      isOpen: true,
      title: 'Populate Google Sheet with Contest Sample Data?',
      message: `This will write 11 sample scorecards across 5 diverse songs into your Google Sheet's "${rawSheetTitle}" tab and automatically compute and save the Final Rankings tab.`,
      detailItems: [
        '5 sample lyric submissions (Golden Hour Glow, Saltwater & Cedar, etc.)',
        '3 judges (Elena Rostova, Marcus Sterling, Sarah Chen)',
        'Full 4-criteria rubrics, tiers, and comments',
      ],
      confirmLabel: 'Push Sample Data',
      isDestructive: false,
      action: async () => {
        const currentToken = await ensureToken();
        if (!currentToken) return;

        setIsSyncing(true);
        try {
          // Append sample rows sequentially
          for (const s of SAMPLE_CONTEST_SCORES) {
            await appendScoreToSheet(currentToken, connectedSheet.id, rawSheetTitle, s);
          }
          // Compute & write final rankings
          const sampleRankings = calculateRankings(SAMPLE_CONTEST_SCORES);
          await writeRankingsToSheet(
            currentToken,
            connectedSheet.id,
            'Final Rankings',
            sampleRankings
          );

          setScores(SAMPLE_CONTEST_SCORES);
          showToast('Sample scores & calculated rankings pushed to Google Sheet!', 'success');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to seed sample data';
          console.error('Seed error:', err);
          showToast(msg, 'error');
        } finally {
          setIsSyncing(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleOpenScorecardForEntrant = (name: string) => {
    setScorecardEntrantPreFill(name);
    setActiveTab('scorecard');
  };

  const handleLoadLocalSampleData = () => {
    setScores(SAMPLE_CONTEST_SCORES);
    showToast('Loaded sample contest scorecards into session.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#20242d] font-sans antialiased flex flex-col selection:bg-[#9ec6b9] selection:text-[#20242d]">
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'rankings' && (
          <LeaderboardView
            rankings={rankings}
            stats={stats}
            connectedSheet={connectedSheet}
            onSyncRankingsToSheet={handleSyncRankingsToSheetRequest}
            isSyncingRankings={isSyncingRankings}
            onRefreshFromSheet={handleRefreshFromSheet}
            isRefreshing={isSyncing}
            onOpenScorecardForEntrant={handleOpenScorecardForEntrant}
            onLoadSampleData={handleLoadLocalSampleData}
          />
        )}

        {activeTab === 'scores' && (
          <AllScoresMatrix
            scores={scores}
            onOpenScorecardForEntrant={handleOpenScorecardForEntrant}
            onLoadSampleData={handleLoadLocalSampleData}
          />
        )}

        {activeTab === 'scorecard' && (
          <ScorecardView
            initialEntrantName={scorecardEntrantPreFill}
            connectedSheet={connectedSheet}
            onSubmitScore={handleSubmitScore}
            isSubmitting={isSyncing}
            knownJudges={knownJudges}
            knownEntrants={knownEntrants}
          />
        )}

        {activeTab === 'sheet' && (
          <SheetSettingsView
            user={user}
            onLogin={handleLogin}
            isLoggingIn={isLoggingIn}
            connectedSheet={connectedSheet}
            onConnectExistingSheet={handleConnectExistingSheet}
            onCreateNewSheet={handleCreateNewSheet}
            onDisconnectSheet={handleDisconnectSheet}
            onRefreshFromSheet={handleRefreshFromSheet}
            onSeedSampleDataToSheet={handleSeedSampleDataToSheet}
            isProcessing={isSyncing}
            rawSheetTitle={rawSheetTitle}
            setRawSheetTitle={setRawSheetTitle}
          />
        )}
      </main>

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
          <div>Summertide Studio Lyric Contest · Independent Producer Scoring Engine</div>
          <div className="text-stone-400">
            Four criteria · Maximum awardable total: 96/100 per judge · Google Sheets Live Sync
          </div>
        </div>
      </footer>
    </div>
  );
}
