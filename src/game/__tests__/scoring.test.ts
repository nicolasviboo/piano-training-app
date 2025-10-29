import { describe, it, expect } from 'vitest';
import {
  calculateScoreForCorrect,
  calculateAccuracy,
  updateAvgResponseTime,
  calculateNotesPerMinute,
  formatTime,
} from '../scoring';

describe('Scoring', () => {
  describe('calculateScoreForCorrect', () => {
    it('should award base points for correct note', () => {
      const result = calculateScoreForCorrect(0, 0);
      expect(result.score).toBe(10);
      expect(result.streak).toBe(1);
      expect(result.streakBonus).toBe(0);
    });

    it('should increment streak', () => {
      const result = calculateScoreForCorrect(10, 1);
      expect(result.streak).toBe(2);
    });

    it('should award streak bonus at milestone', () => {
      const result = calculateScoreForCorrect(40, 4); // 5th correct note
      expect(result.streak).toBe(5);
      expect(result.streakBonus).toBe(5);
      expect(result.score).toBe(55); // 40 + 10 + 5
    });

    it('should award streak bonus at multiple milestones', () => {
      const result1 = calculateScoreForCorrect(90, 9); // 10th correct
      expect(result1.streakBonus).toBe(5);
      expect(result1.score).toBe(105); // 90 + 10 + 5

      const result2 = calculateScoreForCorrect(140, 14); // 15th correct
      expect(result2.streakBonus).toBe(5);
      expect(result2.score).toBe(155); // 140 + 10 + 5
    });
  });

  describe('calculateAccuracy', () => {
    it('should return 100% with zero attempts', () => {
      expect(calculateAccuracy(0, 0)).toBe(100);
    });

    it('should calculate correct percentage', () => {
      expect(calculateAccuracy(8, 10)).toBe(80);
      expect(calculateAccuracy(5, 10)).toBe(50);
      expect(calculateAccuracy(1, 3)).toBe(33);
    });

    it('should handle perfect accuracy', () => {
      expect(calculateAccuracy(10, 10)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculateAccuracy(2, 3)).toBe(67); // 66.666... rounds to 67
    });
  });

  describe('updateAvgResponseTime', () => {
    it('should return the first time for first correct note', () => {
      expect(updateAvgResponseTime(0, 500, 1)).toBe(500);
    });

    it('should calculate exponential moving average', () => {
      const result = updateAvgResponseTime(1000, 500, 2);
      // 1000 * 0.7 + 500 * 0.3 = 700 + 150 = 850
      expect(result).toBe(850);
    });

    it('should weight recent performance higher', () => {
      let avg = 1000;
      // Simulate consistently faster times
      for (let i = 2; i <= 10; i++) {
        avg = updateAvgResponseTime(avg, 400, i);
      }
      // Average should move toward 400
      expect(avg).toBeLessThan(1000);
      expect(avg).toBeGreaterThan(400);
    });
  });

  describe('calculateNotesPerMinute', () => {
    it('should return 0 for zero average time', () => {
      expect(calculateNotesPerMinute(0)).toBe(0);
    });

    it('should calculate correct notes per minute', () => {
      // 1000ms = 1 second = 60 notes per minute
      expect(calculateNotesPerMinute(1000)).toBe(60);
      
      // 500ms = 0.5 seconds = 120 notes per minute
      expect(calculateNotesPerMinute(500)).toBe(120);
      
      // 2000ms = 2 seconds = 30 notes per minute
      expect(calculateNotesPerMinute(2000)).toBe(30);
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(59)).toBe('00:59');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(90)).toBe('01:30');
      expect(formatTime(125)).toBe('02:05');
    });

    it('should pad single digits with zero', () => {
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(65)).toBe('01:05');
    });
  });
});

