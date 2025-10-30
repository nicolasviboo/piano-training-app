// On-screen clickable piano for fallback when no MIDI is available

import { midiToPitch } from '../game/mapping';
import { initAudio, playNote } from '../utils/audio';

interface PianoFallbackProps {
  onNoteClick: (midiNote: number) => void;
  startOctave?: number;
  octaveCount?: number;
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

export default function PianoFallback({
  onNoteClick,
  startOctave = 2,
  octaveCount = 4,
}: PianoFallbackProps) {
  const handleKeyClick = (midi: number, event: React.MouseEvent) => {
    // Prevent default behavior and scrolling
    event.preventDefault();
    event.stopPropagation();
    
    // Initialize audio context on first click (required by browsers)
    initAudio();
    
    // Play the note sound with a shorter duration for better feel
    playNote(midi, 0.5, 0.3);
    
    // Call the game's note handler
    onNoteClick(midi);
  };

  const renderOctave = (octave: number) => {
    const baseMidi = (octave + 1) * 12;

    return (
      <div key={octave} className="relative inline-flex">
        {/* White keys */}
        {WHITE_KEYS.map((offset) => {
          const midi = baseMidi + offset;
          const pitch = midiToPitch(midi);

          return (
            <button
              key={offset}
              onClick={(e) => handleKeyClick(midi, e)}
              className="relative w-8 h-24 bg-white border-2 border-gray-800 hover:bg-gray-100 active:bg-gray-300 transition-colors flex items-end justify-center pb-1 text-[10px] font-medium text-gray-600"
              title={pitch}
              type="button"
            >
              {pitch}
            </button>
          );
        })}

        {/* Black keys - positioned absolutely over white keys */}
        {BLACK_KEYS.map((offset, index) => {
          const midi = baseMidi + offset;
          const pitch = midiToPitch(midi);

          // Calculate position based on which black key this is
          // Black keys appear between: C-D, D-E, F-G, G-A, A-B
          // Positions: 1, 2, 4, 5, 6 (in terms of white key indices)
          const positions = [0.7, 1.7, 3.7, 4.7, 5.7];
          const leftPosition = positions[index];

          return (
            <button
              key={offset}
              onClick={(e) => handleKeyClick(midi, e)}
              className="absolute w-5 h-16 bg-gray-900 hover:bg-gray-700 active:bg-gray-600 transition-colors rounded-b border-2 border-gray-800 text-white text-[9px] font-medium flex items-end justify-center pb-0.5 z-10"
              style={{ left: `${leftPosition * 2}rem` }}
              title={pitch}
              type="button"
            >
              {pitch.replace(/\d/, '')}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-gray-200 to-gray-300 p-2 rounded-lg shadow-lg overflow-x-auto h-full max-h-full flex flex-col">
      <h3 className="text-xs font-semibold mb-1 text-gray-800 flex-shrink-0">On-Screen Piano</h3>
      <div className="flex justify-center flex-1 min-h-0">
        <div className="inline-flex bg-gray-800 p-2 rounded-lg shadow-inner h-fit">
          {Array.from({ length: octaveCount }, (_, i) => startOctave + i).map((octave) =>
            renderOctave(octave)
          )}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-600 text-center flex-shrink-0">
        Click keys to play notes 🎵
      </div>
    </div>
  );
}

