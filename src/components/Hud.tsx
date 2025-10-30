// Heads-up display showing score, lives, streak, accuracy, and device status

import { GameSnapshot } from '../game/types';
import { calculateAccuracy, calculateNotesPerMinute } from '../game/scoring';
import { getConnectedDevice } from '../midi/midi';
import { HighScoreEntry } from '../utils/storage';

interface HudProps {
  snapshot: GameSnapshot;
  highScore: HighScoreEntry | null;
}

export default function Hud({ snapshot, highScore }: HudProps) {
  const accuracy = calculateAccuracy(snapshot.correct, snapshot.attempts);
  const notesPerMinute = calculateNotesPerMinute(snapshot.avgMsPerNote);
  const connectedDevice = getConnectedDevice();

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < snapshot.lives; i++) {
      hearts.push(
        <span key={i} className="text-red-500 text-2xl">
          ♥
        </span>
      );
    }
    return hearts;
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-1.5 px-3 rounded-lg shadow-md">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Score */}
        <div className="flex items-center gap-1.5">
          <div className="text-center">
            <div className="text-[10px] font-medium opacity-75">Score</div>
            <div className="text-lg font-bold">{snapshot.score}</div>
          </div>
          {highScore && (
            <div className="text-[10px] opacity-60 whitespace-nowrap">
              High: {highScore.score}
            </div>
          )}
        </div>

        {/* Lives */}
        <div className="text-center">
          <div className="text-[10px] font-medium opacity-75">Lives</div>
          <div className="text-base font-bold flex justify-center gap-0.5">
            {renderHearts()}
          </div>
        </div>

        {/* Streak */}
        <div className="text-center">
          <div className="text-[10px] font-medium opacity-75">Streak</div>
          <div className="text-lg font-bold">
            {snapshot.streak}
            {snapshot.streak >= 5 && <span className="text-yellow-300 ml-1">🔥</span>}
          </div>
        </div>

        {/* Accuracy */}
        <div className="text-center">
          <div className="text-[10px] font-medium opacity-75">Accuracy</div>
          <div className="text-lg font-bold">{accuracy}%</div>
        </div>

        {/* Avg Response */}
        <div className="text-center">
          <div className="text-[10px] opacity-75">Avg Response</div>
          <div className="text-xs font-semibold">
            {snapshot.avgMsPerNote > 0 ? `${snapshot.avgMsPerNote}ms` : '-'}
          </div>
        </div>

        {/* Notes/Min */}
        <div className="text-center">
          <div className="text-[10px] opacity-75">Notes/Min</div>
          <div className="text-xs font-semibold">{notesPerMinute > 0 ? notesPerMinute : '-'}</div>
        </div>

        {/* Device */}
        <div className="text-center">
          <div className="text-[10px] opacity-75">Device</div>
          <div className="text-xs font-semibold flex items-center justify-center gap-1">
            {connectedDevice ? (
              <>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="truncate max-w-[100px]" title={connectedDevice.name}>
                  {connectedDevice.name}
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                <span>Not connected</span>
              </>
            )}
          </div>
        </div>

        {/* Paused indicator inline */}
        {snapshot.isPaused && (
          <div className="text-center px-2 py-0.5 bg-white bg-opacity-20 rounded font-bold text-xs">
            ⏸️ PAUSED
          </div>
        )}
      </div>
    </div>
  );
}

