import { describe, it, expect, beforeEach } from 'vitest';
import { startGame, handleInput, pauseGame, resumeGame, getAccuracy } from '../gameLoop';
import { GameSettings } from '../types';

describe('Game Loop', () => {
  let settings: GameSettings;

  beforeEach(() => {
    settings = {
      mode: 'reading',
      difficulty: 'beginner',
      clef: 'treble',
      lives: 3,
      sequenceLength: 5,
      allowDoubleAccidentals: false,
      enableFallbackPiano: false,
    };
  });

  describe('startGame', () => {
    it('should initialize game with correct defaults', () => {
      const snapshot = startGame(settings);

      expect(snapshot.sequence).toHaveLength(5);
      expect(snapshot.currentIndex).toBe(0);
      expect(snapshot.score).toBe(0);
      expect(snapshot.streak).toBe(0);
      expect(snapshot.attempts).toBe(0);
      expect(snapshot.correct).toBe(0);
      expect(snapshot.lives).toBe(3);
      expect(snapshot.isPaused).toBe(false);
      expect(snapshot.isGameOver).toBe(false);
    });

    it('should respect lives setting', () => {
      const snapshot = startGame({ ...settings, lives: 5 });
      expect(snapshot.lives).toBe(5);
    });
  });

  describe('handleInput - correct note', () => {
    it('should increment score on correct input', () => {
      let snapshot = startGame(settings);
      const expectedMidi = snapshot.sequence[0].midi;

      snapshot = handleInput(snapshot, expectedMidi, settings);

      expect(snapshot.score).toBe(10);
      expect(snapshot.correct).toBe(1);
      expect(snapshot.streak).toBe(1);
      expect(snapshot.attempts).toBe(1);
      expect(snapshot.currentIndex).toBe(1);
    });

    it('should advance to next note on correct input', () => {
      let snapshot = startGame(settings);
      const firstNote = snapshot.sequence[0].midi;

      snapshot = handleInput(snapshot, firstNote, settings);

      expect(snapshot.currentIndex).toBe(1);
    });

    it('should generate new sequence after completing current one', () => {
      let snapshot = startGame(settings);
      const originalSequence = [...snapshot.sequence];

      // Play all notes correctly
      for (let i = 0; i < 5; i++) {
        const expectedMidi = snapshot.sequence[snapshot.currentIndex].midi;
        snapshot = handleInput(snapshot, expectedMidi, settings);
      }

      // Should have new sequence
      expect(snapshot.currentIndex).toBe(0);
      expect(snapshot.sequence).toHaveLength(5);
      // Sequence should be different (probabilistically)
      const isDifferent = snapshot.sequence.some(
        (note, i) => note.midi !== originalSequence[i].midi
      );
      expect(isDifferent).toBe(true);
    });

    it('should maintain streak across sequences', () => {
      let snapshot = startGame(settings);

      // Play all notes correctly in first sequence
      for (let i = 0; i < 5; i++) {
        const expectedMidi = snapshot.sequence[snapshot.currentIndex].midi;
        snapshot = handleInput(snapshot, expectedMidi, settings);
      }

      expect(snapshot.streak).toBe(5);
      expect(snapshot.currentIndex).toBe(0); // New sequence started

      // Continue playing correctly
      const expectedMidi = snapshot.sequence[0].midi;
      snapshot = handleInput(snapshot, expectedMidi, settings);

      expect(snapshot.streak).toBe(6); // Streak continues
    });
  });

  describe('handleInput - incorrect note', () => {
    it('should decrement lives on incorrect input', () => {
      let snapshot = startGame(settings);
      const wrongMidi = (snapshot.sequence[0].midi + 1) % 128;

      snapshot = handleInput(snapshot, wrongMidi, settings);

      expect(snapshot.lives).toBe(2);
      expect(snapshot.streak).toBe(0);
      expect(snapshot.attempts).toBe(1);
      expect(snapshot.correct).toBe(0);
    });

    it('should reset sequence on incorrect input', () => {
      let snapshot = startGame(settings);
      const firstNote = snapshot.sequence[0].midi;

      // Play first note correctly
      snapshot = handleInput(snapshot, firstNote, settings);
      expect(snapshot.currentIndex).toBe(1);

      // Play wrong note
      const wrongMidi = (snapshot.sequence[1].midi + 1) % 128;
      snapshot = handleInput(snapshot, wrongMidi, settings);

      // Should reset to beginning with new sequence
      expect(snapshot.currentIndex).toBe(0);
      expect(snapshot.lives).toBe(2);
    });

    it('should trigger game over when lives reach zero', () => {
      let snapshot = startGame({ ...settings, lives: 1 });
      const wrongMidi = (snapshot.sequence[0].midi + 1) % 128;

      snapshot = handleInput(snapshot, wrongMidi, settings);

      expect(snapshot.lives).toBe(0);
      expect(snapshot.isGameOver).toBe(true);
    });

    it('should not process input when game is over', () => {
      let snapshot = startGame({ ...settings, lives: 1 });
      const wrongMidi = (snapshot.sequence[0].midi + 1) % 128;

      snapshot = handleInput(snapshot, wrongMidi, settings);
      expect(snapshot.isGameOver).toBe(true);

      const scoreBeforeInput = snapshot.score;
      const expectedMidi = snapshot.sequence[0].midi;
      snapshot = handleInput(snapshot, expectedMidi, settings);

      // Should not change anything
      expect(snapshot.score).toBe(scoreBeforeInput);
    });

    it('should set flashError on incorrect input', () => {
      let snapshot = startGame(settings);
      const wrongMidi = (snapshot.sequence[0].midi + 1) % 128;

      snapshot = handleInput(snapshot, wrongMidi, settings);

      expect(snapshot.flashError).toBe(true);
    });
  });

  describe('pauseGame and resumeGame', () => {
    it('should pause the game', () => {
      let snapshot = startGame(settings);
      snapshot = pauseGame(snapshot);

      expect(snapshot.isPaused).toBe(true);
    });

    it('should resume the game', () => {
      let snapshot = startGame(settings);
      snapshot = pauseGame(snapshot);
      snapshot = resumeGame(snapshot);

      expect(snapshot.isPaused).toBe(false);
    });

    it('should not process input when paused', () => {
      let snapshot = startGame(settings);
      snapshot = pauseGame(snapshot);

      const expectedMidi = snapshot.sequence[0].midi;
      const scoreBeforePause = snapshot.score;

      snapshot = handleInput(snapshot, expectedMidi, settings);

      expect(snapshot.score).toBe(scoreBeforePause);
    });
  });

  describe('getAccuracy', () => {
    it('should calculate accuracy correctly', () => {
      let snapshot = startGame(settings);
      
      // Play correctly
      const correct1 = snapshot.sequence[0].midi;
      snapshot = handleInput(snapshot, correct1, settings);
      
      // Play incorrectly
      const wrong = (snapshot.sequence[1].midi + 1) % 128;
      snapshot = handleInput(snapshot, wrong, settings);

      const accuracy = getAccuracy(snapshot);
      expect(accuracy).toBe(50); // 1 correct out of 2 attempts
    });
  });
});

