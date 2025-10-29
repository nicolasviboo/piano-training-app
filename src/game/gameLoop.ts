// Core game loop and state management

import { GameSettings, GameSnapshot, NoteSpec } from './types';
import { generateSequence, regenerateSequence } from './noteGen';
import {
  calculateScoreForCorrect,
  calculateAccuracy,
  updateAvgResponseTime,
} from './scoring';
import { getCurrentTime } from '../utils/time';

/**
 * Initialize a new game
 */
export function startGame(settings: GameSettings): GameSnapshot {
  const sequence = generateSequence(settings);
  const now = getCurrentTime();

  return {
    sequence,
    currentIndex: 0,
    score: 0,
    streak: 0,
    attempts: 0,
    correct: 0,
    lives: settings.lives,
    avgMsPerNote: 0,
    startedAt: now,
    expectingNoteSince: now,
    isPaused: false,
    isGameOver: false,
    lastWasCorrect: null,
    flashError: false,
  };
}

/**
 * Handle MIDI input during gameplay
 */
export function handleInput(
  snapshot: GameSnapshot,
  midiNote: number,
  settings: GameSettings
): GameSnapshot {
  if (snapshot.isPaused || snapshot.isGameOver) {
    return snapshot;
  }

  const expectedNote = snapshot.sequence[snapshot.currentIndex];
  const now = getCurrentTime();
  const isCorrect = midiNote === expectedNote.midi;

  // Increment attempts
  const newSnapshot = { ...snapshot, attempts: snapshot.attempts + 1 };

  if (isCorrect) {
    return handleCorrectInput(newSnapshot, now, settings);
  } else {
    return handleIncorrectInput(newSnapshot, settings);
  }
}

/**
 * Handle correct note input
 */
function handleCorrectInput(
  snapshot: GameSnapshot,
  now: number,
  settings: GameSettings
): GameSnapshot {
  // Calculate response time for this note
  const responseTime = now - snapshot.expectingNoteSince;

  // Update score and streak
  const scoreUpdate = calculateScoreForCorrect(snapshot.score, snapshot.streak);

  // Update metrics
  const newCorrect = snapshot.correct + 1;
  const newAvgMs = updateAvgResponseTime(snapshot.avgMsPerNote, responseTime, newCorrect);

  // Move to next note
  const newIndex = snapshot.currentIndex + 1;

  // Check if sequence is complete
  if (newIndex >= snapshot.sequence.length) {
    // Generate new sequence (endless mode)
    const newSequence = regenerateSequence(settings);
    return {
      ...snapshot,
      sequence: newSequence,
      currentIndex: 0,
      score: scoreUpdate.score,
      streak: scoreUpdate.streak,
      correct: newCorrect,
      avgMsPerNote: newAvgMs,
      expectingNoteSince: now,
      lastWasCorrect: true,
      flashError: false,
    };
  }

  return {
    ...snapshot,
    currentIndex: newIndex,
    score: scoreUpdate.score,
    streak: scoreUpdate.streak,
    correct: newCorrect,
    avgMsPerNote: newAvgMs,
    expectingNoteSince: now,
    lastWasCorrect: true,
    flashError: false,
  };
}

/**
 * Handle incorrect note input
 */
function handleIncorrectInput(
  snapshot: GameSnapshot,
  settings: GameSettings
): GameSnapshot {
  const newLives = snapshot.lives - 1;
  const isGameOver = newLives <= 0;

  if (isGameOver) {
    return {
      ...snapshot,
      lives: 0,
      streak: 0,
      isGameOver: true,
      lastWasCorrect: false,
      flashError: true,
    };
  }

  // Reset sequence to beginning, generate new sequence
  const newSequence = regenerateSequence(settings);
  const now = getCurrentTime();

  return {
    ...snapshot,
    sequence: newSequence,
    currentIndex: 0, // Reset to beginning
    lives: newLives,
    streak: 0, // Reset streak
    expectingNoteSince: now,
    lastWasCorrect: false,
    flashError: true,
  };
}

/**
 * Pause the game
 */
export function pauseGame(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    isPaused: true,
  };
}

/**
 * Resume the game
 */
export function resumeGame(snapshot: GameSnapshot): GameSnapshot {
  const now = getCurrentTime();
  return {
    ...snapshot,
    isPaused: false,
    expectingNoteSince: now, // Reset timer for current note
  };
}

/**
 * Reset flash error state (called after animation completes)
 */
export function clearFlashError(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    flashError: false,
  };
}

/**
 * Get accuracy percentage
 */
export function getAccuracy(snapshot: GameSnapshot): number {
  return calculateAccuracy(snapshot.correct, snapshot.attempts);
}

/**
 * Check if game is active
 */
export function isGameActive(snapshot: GameSnapshot): boolean {
  return !snapshot.isPaused && !snapshot.isGameOver;
}

