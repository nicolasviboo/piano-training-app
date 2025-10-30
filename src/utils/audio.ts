// Audio utilities for playing note sounds

let audioContext: AudioContext | null = null;

/**
 * Initialize the audio context (call once on user interaction)
 */
export function initAudio(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Get the audio context
 */
export function getAudioContext(): AudioContext | null {
  return audioContext;
}

/**
 * Convert MIDI note number to frequency in Hz
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Play a note with the given MIDI number
 * @param midiNote - MIDI note number (21-108)
 * @param duration - Duration in seconds (default: 1.0)
 * @param volume - Volume (0.0 to 1.0, default: 0.3)
 */
export function playNote(
  midiNote: number,
  duration: number = 1.0,
  volume: number = 0.3
): void {
  const context = initAudio();
  
  const frequency = midiToFrequency(midiNote);
  const now = context.currentTime;

  // Create oscillator for the main tone
  const oscillator = context.createOscillator();
  oscillator.type = 'sine'; // Piano-like sound
  oscillator.frequency.setValueAtTime(frequency, now);

  // Create gain node for volume control and envelope
  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0, now);
  
  // ADSR envelope for more natural piano sound
  // Attack
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
  // Decay
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.1);
  // Sustain (no change, held at decay level)
  // Release
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  // Start and stop
  oscillator.start(now);
  oscillator.stop(now + duration);
}

/**
 * Play a sequence of notes with delays between them
 * @param midiNotes - Array of MIDI note numbers
 * @param delayBetweenNotes - Delay between notes in seconds (default: 0.5)
 * @param noteDuration - Duration of each note in seconds (default: 0.8)
 */
export function playSequence(
  midiNotes: number[],
  delayBetweenNotes: number = 0.5,
  noteDuration: number = 0.8
): void {
  midiNotes.forEach((note, index) => {
    setTimeout(() => {
      playNote(note, noteDuration);
    }, index * delayBetweenNotes * 1000);
  });
}

/**
 * Check if audio is supported
 */
export function isAudioSupported(): boolean {
  return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
}

