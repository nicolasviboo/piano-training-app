// Vitest setup file
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web MIDI API for tests
global.navigator.requestMIDIAccess = async () => {
  return {
    inputs: new Map(),
    outputs: new Map(),
    sysexEnabled: false,
    onstatechange: null,
  } as any;
};

