// Leaderboard component displaying top 10 scores

import { useState, useEffect } from 'react';
import { LeaderboardEntry, fetchLeaderboard } from '../utils/gist';

interface LeaderboardProps {
  onClose?: () => void;
  highlightEntry?: LeaderboardEntry | null;
}

export default function Leaderboard({ onClose, highlightEntry }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reading' | 'hearing'>(
    (highlightEntry?.mode === 'hearing' ? 'hearing' : 'reading')
  );

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Switch to the tab of the highlighted entry when it changes
  useEffect(() => {
    if (highlightEntry?.mode === 'reading' || highlightEntry?.mode === 'hearing') {
      setActiveTab(highlightEntry.mode);
    }
  }, [highlightEntry]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter leaderboard by active tab
  const filteredLeaderboard = leaderboard.filter(entry => entry.mode === activeTab);
  
  // Get top 10 for the selected mode
  const top10 = filteredLeaderboard.slice(0, 10);

  const isHighlighted = (entry: LeaderboardEntry) => {
    if (!highlightEntry) return false;
    return (
      entry.playerName === highlightEntry.playerName &&
      entry.date === highlightEntry.date &&
      entry.score === highlightEntry.score
    );
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-bold text-gray-900">🏆 Leaderboard</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
            activeTab === 'reading'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-2xl mr-2">👀</span>
          Reading Challenge
        </button>
        <button
          onClick={() => setActiveTab('hearing')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
            activeTab === 'hearing'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-2xl mr-2">👂</span>
          Hearing Challenge
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="mt-2 text-red-600 hover:text-red-800 font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && top10.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {activeTab === 'reading' ? '👀' : '👂'}
          </div>
          <p className="text-xl text-gray-600">No scores yet for {activeTab} mode!</p>
          <p className="text-gray-500 mt-2">Be the first to make the leaderboard!</p>
        </div>
      )}

      {!loading && !error && top10.length > 0 && (
        <div className="space-y-2">
          {top10.map((entry, index) => (
            <div
              key={`${entry.playerName}-${entry.date}-${index}`}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                isHighlighted(entry)
                  ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400 shadow-lg scale-105'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Rank */}
              <div className="text-2xl font-bold w-12 text-center">
                {getMedalEmoji(index + 1)}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {entry.playerName}
                  </h3>
                  {isHighlighted(entry) && (
                    <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full font-semibold">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-xs mt-2 flex-wrap items-center">
                  <span className={`px-2 py-1 rounded-full font-semibold ${getDifficultyBadge(entry.difficulty)}`}>
                    {entry.difficulty}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{formatDate(entry.date)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center">
                <div className="min-w-[60px]">
                  <div className="text-2xl font-bold text-blue-600">{entry.score}</div>
                  <div className="text-xs text-gray-500 mt-1">Score</div>
                </div>
                <div className="min-w-[60px]">
                  <div className="text-2xl font-bold text-green-600">{entry.correctNotes}</div>
                  <div className="text-xs text-gray-500 mt-1">Notes</div>
                </div>
                <div className="min-w-[60px]">
                  <div className="text-2xl font-bold text-purple-600">{entry.avgResponseTime}ms</div>
                  <div className="text-xs text-gray-500 mt-1">Avg Response</div>
                </div>
                <div className="min-w-[60px]">
                  <div className="text-2xl font-bold text-orange-600">{entry.streak}</div>
                  <div className="text-xs text-gray-500 mt-1">Streak</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && top10.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Top 10 scores for {activeTab} mode • Updated in real-time</p>
        </div>
      )}
    </div>
  );
}

