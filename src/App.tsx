// Main application component

import { useState, useEffect, useCallback } from 'react';
import { initMIDI, isMIDISupported, updateMessageHandler, MIDIMessageHandler } from './midi/midi';
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
import { initAudio, playNote } from './utils/audio';
import { LeaderboardEntry, submitScore, wouldMakeTopTen } from './utils/gist';

// Components
import Staff from './components/Staff';
import Hud from './components/Hud';
import Controls from './components/Controls';
import DevicePicker from './components/DevicePicker';
import PianoFallback from './components/PianoFallback';
import Modal from './components/Modal';
import Leaderboard from './components/Leaderboard';

type AppScreen = 'welcome' | 'config' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [midiSupported, setMidiSupported] = useState(false);
  const [midiInitialized, setMidiInitialized] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [highScore, setHighScore] = useState<HighScoreEntry | null>(null);
  const [showStartGamePrompt, setShowStartGamePrompt] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [pendingLeaderboardEntry, setPendingLeaderboardEntry] = useState<LeaderboardEntry | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<LeaderboardEntry | null>(null);
  const [qualifiesForLeaderboard, setQualifiesForLeaderboard] = useState(false);

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
        streak: snapshot.bestStreak,
        date: new Date().toISOString(),
        difficulty: settings.difficulty,
      };

      saveHighScore(entry);
      setHighScore(getHighScore());

      // Check if score qualifies for leaderboard
      checkLeaderboardQualification(finalScore, snapshot.bestStreak);
    }
  }, [snapshot?.isGameOver, showGameOver, snapshot, settings.difficulty]);

  const checkLeaderboardQualification = async (
    score: number,
    streak: number
  ) => {
    const qualifies = await wouldMakeTopTen(score, settings.mode);
    
    if (qualifies) {
      // Prepare entry but wait for player name
      const entry: LeaderboardEntry = {
        playerName: '', // Will be filled when user submits
        score,
        avgResponseTime: Math.round(snapshot?.avgMsPerNote || 0),
        streak,
        correctNotes: snapshot?.correct || 0,
        difficulty: settings.difficulty,
        mode: settings.mode,
        date: new Date().toISOString(),
      };
      setPendingLeaderboardEntry(entry);
      setQualifiesForLeaderboard(true);
    } else {
      setQualifiesForLeaderboard(false);
    }
  };

  const handleSubmitName = async () => {
    if (!pendingLeaderboardEntry || !playerName.trim()) return;

    const entry = {
      ...pendingLeaderboardEntry,
      playerName: playerName.trim(),
    };

    const success = await submitScore(entry);
    
    if (success) {
      setSubmittedEntry(entry);
    }

    setQualifiesForLeaderboard(false);
    setPendingLeaderboardEntry(null);
    setPlayerName('');
  };

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

  // Update MIDI handler whenever it changes (keeps handler fresh across screens)
  useEffect(() => {
    updateMessageHandler(handleMIDIMessage);
  }, [handleMIDIMessage]);

  const handleWelcomeStart = (mode: 'reading' | 'hearing') => {
    setSettings({ ...settings, mode });
    setCurrentScreen('config');
  };

  const handleStartGame = () => {
    const newSnapshot = startGame(settings);
    setSnapshot(newSnapshot);
    setShowGameOver(false);
    setCurrentScreen('game');
    
    // Initialize audio context for hearing mode
    if (settings.mode === 'hearing') {
      initAudio();
    }
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
    setCurrentScreen('config');
  };

  const handlePlayAgain = () => {
    setShowGameOver(false);
    setSubmittedEntry(null);
    setQualifiesForLeaderboard(false);
    setPendingLeaderboardEntry(null);
    setPlayerName('');
    handleStartGame();
  };

  const handleResetFromGameOver = () => {
    setShowGameOver(false);
    setSubmittedEntry(null);
    setQualifiesForLeaderboard(false);
    setPendingLeaderboardEntry(null);
    setPlayerName('');
    handleResetGame();
  };

  const handlePianoClick = (midiNote: number) => {
    if (snapshot && !snapshot.isPaused && !snapshot.isGameOver) {
      const newSnapshot = handleInput(snapshot, midiNote, settings);
      setSnapshot(newSnapshot);
    }
  };

  const handlePlayCurrentNote = () => {
    if (snapshot && !snapshot.isPaused && !snapshot.isGameOver) {
      const currentNote = snapshot.sequence[snapshot.currentIndex];
      playNote(currentNote.midi, 1.0, 0.3);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Welcome Screen */}
      {currentScreen === 'welcome' && (
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-4xl">
            <h1 className="text-7xl font-bold text-gray-900 mb-4">
              🎹 Solideya
            </h1>
            <p className="text-gray-600 text-2xl mb-12">
              Master piano sight-reading and note recognition
            </p>
            
            {/* Game Mode Selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Choose Your Challenge
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Reading Challenge */}
                <button
                  onClick={() => handleWelcomeStart('reading')}
                  className="group relative p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-blue-200 hover:border-blue-400"
                >
                  <div className="text-6xl mb-4">👀</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Reading Challenge
                  </h3>
                  <p className="text-gray-600 mb-4">
                    See notes on the staff and play them on your piano
                  </p>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-semibold mb-2">Perfect for:</p>
                    <ul className="text-left space-y-1">
                      <li>• Sight-reading practice</li>
                      <li>• Learning note positions</li>
                      <li>• Sheet music fluency</li>
                    </ul>
                  </div>
                </button>

                {/* Hearing Challenge */}
                <button
                  onClick={() => handleWelcomeStart('hearing')}
                  className="group relative p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 border-4 border-purple-200 hover:border-purple-400"
                >
                  <div className="text-6xl mb-4">👂</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Hearing Challenge
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Listen to notes and play them back on your piano
                  </p>
                  <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-semibold mb-2">Perfect for:</p>
                    <ul className="text-left space-y-1">
                      <li>• Ear training</li>
                      <li>• Perfect pitch development</li>
                      <li>• Musical memory</li>
                    </ul>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="text-center">
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="py-4 px-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-xl"
                >
                  🏆 View Leaderboard
                </button>
              </div>

              <div className="text-left max-w-2xl mx-auto space-y-3 text-gray-700 bg-white rounded-xl p-6 shadow-lg">
                <p className="text-xl font-semibold mb-4">📌 How to play:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Play the first note in the sequence on your keyboard</li>
                  <li>Correct notes turn <span className="text-green-600 font-semibold">green</span></li>
                  <li>Wrong notes flash <span className="text-red-600 font-semibold">red</span> and reset the sequence</li>
                  <li>Complete sequences to earn points and build your streak!</li>
                  <li>Game continues until you run out of lives</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Screen */}
      <div className={currentScreen === 'config' ? '' : 'hidden'}>
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              🎹 Solideya
            </h1>
            <p className="text-gray-600 text-lg">
              Configure your settings and MIDI device
            </p>
          </header>

          <div className="max-w-2xl mx-auto space-y-6">
            <Controls
              settings={settings}
              onSettingsChange={setSettings}
              isGameActive={false}
              isPaused={false}
              onStart={handleStartGame}
              onPause={handlePauseGame}
              onResume={handleResumeGame}
              onReset={handleResetGame}
            />

            {/* MIDI Device Picker - Always rendered to maintain connection */}
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

            {showStartGamePrompt && (
              <div className="p-4 bg-blue-50 border-2 border-blue-400 rounded-lg animate-pulse">
                <div className="text-blue-900 font-bold text-lg mb-2">
                  🎹 MIDI Input Detected!
                </div>
                <div className="text-blue-700">
                  Click "Start Game" above to begin playing
                </div>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Want to change the game mode? Go back to the welcome screen.
              </p>
              <button
                onClick={() => setCurrentScreen('welcome')}
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                ← Back to Welcome
              </button>
            </div>
          </div>

          <footer className="text-center text-gray-600 text-sm mt-12 pb-4">
            <p>
              © {new Date().getFullYear()} Solideya • Made with ❤️ for piano students •{' '}
              <a
                href="https://github.com/nicolasviboo/piano-training-app"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </p>
          </footer>
        </div>
      </div>

      {/* Game Screen - Full Screen */}
      <div className={currentScreen === 'game' && snapshot ? '' : 'hidden'}>
        <div className="h-screen flex flex-col">
          {/* Header with HUD and controls */}
          <header className="bg-white shadow-md px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 flex-shrink-0">
              🎹 Solideya
            </h1>
            
            {/* HUD in the middle */}
            {snapshot && (
              <div className="flex-1 min-w-0">
                <Hud snapshot={snapshot} highScore={highScore} />
              </div>
            )}
            
            <div className="flex gap-2 flex-shrink-0">
              {snapshot && !snapshot.isPaused ? (
                <button
                  onClick={handlePauseGame}
                  className="py-2 px-4 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  ⏸️ Pause
                </button>
              ) : (
                <button
                  onClick={handleResumeGame}
                  className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ▶️ Resume
                </button>
              )}
              <button
                onClick={handleResetGame}
                className="py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                🔄 Quit
              </button>
            </div>
          </header>

          {/* Main Game Content */}
          {snapshot && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col h-full px-6 py-2 gap-2">
                {/* Game Content Area - Centered with proper spacing, max-height to prevent overflow */}
                <div className="flex-grow flex flex-col justify-center py-2 overflow-hidden" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                  {settings.mode === 'reading' ? (
                    // Reading Mode - Show Staff
                    <div className="space-y-2 max-h-full flex flex-col items-center justify-center">
                      <div className="w-full max-w-full" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                        <Staff
                          sequence={snapshot.sequence}
                          currentIndex={snapshot.currentIndex}
                          flashError={snapshot.flashError}
                        />
                      </div>
                    </div>
                  ) : (
                    // Hearing Mode - Show Play Button
                    <div className="space-y-2 max-h-full flex flex-col items-center justify-center">
                      <h2 className="text-lg font-bold text-gray-900 text-center">
                        {snapshot.isPaused ? '⏸️ Game Paused' : '👂 Listen and play back the note'}
                      </h2>
                      <div className="max-w-2xl mx-auto w-full" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                        <div className="bg-white rounded-2xl shadow-xl p-4 text-center border-4 border-purple-200">
                          <div className="mb-3">
                            <div className="text-4xl mb-2">🔊</div>
                            <p className="text-sm text-gray-600 mb-3">
                              Click the button to hear the note
                            </p>
                            <button
                              onClick={handlePlayCurrentNote}
                              disabled={snapshot.isPaused || snapshot.isGameOver}
                              className="py-2 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-base font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              type="button"
                            >
                              🎵 Play Note
                            </button>
                          </div>
                          
                          {/* Visual feedback for sequence progress */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-2">Sequence Progress</p>
                            <div className="flex justify-center gap-2 flex-wrap">
                              {snapshot.sequence.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-3 h-3 rounded-full ${
                                    index < snapshot.currentIndex
                                      ? 'bg-green-500'
                                      : index === snapshot.currentIndex
                                      ? snapshot.flashError
                                        ? 'bg-red-500 animate-pulse'
                                        : 'bg-blue-500 animate-pulse'
                                      : 'bg-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* On-screen piano fallback - Always visible at bottom with max height */}
                {(settings.enableFallbackPiano || !midiSupported) && (
                  <div className="flex-shrink-0" style={{ maxHeight: '150px' }}>
                    <PianoFallback onNoteClick={handlePianoClick} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Modal */}
      <Modal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title=""
        showCloseButton={false}
        maxWidth="4xl"
      >
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          highlightEntry={submittedEntry}
        />
      </Modal>

      {/* Game Over Modal */}
      <Modal
        isOpen={showGameOver}
        onClose={handlePlayAgain}
        title="🎉 Game Over!"
        showCloseButton={false}
      >
        {snapshot && (
          <div className="space-y-6">
            {/* Leaderboard Qualification Banner */}
            {qualifiesForLeaderboard && !submittedEntry && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-yellow-400">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">🏆</div>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    Top 10 Score!
                  </p>
                  <p className="text-gray-600">
                    Your score qualifies for the leaderboard!
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your name:
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && playerName.trim() && handleSubmitName()}
                      placeholder="Your name"
                      maxLength={20}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-lg"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleSubmitName}
                    disabled={!playerName.trim()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-lg font-bold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit to Leaderboard
                  </button>
                </div>
              </div>
            )}

            {/* Stats Grid */}
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
                  {snapshot.bestStreak}
                </div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>

            {/* New High Score Badge */}
            {highScore && snapshot.score >= highScore.score && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-bold text-yellow-900">New Personal Best!</div>
              </div>
            )}

            {/* Score Submitted Confirmation */}
            {submittedEntry && (
              <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-bold text-green-900">Score submitted to leaderboard!</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 px-6 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transition-colors"
              >
                🔄 Play Again
              </button>
              <button
                onClick={handleResetFromGameOver}
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

