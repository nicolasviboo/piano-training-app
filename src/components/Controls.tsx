// Game controls for settings and game state management

import { GameSettings, Difficulty, ClefChoice, DIFFICULTY_CONFIGS } from '../game/types';

interface ControlsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  isGameActive: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function Controls({
  settings,
  onSettingsChange,
  isGameActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onReset,
}: ControlsProps) {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    
    // Update sequence length when difficulty changes
    if (key === 'difficulty') {
      const config = DIFFICULTY_CONFIGS[value as Difficulty];
      newSettings.sequenceLength = config.defaultSequenceLength;
    }
    
    onSettingsChange(newSettings);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Game Settings</h2>

      {/* Game Mode Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Mode
        </label>
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {settings.mode === 'reading' ? '👀' : '👂'}
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900">
              {settings.mode === 'reading' ? 'Reading Challenge' : 'Hearing Challenge'}
            </div>
            <div className="text-sm text-gray-600">
              {settings.mode === 'reading' 
                ? 'See notes and play them' 
                : 'Hear notes and play them back'}
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty
        </label>
        <select
          value={settings.difficulty}
          onChange={(e) => updateSetting('difficulty', e.target.value as Difficulty)}
          disabled={isGameActive}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="beginner">Beginner (C3-C5, naturals only)</option>
          <option value="intermediate">Intermediate (A2-E5, with accidentals)</option>
          <option value="advanced">Advanced (F2-G5, all accidentals)</option>
        </select>
      </div>

      {/* Clef Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clef
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['treble', 'bass', 'both'] as ClefChoice[]).map((clef) => (
            <button
              key={clef}
              onClick={() => updateSetting('clef', clef)}
              disabled={isGameActive}
              className={`py-2 px-4 rounded border-2 transition-all ${
                settings.clef === clef
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {clef.charAt(0).toUpperCase() + clef.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lives */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lives: {settings.lives}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={settings.lives}
          onChange={(e) => updateSetting('lives', parseInt(e.target.value))}
          disabled={isGameActive}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* Sequence Length */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sequence Length: {settings.sequenceLength}
        </label>
        <input
          type="range"
          min="3"
          max="20"
          value={settings.sequenceLength}
          onChange={(e) => updateSetting('sequenceLength', parseInt(e.target.value))}
          disabled={isGameActive}
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>3</span>
          <span>20</span>
        </div>
      </div>

      {/* Double Accidentals (Advanced only) */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.allowDoubleAccidentals}
            onChange={(e) => updateSetting('allowDoubleAccidentals', e.target.checked)}
            disabled={isGameActive || settings.difficulty !== 'advanced'}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-medium text-gray-700">
            Allow Double Accidentals (## / bb)
          </span>
        </label>
        {settings.difficulty !== 'advanced' && (
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Only available in Advanced difficulty
          </p>
        )}
      </div>

      {/* Fallback Piano */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.enableFallbackPiano}
            onChange={(e) => updateSetting('enableFallbackPiano', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">
            Show On-Screen Piano
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Enable if no MIDI keyboard is available
        </p>
      </div>

      {/* Game Control Buttons */}
      <div className="pt-4 border-t space-y-2">
        {!isGameActive ? (
          <button
            onClick={onStart}
            className="w-full py-3 px-6 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transition-colors shadow-md"
          >
            🎮 Start Game
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onResume}
                className="w-full py-3 px-6 bg-blue-500 text-white text-lg font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-md"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="w-full py-3 px-6 bg-yellow-500 text-white text-lg font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-md"
              >
                ⏸️ Pause
              </button>
            )}
            <button
              onClick={onReset}
              className="w-full py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              🔄 Reset Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}

