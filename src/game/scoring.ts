// Scoring and metrics calculations

export interface ScoreUpdate {
  score: number;
  streak: number;
  streakBonus: number;
}

const BASE_POINTS = 10;
const STREAK_MILESTONE = 5;
const STREAK_BONUS_POINTS = 5;

/**
 * Calculate score update for a correct note
 */
export function calculateScoreForCorrect(currentScore: number, currentStreak: number): ScoreUpdate {
  const newStreak = currentStreak + 1;
  
  // Award bonus every STREAK_MILESTONE notes
  const streakBonus = newStreak % STREAK_MILESTONE === 0 ? STREAK_BONUS_POINTS : 0;
  
  const newScore = currentScore + BASE_POINTS + streakBonus;

  return {
    score: newScore,
    streak: newStreak,
    streakBonus,
  };
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correct: number, attempts: number): number {
  if (attempts === 0) return 100;
  return Math.round((correct / attempts) * 100);
}

/**
 * Update rolling average for response time
 * Uses exponential moving average for better UX (recent performance weighted higher)
 */
export function updateAvgResponseTime(
  currentAvg: number,
  newTime: number,
  totalCorrect: number
): number {
  if (totalCorrect === 1) {
    // First correct note, use actual time
    return newTime;
  }

  // Exponential moving average (70% old, 30% new)
  return Math.round(currentAvg * 0.7 + newTime * 0.3);
}

/**
 * Calculate notes per minute based on average response time
 */
export function calculateNotesPerMinute(avgMsPerNote: number): number {
  if (avgMsPerNote === 0) return 0;
  const notesPerSecond = 1000 / avgMsPerNote;
  return Math.round(notesPerSecond * 60);
}

/**
 * Calculate game duration in seconds
 */
export function calculateDuration(startedAt: number, now: number): number {
  return Math.round((now - startedAt) / 1000);
}

/**
 * Format time in mm:ss format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate final score with time bonus
 */
export function calculateFinalScore(
  baseScore: number,
  durationSeconds: number,
  correct: number
): number {
  // Bonus for speed: +1 point per second under 5 seconds average per note
  const avgSecondsPerNote = durationSeconds / Math.max(1, correct);
  const speedBonus = Math.max(0, Math.floor((5 - avgSecondsPerNote) * correct));
  
  return baseScore + speedBonus;
}

