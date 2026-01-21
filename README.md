# PokerPulsePro Desktop

A beautiful, minimalistic poker tournament timer and manager built with Tauri (Rust) + React + TypeScript.

![PokerPulsePro](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### Core Features
- **Tournament Timer** - Large, readable countdown with automatic level progression
- **Blind Structure** - Customizable blinds with templates (Turbo, Regular, Deep Stack)
  - **Custom Templates** - Save, load, import/export your own blind structures
  - Active template indicator shows which structure is in use
- **Player Management** - Track buy-ins, rebuys, add-ons, and eliminations
- **Prize Calculator** - Automatic payout calculations with customizable splits
- **Chip Breakdown** - Visual chip distribution suggestions
- **Dark Mode** - Beautiful dark theme designed for visibility
- **Offline First** - Works without internet, data stored locally
- **Cross-Platform** - Windows, macOS, and Linux support

### New Features
- **🔊 Sound Alerts** - Configurable audio alerts between blind levels
  - Built-in sounds: Bell Ring, Evil Laugh
  - Custom sound file support (WAV, MP3, OGG, M4A)
  - Adjustable volume control
  - **Warning sounds** at 60 and 30 seconds before level change
  - Auto-pause on breaks option
- **💾 Auto-Save & Persistence** - Tournament progress automatically saved
  - Survives app restarts, window closes, and refreshes
  - Timer paused on restore to prevent missed time
  - Sound settings and tab position remembered
- **🖥️ Fullscreen Mode** - Native fullscreen support via Tauri window API
- **ℹ️ About Dialog** - Quick access to app info from the header
- **📊 Enhanced Timer Display** - Larger fonts with key stats always visible
  - Players remaining, Prize Pool, Average Stack, Next Level
  - Level indicator with bigger text
- **➕ Add-on Support** - Full add-on tracking alongside rebuys
  - Separate add-on amount and chip values
  - Included in prize pool and average stack calculations
- **📚 Help Page** - Poker hand rankings reference for beginners
  - Visual card examples for each hand type
  - Tips and common questions
- **⌨️ Keyboard Shortcuts** - Quick controls without mouse
  - Space: Play/Pause timer
  - Arrow keys: Navigate levels
  - +/-: Add/remove time
  - F: Toggle fullscreen
  - Escape: Exit fullscreen
- **🎨 Color Themes** - Customizable appearance
  - Light and Dark mode toggle
  - 6 accent color options (Emerald, Blue, Purple, Rose, Amber, Cyan)
  - Smooth transitions between themes
- **🔀 Drag & Drop Blinds** - Reorder blind levels by dragging
- **🕐 Real-Time Clock** - Current time displayed on timer screen
- **📤 Export/Import** - Save and load tournament configurations
  - Export settings to JSON file for sharing
  - Import previously saved configurations
  - Works in both desktop app (native file dialog) and browser
- **📜 Tournament History** - Log of completed tournaments
  - Track winner, players, prize pool, and duration
  - View and manage past tournaments
  - Persistent storage between sessions
- **🪟 Custom Modal Dialogs** - Beautiful themed dialogs
  - Replaces native browser alerts/confirms/prompts
  - Matches app theme (light/dark mode + accent colors)
  - Backdrop blur, keyboard support, smooth animations
  - Persistent storage between sessions
- **🌍 Multilingual Support** - Full internationalization (i18n)
  - 6 languages: English, Spanish, German, French, Portuguese, Icelandic
  - Language selector in Settings
  - All UI components translated
- **🔄 Auto-Update** - Built-in update notifications
  - Checks for new versions automatically
  - One-click download and install
  - Signed releases for security
- **📺 Projector Mode** - Second screen support for TV/projector
  - Dedicated display window with giant timer
  - Syncs automatically with main window
  - Perfect for home games and tournaments

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or later)
   ```bash
   # Check version
   node --version
   ```

2. **Rust** (latest stable)
   ```bash
   # Windows (via winget)
   winget install Rustlang.Rustup
   
   # macOS/Linux
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Verify installation
   rustc --version
   ```

3. **Visual Studio Build Tools** (Windows only)
   - Install "Desktop development with C++" workload
   - For ARM64 Windows: Also install "MSVC v143 - VS 2022 C++ ARM64/ARM64EC build tools"

4. **System Dependencies** (Linux only)
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
   
   # Fedora
   sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file
   
   # Arch
   sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl
   ```

### Installation

```bash
# Clone or extract the project
cd pokerpulsepro-tauri

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## 📁 Project Structure

```
pokerpulsepro-tauri/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── Timer.tsx       # Main timer display with stats bar
│   │   ├── Players.tsx     # Player management (buy-ins, rebuys, add-ons)
│   │   ├── Blinds.tsx      # Blind structure editor with drag & drop
│   │   ├── Prizes.tsx      # Payout calculator
│   │   ├── Settings.tsx    # Tournament, sound & theme settings
│   │   ├── Help.tsx        # Poker hand rankings reference
│   │   ├── Header.tsx      # App header with About dropdown
│   │   └── Navigation.tsx  # Tab navigation
│   ├── App.tsx             # Main app with persistence logic
│   ├── api.ts              # Tauri API bindings & mock data
│   ├── types.ts            # TypeScript definitions
│   ├── utils.ts            # Utility functions (prize pool, avg stack)
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   └── main.rs         # Tauri commands & state
│   ├── icons/              # App icons
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
│   └── alarms/             # Sound files
│       ├── bell-ring-01.wav
│       └── evil-laugh.wav
├── package.json            # Node dependencies
├── tailwind.config.js      # Tailwind CSS config
├── vite.config.ts          # Vite bundler config
└── README.md               # This file
```

## 🎮 Usage

### Timer Controls

