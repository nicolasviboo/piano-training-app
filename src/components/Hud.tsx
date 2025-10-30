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
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Score */}
        <div className="text-center">
          <div className="text-xs font-medium opacity-90">Score</div>
          <div className="text-2xl font-bold">{snapshot.score}</div>
          {highScore && (
            <div className="text-xs opacity-75">
              High: {highScore.score}
            </div>
          )}
        </div>

        {/* Lives */}
        <div className="text-center">
          <div className="text-xs font-medium opacity-90">Lives</div>
          <div className="text-xl font-bold flex justify-center gap-1 mt-1">
            {renderHearts()}
          </div>
        </div>

        {/* Streak */}
        <div className="text-center">
          <div className="text-xs font-medium opacity-90">Streak</div>
          <div className="text-2xl font-bold">
            {snapshot.streak}
            {snapshot.streak >= 5 && <span className="text-yellow-300">🔥</span>}
          </div>
        </div>

        {/* Accuracy */}
        <div className="text-center">
          <div className="text-xs font-medium opacity-90">Accuracy</div>
          <div className="text-2xl font-bold">{accuracy}%</div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="mt-3 pt-3 border-t border-white border-opacity-30 grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xs opacity-75">Avg Response</div>
          <div className="text-sm font-semibold">
            {snapshot.avgMsPerNote > 0 ? `${snapshot.avgMsPerNote}ms` : '-'}
          </div>
        </div>

        <div>
          <div className="text-xs opacity-75">Notes/Min</div>
          <div className="text-sm font-semibold">{notesPerMinute > 0 ? notesPerMinute : '-'}</div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <div className="text-xs opacity-75">Device</div>
          <div className="text-sm font-semibold flex items-center justify-center gap-2">
            {connectedDevice ? (
              <>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="truncate max-w-[150px]" title={connectedDevice.name}>
                  {connectedDevice.name}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span>Not connected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {snapshot.isPaused && (
        <div className="mt-3 text-center bg-white bg-opacity-20 rounded py-1.5 font-bold text-sm">
          ⏸️ PAUSED
        </div>
      )}
    </div>
  );
}

