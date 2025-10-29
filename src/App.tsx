// Main application component

import { useState, useEffect, useCallback } from 'react';
import { initMIDI, isMIDISupported, MIDIMessageHandler } from './midi/midi';
import { GameSettings, GameSnapshot, DEFAULT_SETTINGS } from './game/types';
import {
  startGame,
  handleInput,
  pauseGame,
  resumeGame,
  clearFlashError,
  getAccuracy,
} from './game/gameLoop';
import { calculateFinalScore, calculateDuration } from './game/scoring';
import { saveSettings, loadSettings, saveHighScore, getHighScore, HighScoreEntry } from './utils/storage';
import { getCurrentTime } from './utils/time';

// Components
import Staff from './components/Staff';
import Hud from './components/Hud';
import Controls from './components/Controls';
import DevicePicker from './components/DevicePicker';
import PianoFallback from './components/PianoFallback';
import Modal from './components/Modal';

function App() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [midiSupported, setMidiSupported] = useState(false);
  const [midiInitialized, setMidiInitialized] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [highScore, setHighScore] = useState<HighScoreEntry | null>(null);
  const [showStartGamePrompt, setShowStartGamePrompt] = useState(false);

  // Initialize MIDI on mount
  useEffect(() => {
    const supported = isMIDISupported();
    setMidiSupported(supported);

    if (supported) {
      initMIDI().then((success) => {
        setMidiInitialized(success);
      });
    }

    // Load settings and high score
    setSettings(loadSettings());
    setHighScore(getHighScore());
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (settings !== DEFAULT_SETTINGS) {
      saveSettings(settings);
    }
  }, [settings]);

  // Clear flash error after animation
  useEffect(() => {
    if (snapshot?.flashError) {
      const timer = setTimeout(() => {
        setSnapshot((prev) => (prev ? clearFlashError(prev) : prev));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [snapshot?.flashError]);

  // Check for game over
  useEffect(() => {
    if (snapshot?.isGameOver && !showGameOver) {
      setShowGameOver(true);
      
      // Save high score
      const duration = calculateDuration(snapshot.startedAt, getCurrentTime());
      const finalScore = calculateFinalScore(snapshot.score, duration, snapshot.correct);
      const accuracy = getAccuracy(snapshot);

      const entry: HighScoreEntry = {
        score: finalScore,
        accuracy,
        streak: snapshot.streak,
        date: new Date().toISOString(),
        difficulty: settings.difficulty,
      };

      saveHighScore(entry);
      setHighScore(getHighScore());
    }
  }, [snapshot?.isGameOver, showGameOver, snapshot, settings.difficulty]);

  // MIDI message handler
  const handleMIDIMessage: MIDIMessageHandler = useCallback(
    (midiNote: number, velocity: number) => {
      console.log(`🎹 MIDI Note Received: ${midiNote} (velocity: ${velocity})`);
      
      if (snapshot && !snapshot.isPaused && !snapshot.isGameOver) {
        const newSnapshot = handleInput(snapshot, midiNote, settings);
        setSnapshot(newSnapshot);
        setShowStartGamePrompt(false); // Clear prompt when game is active
      } else {
        console.log('⚠️ Game not started yet. Click "Start Game" to begin!');
        // Show prompt to start game
        setShowStartGamePrompt(true);
        setTimeout(() => setShowStartGamePrompt(false), 3000);
      }
    },
    [snapshot, settings]
  );

  const handleDeviceConnect = useCallback(
    (_handler: MIDIMessageHandler) => {
      console.log('MIDI device connected');
    },
    []
  );

  const handleStartGame = () => {
    const newSnapshot = startGame(settings);
    setSnapshot(newSnapshot);
    setShowGameOver(false);
  };

  const handlePauseGame = () => {
    if (snapshot) {
      setSnapshot(pauseGame(snapshot));
    }
  };

  const handleResumeGame = () => {
    if (snapshot) {
      setSnapshot(resumeGame(snapshot));
    }
  };

  const handleResetGame = () => {
    setSnapshot(null);
    setShowGameOver(false);
  };

  const handlePlayAgain = () => {
    setShowGameOver(false);
    handleStartGame();
  };

  const handlePianoClick = (midiNote: number) => {
    if (snapshot && !snapshot.isPaused && !snapshot.isGameOver) {
      const newSnapshot = handleInput(snapshot, midiNote, settings);
      setSnapshot(newSnapshot);
    }
  };

  const isGameActive = snapshot !== null && !snapshot.isGameOver;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            🎹 Piano Note Trainer
          </h1>
          <p className="text-gray-600 text-lg">
            Master piano note recognition with your MIDI keyboard
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Controls & Device */}
          <div className="space-y-6">
            <Controls
              settings={settings}
              onSettingsChange={setSettings}
              isGameActive={isGameActive}
              isPaused={snapshot?.isPaused ?? false}
              onStart={handleStartGame}
              onPause={handlePauseGame}
              onResume={handleResumeGame}
              onReset={handleResetGame}
            />

            {midiSupported && midiInitialized && (
              <DevicePicker
                onDeviceConnect={handleDeviceConnect}
                messageHandler={handleMIDIMessage}
              />
            )}

            {!midiSupported && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ MIDI Not Supported</h3>
                <p className="text-sm text-yellow-800">
                  Your browser doesn't support Web MIDI API. Enable the on-screen piano to play.
                </p>
              </div>
            )}
          </div>

          {/* Center & Right Columns - Game Display */}
          <div className="lg:col-span-2 space-y-6">
            {snapshot && <Hud snapshot={snapshot} highScore={highScore} />}

            {snapshot && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {snapshot.isPaused ? '⏸️ Game Paused' : '🎵 Play the highlighted note'}
                </h2>
                <Staff
                  sequence={snapshot.sequence}
                  currentIndex={snapshot.currentIndex}
                  flashError={snapshot.flashError}
                />
              </div>
            )}

            {!snapshot && (
              <div className="bg-white border-2 border-gray-300 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎼</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Train?
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure your settings and connect your MIDI keyboard, then press Start Game!
                </p>
                
                {/* Prompt when MIDI is received but game not started */}
                {showStartGamePrompt && (
                  <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-400 rounded-lg animate-pulse">
                    <div className="text-blue-900 font-bold text-lg mb-2">
                      🎹 MIDI Input Detected!
                    </div>
                    <div className="text-blue-700">
                      Click "Start Game" on the left to begin playing
                    </div>
                  </div>
                )}
                
                <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-700">
                  <p>📌 <strong>How to play:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Play the first note in the sequence on your keyboard</li>
                    <li>Correct notes turn <span className="text-green-600 font-semibold">green</span></li>
                    <li>Wrong notes flash <span className="text-red-600 font-semibold">red</span> and reset the sequence</li>
                    <li>Complete sequences to earn points and build your streak!</li>
                    <li>Game continues until you run out of lives</li>
                  </ul>
                </div>
              </div>
            )}

            {/* On-screen piano fallback */}
            {(settings.enableFallbackPiano || !midiSupported) && snapshot && (
              <PianoFallback onNoteClick={handlePianoClick} />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm mt-12 pb-4">
          <p>
            Made with ❤️ for piano students • Requires HTTPS for MIDI access •{' '}
            <a
              href="https://github.com/yourusername/piano-note-trainer"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>

      {/* Game Over Modal */}
      <Modal
        isOpen={showGameOver}
        onClose={handlePlayAgain}
        title="🎉 Game Over!"
        showCloseButton={false}
      >
        {snapshot && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{snapshot.score}</div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-600">
                  {getAccuracy(snapshot)}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{snapshot.correct}</div>
                <div className="text-sm text-gray-600">Correct Notes</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-600">
                  {snapshot.streak}
                </div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>

            {highScore && snapshot.score >= highScore.score && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-bold text-yellow-900">New High Score!</div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 px-6 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transition-colors"
              >
                🔄 Play Again
              </button>
              <button
                onClick={handleResetGame}
                className="flex-1 py-3 px-6 bg-gray-500 text-white text-lg font-bold rounded-lg hover:bg-gray-600 transition-colors"
              >
                ⚙️ Change Settings
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;

