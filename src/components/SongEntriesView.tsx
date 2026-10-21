import React, { useState, useMemo } from 'react';
import {
  Music,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Upload,
  Plus,
  Trash2,
  FileText,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  User,
  MessageCircle,
  HelpCircle,
  Shield,
  Eye,
  BookOpen,
} from 'lucide-react';
import { ContestSongEntry, JudgeScoreSubmission } from '../types/contest';
import { parseLyricSubmission } from '../utils/lyricParser';

interface SongEntriesViewProps {
  songs: ContestSongEntry[];
  scores: JudgeScoreSubmission[];
  currentJudgeName: string;
  onChangeJudgeName: (name: string) => void;
  onSelectSongToGrade: (song: ContestSongEntry) => void;
  isAdmin: boolean;
  onAddSong?: (song: ContestSongEntry) => void;
  onDeleteSong?: (songId: string, songTitle: string) => void;
  onTriggerDuplicateModal: (song: ContestSongEntry, filename?: string) => void;
}

export const SongEntriesView: React.FC<SongEntriesViewProps> = ({
  songs,
  scores,
  currentJudgeName,
  onChangeJudgeName,
  onSelectSongToGrade,
  isAdmin,
  onAddSong,
  onDeleteSong,
  onTriggerDuplicateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'graded'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingLyricsSong, setViewingLyricsSong] = useState<ContestSongEntry | null>(null);

  // Manual Add Form State (Admin only)
  const [newTitle, setNewTitle] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newDiscord, setNewDiscord] = useState('');
  const [newStory, setNewStory] = useState('');
  const [newLyrics, setNewLyrics] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Identify scores submitted by the current judge
  const judgeScoresMap = useMemo(() => {
    const map = new Map<string, JudgeScoreSubmission>();
    if (!currentJudgeName.trim()) return map;

    const lowerJudge = currentJudgeName.trim().toLowerCase();
    for (const s of scores) {
      if (s.judgeName.trim().toLowerCase() === lowerJudge) {
        // Map by song title and entrant name
        if (s.songTitle) map.set(s.songTitle.trim().toLowerCase(), s);
        if (s.entrantName) map.set(s.entrantName.trim().toLowerCase(), s);
      }
    }
    return map;
  }, [scores, currentJudgeName]);

  // Overall judge completion progress
  const totalSongs = songs.length;
  const gradedSongsCount = useMemo(() => {
    return songs.filter((song) => {
      const matchByTitle = judgeScoresMap.has(song.songTitle.trim().toLowerCase());
      const matchByEntrant = judgeScoresMap.has(song.formattedEntrantName.trim().toLowerCase());
      return matchByTitle || matchByEntrant;
    }).length;
  }, [songs, judgeScoresMap]);

  const percentComplete = totalSongs === 0 ? 0 : Math.round((gradedSongsCount / totalSongs) * 100);

  // Circular progress calculations (Radius = 42, Circumference ≈ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentComplete / 100) * circumference;

  // Filter songs based on search and status
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const isGraded =
        judgeScoresMap.has(song.songTitle.trim().toLowerCase()) ||
        judgeScoresMap.has(song.formattedEntrantName.trim().toLowerCase());

      if (filterMode === 'graded' && !isGraded) return false;
      if (filterMode === 'pending' && isGraded) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        song.songTitle.toLowerCase().includes(q) ||
        (song.alias && song.alias.toLowerCase().includes(q)) ||
        (song.discordUsername && song.discordUsername.toLowerCase().includes(q)) ||
        (song.storyConcept && song.storyConcept.toLowerCase().includes(q))
      );
    });
  }, [songs, judgeScoresMap, filterMode, searchQuery]);

  // Handle .txt Upload (admin can add, judge triggers duplicate check)
  const handleUploadTxt = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const parsed = parseLyricSubmission(content);
      const titleToCheck = (parsed.songTitle || file.name.replace(/\.[^/.]+$/, '')).trim();

      // Check if identical / duplicate exists
      const existing = songs.find(
        (s) =>
          s.songTitle.trim().toLowerCase() === titleToCheck.toLowerCase() ||
          s.formattedEntrantName.trim().toLowerCase() === parsed.formattedEntrantName.trim().toLowerCase()
      );

      if (existing) {
        onTriggerDuplicateModal(existing, file.name);
        return;
      }

      if (isAdmin && onAddSong) {
        const newEntry: ContestSongEntry = {
          id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          songTitle: titleToCheck,
          alias: parsed.alias,
          discordUsername: parsed.discordUsername,
          storyConcept: parsed.storyConcept,
          lyrics: parsed.lyrics,
          formattedEntrantName: parsed.formattedEntrantName || titleToCheck,
          addedAt: new Date().toISOString(),
          addedBy: 'Admin Upload',
        };
        onAddSong(newEntry);
      } else {
        alert(
          'Notice: Only the contest producer/admin can upload brand new songs. You can grade all available entries listed below!'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setManualError('Song Title is required.');
      return;
    }

    const titleToCheck = newTitle.trim();
    const existing = songs.find(
      (s) => s.songTitle.trim().toLowerCase() === titleToCheck.toLowerCase()
    );

    if (existing) {
      setManualError(`"${titleToCheck}" already exists in the contest.`);
      return;
    }

    if (onAddSong) {
      const newEntry: ContestSongEntry = {
        id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        songTitle: titleToCheck,
        alias: newAlias.trim() || undefined,
        discordUsername: newDiscord.trim() || undefined,
        storyConcept: newStory.trim() || undefined,
        lyrics: newLyrics.trim() || undefined,
        formattedEntrantName: newAlias.trim() ? `${titleToCheck} (${newAlias.trim()})` : titleToCheck,
        addedAt: new Date().toISOString(),
        addedBy: 'Admin Manual',
      };
      onAddSong(newEntry);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewAlias('');
      setNewDiscord('');
      setNewStory('');
      setNewLyrics('');
      setManualError(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Circular Progress Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-200/90 shadow-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-[#0284c7] border border-sky-200 mb-2">
            <Music className="w-3.5 h-3.5" />
            Contest Submissions & Judging Queue
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Contest Song Entries
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
            All registered participant songs are listed below. Click on any song to open the scorecard
            with its lyrics side-by-side. Track your progress with the live grading completion meter.
          </p>

          {/* Judge Name Input / Switcher */}
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
            <span className="font-bold text-stone-700">Judging As:</span>
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-3 py-1 rounded-xl shadow-2xs">
              <User className="w-3.5 h-3.5 text-[#0284c7]" />
              <input
                type="text"
                value={currentJudgeName}
                onChange={(e) => onChangeJudgeName(e.target.value)}
                placeholder="Enter your judge name"
                className="bg-transparent font-bold text-stone-900 text-xs focus:outline-hidden w-36 sm:w-44"
              />
            </div>
            <span className="text-[11px] text-stone-400">
              (Updates your grading progress meter)
            </span>
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-sky-50 via-white to-sky-100/60 p-4 sm:p-5 rounded-2xl border border-sky-200 shadow-sm shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-sky-100"
                strokeWidth="9"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-[#0284c7] transition-all duration-700 ease-out"
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight tabular-nums">
                {percentComplete}%
              </span>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Progress
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">
              Grading Status
            </div>
            <div className="text-base font-extrabold text-stone-900 mt-0.5">
              {gradedSongsCount} of {totalSongs} Graded
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {totalSongs === 0 ? (
                'No songs uploaded yet.'
              ) : gradedSongsCount === totalSongs ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 justify-center sm:justify-start">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All songs completed!
                </span>
              ) : (
                <span>
                  <strong>{totalSongs - gradedSongsCount}</strong> remaining to score
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Search, and Admin Actions */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by song title, artist alias, or discord..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50/60 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterMode === 'all'
                ? 'bg-[#0284c7] text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            All Songs ({totalSongs})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterMode === 'pending'
                ? 'bg-[#0284c7] text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Needs Grading ({totalSongs - gradedSongsCount})
          </button>
          <button
            onClick={() => setFilterMode('graded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterMode === 'graded'
                ? 'bg-[#0284c7] text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Graded by You ({gradedSongsCount})
          </button>
        </div>

        {/* Admin or Upload Action */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt Song</span>
                <input
                  type="file"
                  accept=".txt,.doc,.docx,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadTxt(file);
                  }}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            </>
          ) : (
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              <span>Upload Song .txt</span>
              <input
                type="file"
                accept=".txt,.doc,.docx,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadTxt(file);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Song Entries Grid / List */}
      {filteredSongs.length === 0 ? (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sky-200/90 p-12 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#0284c7] mx-auto flex items-center justify-center mb-4">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {searchQuery
              ? 'No matching songs found'
              : filterMode === 'pending'
              ? 'You have graded all contest songs!'
              : filterMode === 'graded'
              ? 'No songs scored yet under your judge name'
              : 'No contest songs registered yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
            {searchQuery
              ? `No entries match "${searchQuery}". Try a different search keyword.`
              : filterMode === 'pending'
              ? 'Awesome job! All registered entries have been scored by you.'
              : filterMode === 'graded'
              ? 'Select any song from "Needs Grading" to begin scoring.'
              : isAdmin
              ? 'Upload participant lyric .txt files or add new entries to populate the judging queue.'
              : 'The contest administrator has not uploaded any entries yet. Please check back shortly.'}
          </p>

          {isAdmin && songs.length === 0 && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Add First Contest Entry
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSongs.map((song) => {
            const judgeScore =
              judgeScoresMap.get(song.songTitle.trim().toLowerCase()) ||
              judgeScoresMap.get(song.formattedEntrantName.trim().toLowerCase());
            const isGraded = !!judgeScore;

            return (
              <div
                key={song.id}
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-sky-200/90 shadow-md hover:shadow-xl transition-all duration-200 p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Status Badge & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isGraded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Graded · {judgeScore.totalScore}/100</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Needs Grading</span>
                      </span>
                    )}

                    {isAdmin && onDeleteSong && (
                      <button
                        onClick={() => onDeleteSong(song.id, song.songTitle)}
                        title="Delete contest entry"
                        className="text-stone-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & Artist */}
                  <h4 className="text-lg font-bold text-stone-900 group-hover:text-[#0284c7] transition-colors line-clamp-1">
                    {song.songTitle}
                  </h4>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                    <span className="font-semibold text-stone-800">
                      {song.alias || 'Unknown Artist'}
                    </span>
                    {song.discordUsername && (
                      <span className="font-mono text-[11px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                        @{song.discordUsername}
                      </span>
                    )}
                  </div>

                  {/* Concept snippet */}
                  {song.storyConcept && (
                    <div className="mt-3 text-xs text-stone-600 bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 line-clamp-2 italic">
                      "{song.storyConcept}"
                    </div>
                  )}

                  {/* Score Breakdown if graded */}
                  {isGraded && (
                    <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Writing</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.writing}/24
                        </div>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Original</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.originality}/24
                        </div>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Emotion</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.emotion}/24
                        </div>
                      </div>
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                        <div className="text-stone-400">Structure</div>
                        <div className="font-extrabold text-stone-800 text-xs">
                          {judgeScore.structure}/24
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {song.lyrics ? (
                    <button
                      type="button"
                      onClick={() => setViewingLyricsSong(song)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Lyrics</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400">No lyrics attached</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectSongToGrade(song)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                      isGraded
                        ? 'bg-sky-50 text-[#0284c7] hover:bg-sky-100 border border-sky-200'
                        : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isGraded ? 'Review / Edit Score' : 'Grade Song'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Manual Add Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-sky-200 shadow-2xl p-6 text-stone-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Add Contest Song</h3>
                  <p className="text-xs text-stone-500">Only accessible to lead producer / admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {manualError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Song Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midnight Horizon"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Artist / Alias
                  </label>
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder="e.g. Luna Starlight"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={newDiscord}
                    onChange={(e) => setNewDiscord(e.target.value)}
                    placeholder="e.g. lunastarlight"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Optional Story / Concept
                </label>
                <textarea
                  rows={2}
                  value={newStory}
                  onChange={(e) => setNewStory(e.target.value)}
                  placeholder="Briefly describe the meaning or inspiration behind the lyrics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Lyrics
                </label>
                <textarea
                  rows={5}
                  value={newLyrics}
                  onChange={(e) => setNewLyrics(e.target.value)}
                  placeholder="[Verse 1] ... [Chorus] ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Contest Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lyrics Reading Modal */}
      {viewingLyricsSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-sky-200 shadow-2xl p-6 text-stone-900 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284c7]">
                  Contest Submission Lyrics
                </span>
                <h3 className="text-xl font-bold text-stone-900">{viewingLyricsSong.songTitle}</h3>
                <div className="text-xs text-stone-600 mt-0.5">
                  Artist: <span className="font-semibold">{viewingLyricsSong.alias || 'Unknown'}</span>
                  {viewingLyricsSong.discordUsername && (
                    <span className="ml-2 font-mono text-stone-500">
                      @{viewingLyricsSong.discordUsername}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingLyricsSong(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {viewingLyricsSong.storyConcept && (
              <div className="my-3 p-3 bg-sky-50/70 border border-sky-100 rounded-xl text-xs text-stone-700">
                <span className="font-bold text-[#0284c7]">Story / Concept:</span>{' '}
                {viewingLyricsSong.storyConcept}
              </div>
            )}

            <div className="flex-1 overflow-y-auto my-2 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <pre className="font-sans text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                {viewingLyricsSong.lyrics || 'No lyrics provided for this entry.'}
              </pre>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingLyricsSong(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = viewingLyricsSong;
                  setViewingLyricsSong(null);
                  onSelectSongToGrade(s);
                }}
                className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Score This Song</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