| Action | Shortcut |
|--------|----------|
| Play/Pause | `Space` or click center button |
| Previous Level | `←` or left arrow button |
| Next Level | `→` or right arrow button |
| Add 1 minute | `+` or +1m button |
| Subtract 1 minute | `-` or -1m button |
| Add 5 minutes | +5m button |
| Fullscreen | `F` or top-right button |
| Exit Fullscreen | `Escape` |

### Managing Players

1. Go to the **Players** tab
2. Enter a player name and click **Add Player**
3. Use +/- buttons to adjust buy-ins, rebuys, and add-ons
4. Click **Eliminate** when a player is knocked out
5. Placements are automatically assigned

### Sound Alerts

1. Go to the **Settings** tab
2. Find the "Level Change Sound" section
3. Toggle alerts on/off
4. Choose from built-in sounds or select a custom audio file
5. Adjust volume with the slider
6. Use "Test Sound" to preview
7. Enable **Warning Sounds** to hear beeps at 60s and 30s remaining
8. Enable **Auto-pause on breaks** to pause timer during breaks

### Customizing Blinds

1. Go to the **Blinds** tab
2. Choose a template (Turbo/Regular/Deep Stack) or customize
3. Click ✎ to edit individual levels
4. Use ↑↓ buttons or **drag the ⋮⋮ handle** to reorder levels
5. Add breaks between levels as needed

### Prize Payouts

1. Go to the **Prizes** tab
2. Select number of paid places (2-8)
3. Adjust percentages if needed
4. View automatic payout calculations
5. Final standings update as players are eliminated
6. Prize pool includes buy-ins, rebuys, and add-ons

### Tournament Settings

Configure in the **Settings** tab:
- **Appearance** - Light/Dark mode and accent color selection
- **Currency** - USD, EUR, GBP, JPY, ISK, CAD, AUD
- **Buy-in Amount** - Entry fee
- **Rebuy Amount & Chips** - Cost and chips for rebuys
- **Add-on Amount & Chips** - Cost and chips for add-ons
- **Starting Chips** - Quick presets or custom amount
- **Sound Settings** - Level change sounds, warning beeps, volume

### Data Persistence

Your tournament data is automatically saved to local storage:
- All player data, eliminations, and placements
- Current blind level and time remaining
- Sound settings and preferences
- Theme settings (mode and accent color)
- Survives app restarts and refreshes
- Use "Reset Tournament" in Settings to start fresh

### Help & Hand Rankings

New to poker? Go to the **Help** tab to see:
- All poker hand rankings from Royal Flush to High Card
- Visual card examples for each hand
- Quick tips for beginners

## 🛠️ Development

### Running in Development

```bash
npm run tauri dev
```

This starts both the Vite dev server and the Tauri application with hot-reload.

### Building for Production

```bash
npm run tauri build
```

Builds are output to `src-tauri/target/release/bundle/`:
- **Windows**: `.msi` and `.exe`
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb`, `.rpm`, and `.AppImage`

### Frontend Only (Web)

```bash
npm run dev
```

The app works as a web app too, using mock data when Tauri isn't available.

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color scheme:

```js
colors: {
  felt: { ... },  // Table felt greens
  gold: { ... },  // Accent gold
}
```

### Blind Templates

Edit the templates in `src/components/Blinds.tsx`:

```typescript
const templates = {
  turbo: [...],
  regular: [...],
  deep: [...],
}
```

## 📝 License

MIT License - feel free to use this for your home games!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📋 Changelog

### v1.1.0
- **🌍 Multilingual Support** - Full internationalization (i18n) with 6 languages
  - English, Spanish, German, French, Portuguese, Icelandic
  - Language selector in Settings
  - All UI components translated
- **🔄 Auto-Update** - Built-in update notifications and installer
  - Automatic version checking via GitHub Releases
  - One-click download and install updates
  - Signed builds for security
- **🔗 Website Link** - Quick access to pokerpulsepro.com from About dialog
- **📁 Custom Blind Templates** - Save, manage, and share blind structures
  - Save current structure as a reusable template
  - Import/Export templates as JSON files
  - "My Templates" library for quick access
  - Active template indicator with one-click clear
  - Improved drag & drop visual feedback with accent color
- **📺 Projector Mode** - Second screen support for TV/projector display
  - Open dedicated display window for large screens
  - Giant timer readable from 50+ feet
  - Syncs automatically with main control window
  - Fullscreen support on secondary monitors
  - Shows blinds, players, prize pool, and next level
  - Running/paused indicator visible to all players

### v1.0.0
- Initial release with timer, blinds, players, and prizes
- **🔊 Sound Alerts** - Configurable audio alerts between blind levels
- **💾 Auto-Save** - Tournament progress automatically saved
- **➕ Add-on Support** - Full add-on tracking alongside rebuys
- **🖥️ Fullscreen Mode** - Native fullscreen support via Tauri window API
- **📊 Enhanced Timer Display** - Larger fonts with key stats always visible
- **🎨 Theme System** - Light/Dark mode with 6 accent colors
- **📚 Help Page** - Poker hand rankings reference
- **⌨️ Keyboard Shortcuts** - Space, arrows, +/-, F, Escape
- **🔔 Warning Sounds** - Beeps at 60s and 30s before level change
- **⏸️ Auto-pause on Breaks** - Timer pauses automatically during breaks
- **🔀 Drag & Drop Blinds** - Reorder levels by dragging
- **📤 Export/Import** - Save and load tournament configurations
- **📜 Tournament History** - Log of completed tournaments
- **📤 Export/Import** - Save and load tournament configurations
- **📜 Tournament History** - Log of completed tournaments
- **🪟 Custom Modal Dialogs** - Beautiful themed dialogs

---

Built with ❤️ for poker enthusiasts
