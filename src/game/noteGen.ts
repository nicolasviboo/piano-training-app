// Note sequence generation based on difficulty and clef settings

import {
  GameSettings,
  NoteSpec,
  DIFFICULTY_CONFIGS,
  ClefChoice,
  DifficultyConfig,
} from './types';
import {
  getRandomNaturalMidi,
  isNatural,
  midiToPitch,
  pitchToVexKey,
  applyAccidental,
  suggestClef,
} from './mapping';

/**
 * Generate a sequence of notes based on game settings
 */
export function generateSequence(settings: GameSettings): NoteSpec[] {
  const config = DIFFICULTY_CONFIGS[settings.difficulty];
  const sequence: NoteSpec[] = [];

  for (let i = 0; i < settings.sequenceLength; i++) {
    const note = generateNote(settings, config);
    sequence.push(note);
  }

  return sequence;
}

/**
 * Generate a single note based on settings
 */
function generateNote(
  settings: GameSettings,
  config: DifficultyConfig
): NoteSpec {
  const { minMidi, maxMidi, allowNaturalsOnly, accidentalProbability, doubleAccidentalProbability } = config;

  let midi: number;
  let pitch: string;
  let accidental: '#' | 'b' | '##' | 'bb' | 'n' | undefined;

  // Generate base note
  if (allowNaturalsOnly) {
    midi = getRandomNaturalMidi(minMidi, maxMidi);
    pitch = midiToPitch(midi);
    accidental = undefined;
  } else {
    // Decide if this note should have an accidental
    const shouldHaveAccidental = Math.random() < accidentalProbability;
    
    if (!shouldHaveAccidental) {
      // Natural note
      midi = getRandomNaturalMidi(minMidi, maxMidi);
      pitch = midiToPitch(midi);
      accidental = undefined;
    } else {
      // Note with accidental
      const shouldBeDouble =
        settings.allowDoubleAccidentals &&
        Math.random() < doubleAccidentalProbability / accidentalProbability;

      // Start with a natural note
      const baseMidi = getRandomNaturalMidi(minMidi, maxMidi);
      
      // Choose accidental type
      const accidentalTypes: Array<'#' | 'b' | '##' | 'bb'> = shouldBeDouble
        ? ['##', 'bb']
        : ['#', 'b'];
      const chosenAccidental = accidentalTypes[Math.floor(Math.random() * accidentalTypes.length)];

      const result = applyAccidental(baseMidi, chosenAccidental);
      
      // Make sure the resulting MIDI is in range
      if (result.midi < minMidi || result.midi > maxMidi) {
        // Fall back to natural
        midi = baseMidi;
        pitch = midiToPitch(midi);
        accidental = undefined;
      } else {
        midi = result.midi;
        pitch = result.pitch;
        accidental = chosenAccidental;
      }
    }
  }

  // Determine clef
  const clef = determineClef(settings.clef, midi);

  // Generate VexFlow key
  const vexKey = pitchToVexKey(pitch);

  return {
    midi,
    pitch,
    vexKey,
    clef,
    accidental,
  };
}

/**
 * Determine which clef to use for a note
 */
function determineClef(clefChoice: ClefChoice, midi: number): 'treble' | 'bass' {
  if (clefChoice === 'treble') return 'treble';
  if (clefChoice === 'bass') return 'bass';
  
  // For 'both', use suggested clef based on pitch
  return suggestClef(midi);
}

/**
 * Regenerate the sequence (for endless mode)
 */
export function regenerateSequence(settings: GameSettings): NoteSpec[] {
  return generateSequence(settings);
}

/**
 * Validate that a sequence meets the difficulty requirements
 * (useful for testing)
 */
export function validateSequence(
  sequence: NoteSpec[],
  settings: GameSettings
): boolean {
  const config = DIFFICULTY_CONFIGS[settings.difficulty];

  for (const note of sequence) {
    // Check MIDI range
    if (note.midi < config.minMidi || note.midi > config.maxMidi) {
      return false;
    }

    // Check naturals-only constraint
    if (config.allowNaturalsOnly && !isNatural(note.midi)) {
      return false;
    }

    // Check clef constraint
    if (settings.clef !== 'both' && note.clef !== settings.clef) {
      return false;
    }

    // Check double accidentals constraint
    if (!settings.allowDoubleAccidentals && (note.accidental === '##' || note.accidental === 'bb')) {
      return false;
    }
  }

  return true;
}

