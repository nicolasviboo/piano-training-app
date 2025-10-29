// LocalStorage helpers for persisting settings and high score

import { GameSettings, DEFAULT_SETTINGS } from '../game/types';

const SETTINGS_KEY = 'pnt_settings_v1';
const HIGH_SCORE_KEY = 'pnt_highscore_v1';

export interface HighScoreEntry {
  score: number;
  accuracy: number;
  streak: number;
  date: string;
  difficulty: string;
}

/**
 * Save game settings to localStorage
 */
export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
}

/**
 * Load game settings from localStorage
 */
export function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored);
    // Validate and merge with defaults to handle schema changes
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.warn('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save high score to localStorage
 */
export function saveHighScore(entry: HighScoreEntry): void {
  try {
    const current = getHighScore();
    if (!current || entry.score > current.score) {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(entry));
    }
  } catch (error) {
    console.warn('Failed to save high score:', error);
  }
}

/**
 * Get high score from localStorage
 */
export function getHighScore(): HighScoreEntry | null {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (!stored) return null;

    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to load high score:', error);
    return null;
  }
}

/**
 * Clear all stored data
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(HIGH_SCORE_KEY);
  } catch (error) {
    console.warn('Failed to clear data:', error);
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

