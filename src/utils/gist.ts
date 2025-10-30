// GitHub Gist API utilities for leaderboard storage

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  accuracy: number;
  streak: number;
  correctNotes: number;
  difficulty: string;
  mode: string;
  date: string;
}

const GIST_ID = import.meta.env.VITE_GIST_ID || '';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const GIST_FILENAME = 'piano-training-leaderboard.json';

/**
 * Fetch the current leaderboard from GitHub Gist
 * Uses authenticated requests for higher rate limit (5,000/hour vs 60/hour)
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    if (!GIST_ID) {
      console.warn('No Gist ID configured');
      return [];
    }

    // Build headers - include auth token if available for higher rate limit
    const headers: HeadersInit = {};
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    const gist = await response.json();
    const fileContent = gist.files[GIST_FILENAME]?.content;

    if (!fileContent) {
      return [];
    }

    const data = JSON.parse(fileContent);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Update the leaderboard with a new entry
 * Returns true if the score made it to top 10 for that mode
 */
export async function submitScore(entry: LeaderboardEntry): Promise<boolean> {
  try {
    if (!GIST_ID || !GITHUB_TOKEN) {
      console.warn('Gist not configured. Score saved locally only.');
      return false;
    }

    // Fetch current leaderboard
    const currentLeaderboard = await fetchLeaderboard();

    // Add new entry
    const updatedLeaderboard = [...currentLeaderboard, entry];

    // Separate by mode
    const readingScores = updatedLeaderboard.filter(e => e.mode === 'reading');
    const hearingScores = updatedLeaderboard.filter(e => e.mode === 'hearing');

    // Sort each mode by score (descending), then by accuracy (descending)
    const sortScores = (scores: LeaderboardEntry[]) => {
      return scores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.accuracy - a.accuracy;
      });
    };

    sortScores(readingScores);
    sortScores(hearingScores);

    // Keep top 10 for each mode
    const top10Reading = readingScores.slice(0, 10);
    const top10Hearing = hearingScores.slice(0, 10);

    // Combine both top 10 lists
    const combinedTop10 = [...top10Reading, ...top10Hearing];

    // Check if the new entry made it to top 10 for its mode
    const relevantTop10 = entry.mode === 'reading' ? top10Reading : top10Hearing;
    const madeTopTen = relevantTop10.some(
      (e) => e.playerName === entry.playerName && 
             e.date === entry.date &&
             e.score === entry.score
    );

    if (!madeTopTen) {
      return false;
    }

    // Update the gist with combined leaderboard
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(combinedTop10, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update leaderboard: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
  }
}

/**
 * Check if a score would make it to the top 10 for a specific mode
 */
export async function wouldMakeTopTen(score: number, mode: 'reading' | 'hearing' = 'reading'): Promise<boolean> {
  try {
    const leaderboard = await fetchLeaderboard();
    
    // Filter by mode
    const modeLeaderboard = leaderboard.filter(e => e.mode === mode);
    
    if (modeLeaderboard.length < 10) {
      return true;
    }

    // Sort by score
    modeLeaderboard.sort((a, b) => b.score - a.score);
    
    const tenthScore = modeLeaderboard[9]?.score || 0;
    return score > tenthScore;
  } catch (error) {
    console.error('Error checking leaderboard:', error);
    return false;
  }
}

/**
 * Get the player's rank on the leaderboard (1-10, or null if not ranked)
 */
export function getPlayerRank(leaderboard: LeaderboardEntry[], entry: LeaderboardEntry): number | null {
  const index = leaderboard.findIndex(
    (e) => e.playerName === entry.playerName && 
           e.date === entry.date &&
           e.score === entry.score
  );
  
  return index >= 0 ? index + 1 : null;
}

