# 🎹 Piano Note Trainer

A production-ready React web application for training piano note recognition with a connected MIDI keyboard. Master sight-reading skills through an engaging, gamified experience with real-time feedback.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🎮 Engaging Gameplay**: "Guess the Sequence" game mode with endless progression
- **🎹 MIDI Support**: Full Web MIDI API integration for real keyboard input
- **🎼 Musical Notation**: Professional staff rendering using VexFlow
- **📊 Performance Tracking**: Real-time metrics including score, accuracy, streak, and notes per minute
- **🎚️ Difficulty Levels**: Beginner, Intermediate, and Advanced modes with customizable settings
- **🎵 Flexible Clefs**: Train with Treble, Bass, or both clefs
- **⌨️ Fallback Piano**: On-screen clickable piano when no MIDI keyboard is available
- **💾 Persistence**: Settings and high scores saved to localStorage
- **♿ Accessible**: Keyboard navigable with clear visual feedback

## 🎯 How to Play

1. **Connect** your MIDI keyboard (or enable the on-screen piano)
2. **Configure** your preferred difficulty, clef, and other settings
3. **Start** the game and play the first note in the displayed sequence
4. **Correct notes** turn green and advance to the next note
5. **Wrong notes** flash red, cost a life, and reset the sequence
6. **Complete sequences** to earn points and build your streak
7. Continue playing until you run out of lives!

### Scoring

- **+10 points** per correct note
- **+5 bonus** every 5 consecutive correct notes (streak milestone)
- **Accuracy tracking** for performance analysis
- **Speed metrics** to monitor improvement

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser with Web MIDI API support (Chrome, Edge, Opera)
- MIDI keyboard (optional, on-screen fallback available)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Run Tests

```bash
# Run test suite
npm test

# Run tests with UI
npm run test:ui
```

## 📦 Deployment to GitHub Pages

### Option A: Manual Deployment

```bash
# Build and deploy to gh-pages branch
npm run build
npm run deploy
```

### Option B: Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to `main`.

**Setup Steps:**

1. Go to your repository **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. Push to `main` branch
4. Your app will be automatically deployed!

**Access your app at:** `https://yourusername.github.io/piano-note-trainer/`

## 🎛️ Configuration Options

### Difficulty Levels

| Level | Note Range | Accidentals | Ledger Lines | Default Length |
|-------|-----------|-------------|--------------|----------------|
| **Beginner** | C3–C5 | None | ≤1 | 5 notes |
| **Intermediate** | A2–E5 | ♯/♭ (30%) | ≤2 | 8 notes |
| **Advanced** | F2–G5 | ♯/♭ (50%), ♯♯/♭♭ optional | ≤3 | 12 notes |

### Settings

- **Clef**: Treble, Bass, or Both (randomized)
- **Lives**: 1–5 (default: 3)
- **Sequence Length**: 3–20 notes (default varies by difficulty)
- **Double Accidentals**: Enable ♯♯ and ♭♭ (Advanced only)
- **On-Screen Piano**: Show clickable fallback keyboard

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Notation**: VexFlow for staff rendering
- **MIDI**: Web MIDI API
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## 🏗️ Project Structure

```
piano-note-trainer/
├── src/
│   ├── components/       # React components (Staff, Hud, Controls, etc.)
│   ├── game/            # Game logic (state machine, scoring, note generation)
│   ├── midi/            # Web MIDI API integration
│   ├── utils/           # Utilities (storage, timing)
│   ├── styles/          # Global styles
│   ├── test/            # Test setup
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── [config files]       # TypeScript, Vite, Tailwind, ESLint configs
```

## 🔧 Troubleshooting

### MIDI Not Working

- **Browser Support**: Use Chrome, Edge, or Opera (Safari and Firefox have limited support)
- **HTTPS Required**: Web MIDI API requires HTTPS (or localhost for development)
- **Permissions**: Grant MIDI access when prompted by browser
- **Device Connection**: Ensure keyboard is connected before opening the app
- **Fallback**: Enable on-screen piano in settings

### Performance Issues

- Close other MIDI applications that might be using the device
- Try refreshing the page
- Check browser console for error messages

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

## 📝 Browser Compatibility

| Browser | MIDI Support | Recommended |
|---------|-------------|-------------|
| Chrome | ✅ Full | ✅ Yes |
| Edge | ✅ Full | ✅ Yes |
| Opera | ✅ Full | ✅ Yes |
| Firefox | ⚠️ Limited | ⚠️ Use fallback |
| Safari | ❌ None | ⚠️ Use fallback |

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [VexFlow](https://github.com/0xfe/vexflow) for music notation rendering
- [Web MIDI API](https://webaudio.github.io/web-midi-api/) for MIDI device integration
- [Tailwind CSS](https://tailwindcss.com/) for styling
- All contributors and users!

## 📧 Support

If you encounter issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search [existing issues](https://github.com/yourusername/piano-note-trainer/issues)
3. Open a [new issue](https://github.com/yourusername/piano-note-trainer/issues/new)

---

Made with ❤️ for piano students everywhere

