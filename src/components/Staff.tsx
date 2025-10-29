// VexFlow staff rendering component

import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } from 'vexflow';
import { NoteSpec } from '../game/types';

interface StaffProps {
  sequence: NoteSpec[];
  currentIndex: number;
  flashError: boolean;
}

export default function Staff({ sequence, currentIndex, flashError }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (!containerRef.current || sequence.length === 0) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth;
    const height = 300;

    // Create VexFlow renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    rendererRef.current = renderer;

    const context = renderer.getContext();
    context.setFont('Arial', 10);

    try {
      // Determine if we need one or two staves
      const hasTreble = sequence.some((note) => note.clef === 'treble');
      const hasBass = sequence.some((note) => note.clef === 'bass');
      const needsBothStaves = hasTreble && hasBass;

      if (needsBothStaves) {
        renderBothClefs(context, sequence, currentIndex, flashError, width, height);
      } else if (hasTreble) {
        renderSingleClef(context, sequence, currentIndex, flashError, width, height, 'treble');
      } else {
        renderSingleClef(context, sequence, currentIndex, flashError, width, height, 'bass');
      }
    } catch (error) {
      console.error('Error rendering staff:', error);
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [sequence, currentIndex, flashError]);

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-md">
      <div ref={containerRef} className="w-full overflow-x-auto" />
    </div>
  );
}

function renderSingleClef(
  context: any,
  sequence: NoteSpec[],
  currentIndex: number,
  flashError: boolean,
  width: number,
  height: number,
  clef: 'treble' | 'bass'
) {
  const stave = new Stave(10, 80, width - 20);
  stave.addClef(clef);
  stave.setContext(context).draw();

  // Create notes
  const notes = sequence.map((noteSpec, index) => {
    const note = new StaveNote({
      keys: [noteSpec.vexKey],
      duration: 'q',
      clef: clef,
    });

    // Add accidental if present
    if (noteSpec.accidental && noteSpec.accidental !== 'n') {
      note.addModifier(new Accidental(noteSpec.accidental), 0);
    }

    // Color based on state
    if (index < currentIndex) {
      // Correct notes - green
      note.setStyle({ fillStyle: '#10b981', strokeStyle: '#10b981' });
    } else if (index === currentIndex) {
      if (flashError) {
        // Current note with error - red
        note.setStyle({ fillStyle: '#ef4444', strokeStyle: '#ef4444' });
      } else {
        // Current note waiting - blue
        note.setStyle({ fillStyle: '#3b82f6', strokeStyle: '#3b82f6' });
      }
    } else {
      // Future notes - default black
      note.setStyle({ fillStyle: '#000000', strokeStyle: '#000000' });
    }

    return note;
  });

  // Create voice and format
  const voice = new Voice({ num_beats: sequence.length, beat_value: 4 });
  voice.addTickables(notes);

  new Formatter().joinVoices([voice]).format([voice], width - 40);

  voice.draw(context, stave);
}

function renderBothClefs(
  context: any,
  sequence: NoteSpec[],
  currentIndex: number,
  flashError: boolean,
  width: number,
  height: number
) {
  // Render treble clef staff
  const trebleStave = new Stave(10, 40, width - 20);
  trebleStave.addClef('treble');
  trebleStave.setContext(context).draw();

  // Render bass clef staff
  const bassStave = new Stave(10, 160, width - 20);
  bassStave.addClef('bass');
  bassStave.setContext(context).draw();

  // Separate notes by clef
  const trebleNotes: (StaveNote | null)[] = [];
  const bassNotes: (StaveNote | null)[] = [];

  sequence.forEach((noteSpec, index) => {
    const note = new StaveNote({
      keys: [noteSpec.vexKey],
      duration: 'q',
      clef: noteSpec.clef,
    });

    // Add accidental if present
    if (noteSpec.accidental && noteSpec.accidental !== 'n') {
      note.addModifier(new Accidental(noteSpec.accidental), 0);
    }

    // Color based on state
    if (index < currentIndex) {
      note.setStyle({ fillStyle: '#10b981', strokeStyle: '#10b981' });
    } else if (index === currentIndex) {
      if (flashError) {
        note.setStyle({ fillStyle: '#ef4444', strokeStyle: '#ef4444' });
      } else {
        note.setStyle({ fillStyle: '#3b82f6', strokeStyle: '#3b82f6' });
      }
    } else {
      note.setStyle({ fillStyle: '#000000', strokeStyle: '#000000' });
    }

    // Add to appropriate staff (use ghost notes for other staff)
    if (noteSpec.clef === 'treble') {
      trebleNotes.push(note);
      bassNotes.push(null);
    } else {
      bassNotes.push(note);
      trebleNotes.push(null);
    }
  });

  // Create voices with ghost notes for alignment
  const trebleVoice = new Voice({ num_beats: sequence.length, beat_value: 4 });
  const bassVoice = new Voice({ num_beats: sequence.length, beat_value: 4 });

  // Add notes or rests
  trebleNotes.forEach((note) => {
    if (note) {
      trebleVoice.addTickable(note);
    } else {
      const rest = new StaveNote({ keys: ['b/4'], duration: 'qr', clef: 'treble' });
      rest.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
      trebleVoice.addTickable(rest);
    }
  });

  bassNotes.forEach((note) => {
    if (note) {
      bassVoice.addTickable(note);
    } else {
      const rest = new StaveNote({ keys: ['d/3'], duration: 'qr', clef: 'bass' });
      rest.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
      bassVoice.addTickable(rest);
    }
  });

  // Format and draw
  new Formatter().joinVoices([trebleVoice]).format([trebleVoice], width - 40);
  new Formatter().joinVoices([bassVoice]).format([bassVoice], width - 40);

  trebleVoice.draw(context, trebleStave);
  bassVoice.draw(context, bassStave);
}

