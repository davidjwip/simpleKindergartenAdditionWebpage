# Math Practice for Kids

A fun, interactive web application for children to practice addition and subtraction math problems. Built with **Vue 3 + Vite**.

## Features

- **Addition & Subtraction**: Toggle between + and − operators
- **Multiple Difficulty Levels**: Practice with numbers up to 10 or 20 (toggleable checkbox)
- **Interactive Touchpad**: Click number buttons to fill in answers (no keyboard needed!)
- **Smart Problem Generation**: One field is randomly hidden, user must solve for it
- **Progress Tracking**: Track solved problems with visual goal path to next celebration
- **Auto-Advance**: New problem loads automatically after 2 seconds on correct answer
- **Streak Counter**: Build and track streaks with rotating feedback messages
- **Celebration Overlay**: 🎉 Reward screen + score reset every 10 correct answers
- **Sound Effects & Speech**: Cheerful sounds on correct answers, optional speech feedback (with mute toggle)
- **Personalization**: Set your name and choose a mascot from 8 options (🦊🐱🐶🐰🦁🐼🚀🦄)
- **Responsive Design**: Works on desktop and mobile devices

### Future Ideas (deferred)

- **Adaptive Difficulty**: Auto-adjust number limits based on performance
- **Picture/Real-World Questions**: Visual problem representations for concrete learning

## How to Run

This is a modern Vite build — it must be **served***, not opened directly from disk.
(Browsers block `file://` loading of ES modules via CORS, so double-clicking
`index.html` will not work.)

```bash
npm install        # first time only
npm run dev        # start the development server, then open http://localhost:5173
```

### Production build

```bash
npm run build      # outputs optimized files to dist/
npm run preview    # serve the production build locally
```

## How to Use

1. Open the dev server URL (or the deployed site)
2. Choose your operator (+ or −)
3. Toggle between limit 10 and limit 20 using the "Limit to 20" checkbox
4. Click numbers on the touchpad to fill in the empty field
5. The game auto-checks your answer and advances after 2 seconds
6. Track your progress in the progress bar

## Testing

Run the test suite with Vitest:

```bash
npm test           # runs tests once
npm run test:watch # optional: watch mode
```

**27 tests** across 3 files:

| File | Tests | Covers |
|---|---|---|
| `test/mathEngine.test.js` | 10 | Pure problem generation (+, −, limits 10 & 20), random field distribution, `evaluateAnswer` logic |
| `test/useMathGame.test.js` | 20 | Composable state, timer crash regression, auto-advance, progress counts, celebration trigger, streak tracking, rotating messages |
| `test/App.test.js` | 6 | Mounted `App.vue` rendering, touchpad size changes, first-empty-field fill, goal track, settings button |
| `test/useAudioFeedback.test.js` | 5 | Sound effects composable - no errors thrown, mute toggle |
| `test/usePreferences.test.js` | 5 | Preferences composable - name/mascot, default values |

## Deploying to GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys
automatically. Every push to `main` runs the tests, builds with Vite, and
publishes `dist/` to GitHub Pages.

### One-time setup

1. In GitHub repo → **Settings → Pages**, set **Source** to **"GitHub Actions"**
2. Push/merge your changes to `main`
3. The site appears at `https://<username>.github.io/<repository>/`

To make builds work from that subpath, `vite.config.js` sets `base: './'`,
so all asset URLs in `dist/index.html` are relative.

## Project Structure

```
simpleKindergartenAdditionWebpage/
├── index.html              # Vite entrypoint (mounts #app)
├── vite.config.js          # Vite/Vitest config (base './', vue plugin)
├── package.json            # Scripts & dependencies (vue, vite, vitest)
├── .github/workflows/      # GitHub Actions (Pages deploy)
├── src/
│   ├── main.js             # App bootstrap
│   ├── App.vue             # Single-file UI component
│   ├── useMathGame.js      # Reactive game state composable (no DOM)
│   ├── mathEngine.js       # Pure, framework-free math logic (testable)
│   └── style.css           # Global styles + responsive + celebration CSS
├── test/
│   ├── mathEngine.test.js  # Pure logic unit tests
│   ├── useMathGame.test.js # Composable/logic tests (fake timers)
│   └── App.test.js         # Mounted component tests (@vue/test-utils)
├── AGENTS.md               # Development guidelines
├── README.md               # This file
├── test-plan.md            # Testing plan
├── test-gaps-analysis.md   # Test coverage analysis
└── testing-summary.md      # Testing summary/results
```

## Architecture

The project uses a layered architecture that keeps logic testable:

- **`mathEngine.js`** — pure ES-module functions (generate, evaluate).
  No DOM, no framework; unit-testable in isolation.
- **`useMathGame.js`** — Vue composable holding all reactive game state and
  timer-driven auto-advance. Performs *no* direct DOM manipulation, so the
  logic (including the timer crash-regression) is unit-testable without a browser.
- **`App.vue`** — thin rendering layer; binds state from the composable to
  the template and forwards user actions back into it.

This separation means the game logic is fully covered by Node-side Vitest
tests, while mount-level tests verify the UI wiring.

## Bug Fix History

- **Mobile crash regression** — generation guard (`isGenerating`) + centralized
  `clearTimer()` prevent infinite loops / timer accumulation that crashed mobile browsers.
- **Answer logic** — correct answer evaluation regardless of which field is
  left blank; zero is valid; blank/incomplete input returns "Please fill in all fields!".
- **Progress tracking** — attempts (`totalProblems`) vs solved counted correctly.

## License

© 2026 David Ip. Created for George and Teddy Ip.
All rights reserved.

For educational use only.
