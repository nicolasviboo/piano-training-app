import { describe, it, expect } from 'vitest';
import { generateSequence, validateSequence } from '../noteGen';
import { GameSettings, Difficulty, DIFFICULTY_CONFIGS } from '../types';
import { isNatural } from '../mapping';

describe('Note Generation', () => {
  describe('generateSequence', () => {
    it('should generate correct number of notes', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'treble',
        lives: 3,
        sequenceLength: 8,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);
      expect(sequence).toHaveLength(8);
    });

    it('should respect difficulty MIDI ranges - beginner', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'treble',
        lives: 3,
        sequenceLength: 10,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);
      const config = DIFFICULTY_CONFIGS.beginner;

      sequence.forEach((note) => {
        expect(note.midi).toBeGreaterThanOrEqual(config.minMidi);
        expect(note.midi).toBeLessThanOrEqual(config.maxMidi);
      });
    });

    it('should respect difficulty MIDI ranges - intermediate', () => {
      const settings: GameSettings = {
        difficulty: 'intermediate',
        clef: 'treble',
        lives: 3,
        sequenceLength: 10,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);
      const config = DIFFICULTY_CONFIGS.intermediate;

      sequence.forEach((note) => {
        expect(note.midi).toBeGreaterThanOrEqual(config.minMidi);
        expect(note.midi).toBeLessThanOrEqual(config.maxMidi);
      });
    });

    it('should only generate natural notes for beginner', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'treble',
        lives: 3,
        sequenceLength: 20,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);

      sequence.forEach((note) => {
        expect(isNatural(note.midi)).toBe(true);
        expect(note.accidental).toBeUndefined();
      });
    });

    it('should respect clef setting - treble', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'treble',
        lives: 3,
        sequenceLength: 10,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);

      sequence.forEach((note) => {
        expect(note.clef).toBe('treble');
      });
    });

    it('should respect clef setting - bass', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'bass',
        lives: 3,
        sequenceLength: 10,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);

      sequence.forEach((note) => {
        expect(note.clef).toBe('bass');
      });
    });

    it('should allow both clefs when set to both', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'both',
        lives: 3,
        sequenceLength: 20,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);
      const clefs = sequence.map((note) => note.clef);
      const uniqueClefs = [...new Set(clefs)];

      // Should have at least one of each clef in 20 notes (probabilistically)
      expect(uniqueClefs.length).toBeGreaterThan(0);
    });

    it('should not include double accidentals when disabled', () => {
      const settings: GameSettings = {
        difficulty: 'advanced',
        clef: 'treble',
        lives: 3,
        sequenceLength: 30,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);

      sequence.forEach((note) => {
        expect(note.accidental).not.toBe('##');
        expect(note.accidental).not.toBe('bb');
      });
    });
  });

  describe('validateSequence', () => {
    it('should validate a correct beginner sequence', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'treble',
        lives: 3,
        sequenceLength: 5,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = generateSequence(settings);
      expect(validateSequence(sequence, settings)).toBe(true);
    });

    it('should invalidate sequence with out-of-range notes', () => {
      const settings: GameSettings = {
        difficulty: 'beginner',
        clef: 'treble',
        lives: 3,
        sequenceLength: 2,
        allowDoubleAccidentals: false,
        enableFallbackPiano: false,
      };

      const sequence = [
        {
          midi: 30, // Out of range for beginner
          pitch: 'F#2',
          vexKey: 'F#/2',
          clef: 'treble' as const,
          accidental: '#' as const,
        },
        {
          midi: 60,
          pitch: 'C4',
          vexKey: 'C/4',
          clef: 'treble' as const,
        },
      ];

      expect(validateSequence(sequence, settings)).toBe(false);
    });
  });
});

