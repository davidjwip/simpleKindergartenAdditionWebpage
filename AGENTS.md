# AGENTS.md

## Project Structure
- `index.html` - Vite entrypoint (mounts `#app`); loads `src/main.js` via relative path
- `vite.config.js` - Vite + Vitest configuration (`base: './'` for GitHub Pages subpath hosting)
- `package.json` - Scripts and dependencies (Vue 3.4, Vite 5, Vitest, @vue/test-utils, happy-dom)
- `src/main.js` - App bootstrap (`createApp(App).mount('#app')`)
- `src/App.vue` - Single-file UI component (rendering only; no logic)
- `src/useMathGame.js` - Vue composable: all reactive game state, timer logic, input locking (no direct DOM)
- `src/mathEngine.js` - Pure, framework-free math logic (generation + evaluation)
- `src/style.css` - Global styles, responsive breakpoints, celebration overlay, touchpad disabled state
- `test/mathEngine.test.js` - Unit tests for pure logic (10 tests)
- `test/useMathGame.test.js` - Composable/logic tests with Vitest fake timers (26 tests)
- `test/App.test.js` - Mounted component tests via @vue/test-utils (15 tests)
- `test/useAudioFeedback.test.js` - Audio feedback composable tests (8 tests)
- `test/usePreferences.test.js` - Preferences composable tests (8 tests)
- `.github/workflows/deploy.yml` - GitHub Actions: test + build + publish `dist/` to Pages
- `README.md`, `test-plan.md`, `test-gaps-analysis.md`, `testing-summary.md` - Documentation

## Development Commands
```bash
npm install        # install dependencies (first time)
npm run dev        # start Vite dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm test           # run Vitest test suite once
```

## Test Commands
- **Vitest suite**: `npm test` (67 tests, 5 files)
  - `test/mathEngine.test.js` (10) - pure logic
  - `test/useMathGame.test.js` (26) - composable + timer regression, locked state (fake timers)
  - `test/App.test.js` (15) - mounted component
  - `test/useAudioFeedback.test.js` (8) - audio feedback composable
  - `test/usePreferences.test.js` (8) - preferences composable
- Vitest runs in the `happy-dom` environment (configured in `vite.config.js`).

## Important Constraints
- **Do NOT open `index.html` directly via `file://`** — browser CORS blocks ES
  modules. Always serve via `npm run dev` / `npm run preview` / a web server.
- **Keep `vite.config.js` `base: './'`** — relative assets are required for the
  GitHub Pages subpath deployment.
- **Keep `index.html` script src relative** (`./src/main.js`) so Vite resolves it.

## Logic Reference
The application supports:
- Addition and subtraction problems
- Number limits of 10 or 20 (toggleable via "Limit to 20" checkbox)
- Random problem generation with exactly one missing value (field chosen randomly)
- No consecutive duplicate questions (same num1, num2, answer values)
- Progress tracking (solved vs total attempts) and visual feedback
- Auto-advance to next problem after 2 seconds on correct answer
- 1.5 second regeneration after an incorrect answer
- Celebration overlay + score reset every 10 solved problems
- **Input protection**: Touchpad is disabled during auto-advance/retry delays
- **Subtraction safety**: Answers are always ≥1 (no zero answers)

## File Descriptions
### src/mathEngine.js
Pure ES-module functions — NO DOM, NO Vue imports:
- `generateNumbers(maxLimit)` - random `{ num1, num2 }` in `[1, maxLimit]`
- `generateAddition(maxLimit)` - valid addition with `num1 + num2 <= maxLimit`
- `generateSubtraction(maxLimit)` - valid subtraction with `answer >= 1`
- `pickRandomField()` - returns `0` (num1), `1` (num2), or `2` (answer)
- `evaluateAnswer(val1, val2, answerVal, operator)` - returns `true` / `false`, or `null` for invalid input
- Test helpers: `testAddition`, `testSubtraction`, `testRandomField`

### src/useMathGame.js
Vue composable holding all reactive state. No direct DOM manipulation.
Exposes refs: `num1`, `num2`, `answer`, `operator`, `feedback`, `feedbackColor`,
`problemsSolved`, `totalProblems`, `progressPercent`, `isAdd`, `maxLimit`, `isLocked`.
Exposes actions: `generateNewProblem`, `checkAnswer`, `fillValue`, `setOperator`,
`setMaxLimit`, `resetProgress`, `setProgressCallback`.
Internal guards: `touchpadTimer` + `isGenerating` prevent multi-timer accumulation
(the mobile crash regression fix), `isLocked` disables touchpad during delays,
and `lastProblem` tracking prevents consecutive duplicate questions.

### src/App.vue
Single-file component. Binds composable state to template, renders:
- Header with "How to Use" collapsible instructions panel
- Equation with three readonly inputs (one blank)
- Touchpad grid (1..maxLimit), rebuilds on limit change, disabled during delays
- Operator toggle buttons (visual active state)
- Progress bar + solved/total stats
- "Path to the Party" layout: mascot on left, numbers 1-5/6-10 on two rows, celebration on right
- Celebration overlay (once per 10 solved, then resets score)
- No mobile keyboard triggered (inputs are readonly)

### test/useMathGame.test.js
Timer regression tests ported from the original Node suite. Uses
`vi.useFakeTimers()` to verify:
- Exactly one timer queued after a correct answer
- No timer accumulation on rapid interactions
- Auto-advance produces a solvable new problem with exactly one blank
- Incorrect answer schedules a regeneration after 1500ms
- Pending correct-answer timer is cleared when answering again
- Progress counters and celebration (10-solved) behavior
- Consecutive duplicate prevention
- `isLocked` state behavior (enabled during delays, disabled when generating new problem)

## Current State
- Architecture: Vue 3 + Vite 5 (migrated from vanilla JS in `feature/vue-migration`)
- Tests: 67 Vitest tests, 5 files — all passing
- Deployment: GitHub Actions workflow; `base: './'` for GitHub Pages
- Default: Limit 10 (checkbox unchecked), limit 20 when checked
- **Recent fixes**:
  - `base: './'` + relative `./src/main.js` so builds deploy to GitHub Pages subpath
  - Mobile crash regression addressed in composable (generation guard + timer dedup)
  - Answer evaluation logic handles all field positions, zero as valid answer
  - Progress tracking counts attempts (`totalProblems`) vs solved (`problemsSolved`)
  - Consecutive duplicate questions prevented with `lastProblem` tracking
  - Subtraction answers always ≥1 (num2 in [0, num1-1])
  - Input protection with `isLocked` flag disables touchpad during delays
  - "Path to the Party" layout with two rows of numbers for better small-screen layout
