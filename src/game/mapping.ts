// MIDI number to pitch name mapping and VexFlow key conversion

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Natural notes only (for beginner mode)
const NATURAL_NOTES = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

/**
 * Convert MIDI number to pitch name (e.g., 60 -> "C4")
 */
export function midiToPitch(midi: number, preferFlat = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const noteName = preferFlat ? NOTE_NAMES_FLAT[noteIndex] : NOTE_NAMES[noteIndex];
  return `${noteName}${octave}`;
}

/**
 * Convert pitch name to MIDI number (e.g., "C4" -> 60)
 */
export function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G])(#{1,2}|b{1,2})?(-?\d+)$/);
  if (!match) throw new Error(`Invalid pitch: ${pitch}`);

  const [, note, accidental = '', octave] = match;
  const baseIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(note);
  const baseOffsets = [0, 2, 4, 5, 7, 9, 11];
  let midiNote = baseOffsets[baseIndex];

  // Apply accidentals
  if (accidental === '#') midiNote += 1;
  else if (accidental === '##') midiNote += 2;
  else if (accidental === 'b') midiNote -= 1;
  else if (accidental === 'bb') midiNote -= 2;

  return (parseInt(octave) + 1) * 12 + midiNote;
}

/**
 * Convert pitch to VexFlow key format
 * VexFlow uses format like "C#/4" for treble, "C#/3" for bass
 */
export function pitchToVexKey(pitch: string, clef: 'treble' | 'bass'): string {
  const match = pitch.match(/^([A-G])(#{1,2}|b{1,2}|n)?(-?\d+)$/);
  if (!match) throw new Error(`Invalid pitch: ${pitch}`);

  const [, note, accidental = '', octave] = match;
  
  // VexFlow format: "C#/4" or "Db/4"
  return `${note}${accidental}/${octave}`;
}

/**
 * Get accidental symbol from pitch
 */
export function getAccidental(pitch: string): '#' | 'b' | '##' | 'bb' | 'n' | undefined {
  const match = pitch.match(/^[A-G](#{1,2}|b{1,2}|n)?-?\d+$/);
  if (!match) return undefined;
  const accidental = match[1];
  if (!accidental) return undefined;
  return accidental as '#' | 'b' | '##' | 'bb' | 'n';
}

/**
 * Check if a MIDI note is a natural (white key)
 */
export function isNatural(midi: number): boolean {
  const noteIndex = midi % 12;
  return NATURAL_NOTES.includes(noteIndex);
}

/**
 * Get a random natural MIDI note within a range
 */
export function getRandomNaturalMidi(minMidi: number, maxMidi: number): number {
  const naturals: number[] = [];
  for (let midi = minMidi; midi <= maxMidi; midi++) {
    if (isNatural(midi)) {
      naturals.push(midi);
    }
  }
  return naturals[Math.floor(Math.random() * naturals.length)];
}

/**
 * Get a random MIDI note (including accidentals) within a range
 */
export function getRandomMidi(minMidi: number, maxMidi: number): number {
  return Math.floor(Math.random() * (maxMidi - minMidi + 1)) + minMidi;
}

/**
 * Apply accidental to a natural note
 */
export function applyAccidental(
  midi: number,
  accidentalType: '#' | 'b' | '##' | 'bb'
): { midi: number; pitch: string } {
  let newMidi = midi;
  if (accidentalType === '#') newMidi += 1;
  else if (accidentalType === '##') newMidi += 2;
  else if (accidentalType === 'b') newMidi -= 1;
  else if (accidentalType === 'bb') newMidi -= 2;

  // Get the base note name without accidental
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  const baseNote = NOTE_NAMES[noteIndex].replace('#', '');
  
  return {
    midi: newMidi,
    pitch: `${baseNote}${accidentalType}${octave}`,
  };
}

/**
 * Determine appropriate clef for a MIDI note
 * Middle C (60) and above typically use treble clef
 */
export function suggestClef(midi: number): 'treble' | 'bass' {
  return midi >= 60 ? 'treble' : 'bass';
}

/**
 * Normalize MIDI velocity (0-127) to 0-1 range
 */
export function normalizeVelocity(velocity: number): number {
  return Math.max(0, Math.min(1, velocity / 127));
}

