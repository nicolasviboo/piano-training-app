// Core types for the piano note trainer game

export type ClefChoice = 'treble' | 'bass' | 'both';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GameSettings {
  difficulty: Difficulty;
  clef: ClefChoice;
  lives: number; // default 3
  sequenceLength: number; // derived from difficulty but user-adjustable
  allowDoubleAccidentals: boolean; // only meaningful on advanced
  enableFallbackPiano: boolean;
}

export interface NoteSpec {
  midi: number; // 21..108
  pitch: string; // e.g., "C#4"
  vexKey: string; // e.g., "C#/4" for VexFlow
  clef: 'treble' | 'bass';
  accidental?: '#' | 'b' | '##' | 'bb' | 'n';
}

export interface GameSnapshot {
  sequence: NoteSpec[]; // full generated sequence
  currentIndex: number; // which note is expected now
  score: number;
  streak: number;
  attempts: number; // total attempts
  correct: number; // total correct
  lives: number;
  avgMsPerNote: number; // rolling average
  startedAt: number; // ms
  expectingNoteSince: number; // ms timestamp for current note timing
  isPaused: boolean;
  isGameOver: boolean;
  lastWasCorrect: boolean | null; // for visual feedback
  flashError: boolean; // trigger red flash animation
}

export interface DifficultyConfig {
  minMidi: number;
  maxMidi: number;
  allowNaturalsOnly: boolean;
  accidentalProbability: number;
  doubleAccidentalProbability: number;
  maxLedgerLines: number;
  defaultSequenceLength: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    minMidi: 48, // C3
    maxMidi: 72, // C5
    allowNaturalsOnly: true,
    accidentalProbability: 0,
    doubleAccidentalProbability: 0,
    maxLedgerLines: 1,
    defaultSequenceLength: 5,
  },
  intermediate: {
    minMidi: 45, // A2
    maxMidi: 76, // E5
    allowNaturalsOnly: false,
    accidentalProbability: 0.3,
    doubleAccidentalProbability: 0,
    maxLedgerLines: 2,
    defaultSequenceLength: 8,
  },
  advanced: {
    minMidi: 41, // F2
    maxMidi: 79, // G5
    allowNaturalsOnly: false,
    accidentalProbability: 0.5,
    doubleAccidentalProbability: 0.05,
    maxLedgerLines: 3,
    defaultSequenceLength: 12,
  },
};

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'beginner',
  clef: 'treble',
  lives: 3,
  sequenceLength: 5,
  allowDoubleAccidentals: false,
  enableFallbackPiano: false,
};

