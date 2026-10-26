Model: deepseek-v4-flash (DeepSeek, via Hermes Agent). Target: `maths.zt489.com` / `simpleKindergartenAdditionWebpage` @ `fc1f967`, clone `/opt/data/cache/scratch/kgadd`, left unmodified (`git status --short` empty afterwards).

# App audit — existing drill vs early-years pedagogy

## 1. How the audit was run

Read all six files in `src/` (including `style.css`), `index.html`, `vite.config.js`, `package.json`, `README.md`, `AGENTS.md`, the deploy workflow, and all five test files. Ran the repo's own commands unmodified on Node v26.7.0 — out of contract, since `.nvmrc` pins 24.22.1 — and both passed. Then wrote three read-only probes under `/opt/data/cache/scratch/kgadd-probe/` that import the real `src/mathEngine.js` (200,000 draws per limit per operator; nothing reimplemented by hand). The live site serves `assets/index-Bw5nU7hI.js`, the same filename the local build produced, so HEAD is deployed; the response carries no CSP.

**`npx vitest run`** (tail, unedited):

```
 ✓ test/usePreferences.test.js  (8 tests) 10ms
 ✓ test/App.test.js  (15 tests) 929ms

 Test Files  5 passed (5)
      Tests  70 passed (70)
   Start at  13:44:10
   Duration  2.37s (transform 364ms, setup 73ms, collect 742ms, tests 1.07s, environment 2.49s, prepare 962ms)
```

The run also emits dozens of `[Vue warn]: onMounted is called when there is no active component instance…` lines — both preference composables load state in `onMounted`, so outside a component they silently never rehydrate.

**`npx vitest run --coverage`** (coverage block, unedited):

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   95.41 |    87.22 |   82.14 |   95.41 |                   
 App.vue           |   96.69 |    85.93 |    57.14 |   96.69 | ...21-123,287,295 
 mathEngine.js     |   96.07 |    91.66 |     87.5 |   96.07 | 9-12              
 ...dioFeedback.js |    93.1 |    86.48 |      100 |    93.1 | ...99-100,110-111 
 useMathGame.js    |   97.62 |    87.23 |      100 |   97.62 | 147,149,165-168   
 usePreferences.js |    86.9 |      87.5 |      100 |    86.9 | 30-40             
-------------------|---------|----------|---------|---------|-------------------
```

**`npm run build`**:

```
npm notice run math-game-vue@0.1.0 build
npm notice run vite build
vite v5.4.21 building for production...
transforming...
✓ 14 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  1.88 kB │ gzip:  1.04 kB
dist/assets/index-Bmn5bopF.css  10.00 kB │ gzip:  2.38 kB
dist/assets/index-Bw5nU7hI.js   77.52 kB │ gzip: 30.43 kB
✓ built in 1.02s
```

Coverage is high but pedagogically blind: the tests are thorough on mechanics (timer counts, lock state, counters) and assert nothing about item sequencing or what a wrong tap teaches.

## 2. Design-decision inventory

**(→ evidence doc)** flags judgements that code cannot settle.

| # | Decision (where) | Call | Rationale |
|---|---|---|---|
| 1 | One screen, equation + keypad, no navigation (`App.vue:252-278`) | helps | Nothing to get lost in; task always visible. |
| 2 | `+ / −` toggle in header (`App.vue:153-164`) | neutral | Adult control placed out of a child's reach — a setting, not a choice. |
| 3 | Limit 5–20, default 10, applied to operands *and* answer (`mathEngine.js:14-21`) | neutral | "Up to 10" means *sums* to 10; keeps one decade but makes 10 the commonest answer. |
| 4 | One of a/b/result blank, uniform 1/3 (`useMathGame.js:118`) | **hurts** | 66.75% of items demand a missing operand — inverse reasoning, not result-unknown. (→ evidence doc) |
| 5 | One tap auto-submits (`useMathGame.js:143-154`) | **hurts** | Mis-tap on a 20-button grid is scored as a misconception, with no undo. |
| 6 | Correct → chime + 2 s → next (`useMathGame.js:16,186`) | helps | Immediate, contingent, brief. |
| 7 | Wrong → buzz + 1.5 s → **new** item (`useMathGame.js:17,200-202`) | **hurts** | Discards the child's own wrong answer — the one moment with teaching value. |
| 8 | Wrong copy says "Try again!" / "have another go!" (`useMathGame.js:42`) | **hurts** | Promises a retry the code refuses. |
| 9 | Streak resets to 0 on any wrong (`useMathGame.js:194`) | **hurts** | One slip erases everything accumulated; rewards caution over thinking. |
| 10 | `Best: N` second counter (`App.vue:286-288`) | hurts | Adds a comparison at the moment the first number collapsed. |
| 11 | Mascot rendered only when `streak > 0` (`App.vue:294`) | **hurts** | The child's chosen character vanishes on the first mistake. |
| 12 | 10-correct celebration, then progress reset (`App.vue:119-137`) | helps | Short, concrete goal with a real ending. |
| 13 | "Path to the Party" 10 steps (`App.vue:291-312`) | helps | Countable progress beats an abstract number (but see D4). |
| 14 | "Problems Solved: X / Total Problems: Y" (`App.vue:313-316`) | **hurts** | Exposes error count as a fraction that never reaches 1; 6/9 reads as failure. |
| 15 | Keypad 1…limit, no 0 (`App.vue:269`) | neutral | Correct — zero is never an operand or answer. Removes the "nothing left" idea. (→ evidence doc) |
| 16 | Up to 20 buttons in a 5-wide phone grid (`App.vue:267`) | hurts | ~55 px targets, one tap, no undo. |
| 17 | Numerals only, no quantity model (`App.vue:253-259`) | **hurts** | Pure symbol manipulation; nothing represents "six things". (→ evidence doc) |
| 18 | Chimes only, no spoken prompt, no replay (`useAudioFeedback.js:22-101`) | hurts | A pre-literate child cannot hear the problem or ask for it again. (→ evidence doc) |
| 19 | Name + mascot in `localStorage` (`usePreferences.js:65-72`) | helps | Ownership and continuity, near-zero cost. |
| 20 | Subtraction excludes 0 operands, 0 answers, `a=1` (`mathEngine.js:23-30`) | helps | No degenerate items; every item has a take-away story. |
| 21 | Read-only `<input>`s, no `aria-live` on feedback (`App.vue:254-262`) | hurts (accessibility) | Screen readers announce nothing; tapping the blank box does nothing. |
| 22 | No countdown, no session length, no hint path (`App.vue`) | helps + hurts | No time pressure, but a stuck child's only move is a guess — and guesses are scored. |

## 3. Constraint-logic verification

| Check | Result |
|---|---|
| Blank position uniform | **Yes.** 300,000 items: num1 100,139 (33.38%), num2 100,107 (33.37%), answer 99,754 (33.25%). |
| Limit on operands *and* results | **Yes.** Addition sums ∈ [2,10], zero over-limit; subtraction `num1 ≤ limit`, answers ∈ [1,9]. |
| Zero excluded | **Yes, structurally.** Zero operands 0/600,000; zero results 0/600,000; zero never required in 300,000 blanks. The missing 0 key is consistent, not a gap. |
| Degenerate `5−5=?` | **Impossible.** `num2 = floor(r·num1) ∈ [0, num1−1]`, 0 rejected ⇒ `num1 > num2` always (0 violations in 600,000). |
| Blank needing > limit or 0 | **Never.** Required values span 1…limit. |
| Blank ever asks the *larger* operand? | **Yes** — every subtraction with num1 blank, e.g. `? − 2 = 3`: 16.64% of all items, solved by adding two visible numbers, an operation not in the selected mode. |
| Result-unknown vs missing-operand | **33.25% / 66.75%.** Per shape: `?+b=c` 16.73, `a+?=c` 16.72, `a+b=?` 16.54, `?−b=c` 16.64, `a−?=c` 16.65, `a−b=?` 16.71 (%). |
| Addition answer distribution (limit 10) | Triangular, modal at ceiling: `2:2.21 3:4.42 4:6.60 5:9.02 6:11.03 7:13.30 8:15.62 9:17.84 10:19.96` (%). The hardest item is the commonest; `1+1` is 2.2%. |
| Subtraction answer distribution | Skewed to "take away one": limit 10 → `answer==1` 27.28%, `==2` 20.26%; limit 5 → 47.29% / 28.88%. |
| Repeat suppression | Compares numbers only, not the blank (`useMathGame.js:110-114`), so the *same printed equation* can recur with a different box blank. |
| Wrong → new question (not retry) | Confirmed in code and by `schedules a regeneration after an incorrect answer` (`test/useMathGame.test.js:103`). |
| Engine terminates out of contract | **No.** `timeout 8 node probe-limit.mjs add 1` → `exit=124`; same for `sub 1`. `generateAddition(1)` spins forever (`mathEngine.js:16-19`). |

## 4. Defects

1. **`useMathGame.js:42` vs `:200-202`** — "Try again!" shown while the item is discarded. Copy contradicts behaviour; high impact, it is the main wrong-answer sentence.
2. **`mathEngine.js:16-19, 25-28`** — unbounded `do…while`; limit < 2 never returns (verified `exit=124`). `setMaxLimit` (`useMathGame.js:211-214`) doesn't clamp, so safety rests entirely on the UI.
3. **`usePreferences.js:35` + `App.vue:50-52`** — corrupt stored limit yields `NaN` (`Math.min(Math.max(NaN,5),20)` is `NaN`), the `!== 10` test passes, `v-for="n in maxLimit"` renders **zero** buttons: unplayable until storage is cleared.
4. **`App.vue:299,304`** — track fill uses `problemsSolved % 10`, so step 10 never lights; the bar is empty exactly at celebration.
5. **`App.vue:294`** — mascot unmounts when `streak` hits 0, i.e. on the first wrong answer.
6. **`App.vue:119-124` + `useMathGame.js:186`** — celebration doesn't clear the pending 2 s timer, so an item is generated behind the overlay and thrown away; `App.vue:96-101` also generates twice per limit save (direct call plus the `prefsMaxLimit` watcher).
7. **`App.vue:313-316`** — the accuracy fraction is the only progress number and resets at each celebration; no whole-session picture exists.
8. **`mathEngine.js:45`** — `isNaN('')` is `false`, so `evaluateAnswer('',4,7,'+')` returns `false`, not the documented `null` (README:141); the "Please fill in all fields!" branch (`useMathGame.js:164-168`) is unreachable that way, since the app passes `parseInt` output (`NaN`).
9. **`test/App.test.js:216,229`** — the celebration trigger has no end-to-end test: those tests set `celebrationVisible` directly instead of answering ten items (`App.vue` functions 57.14%). (The uniform-blank test is fine: `testRandomField(1000)` allows 20% of the expected count — 333 ± 67 — so it would reject a 250/400/400 split.)
10. **`App.vue:320`** — footer hard-codes two real first names of the developer's children in a public repo (not transcribed here); remove before wider sharing.
11. **`index.html:26-30`** — beacon posts `{v: <uuid>, h: hostname, p: pathname}` to `games.zt489.com/api/hit` via `sendBeacon`, id in a `.zt489.com` cookie. No input or page content, so not a privacy breach in substance; correctness is weaker: the id is a JavaScript-set first-party cookie, so Safari's ITP caps its lifetime (≈7 days) and `v` rotates, defeating the "count the same child once" rationale; it fires on every load, there is no opt-out, and the live response carries no CSP.
12. **`useMathGame.js:37`, `usePreferences.js:65-72`** — `bestStreak` and history aren't persisted; a reload resets the child's record.
13. **`App.vue:16` (`progressPercent`), `App.vue:42` (`getRandomName`)** — imported, never used; dead surface implying features that don't exist.
14. **`style.css` (no `:focus-visible`)** — keyboard focus invisible on the keypad.

## 5. Highest-leverage changes

1. **Default to result-unknown** (`a + b = ?`); make missing-operand a separate later mode. One change moves 66.75% of items into the form the child is actually practising, without touching the engine's guarantees.
2. **Wrong → same item, not a new one.** Lock it, hold ~1.5 s, allow one retry, then reveal the completed equation ("3 and 4 make 7") and advance. The discarded moment is the whole teaching opportunity.
3. **Make the streak non-punitive**: hide it or count "best today" without a visible collapse, and keep the mascot on screen through mistakes.
4. **Fix the progress surface**: drop the `X / Y` fraction, let the 10-step track visibly complete, keep counts from resetting mid-celebration.
5. **Close the wedged-state class**: clamp in `setMaxLimit`, guard `limit < 2` in both generators, reject non-finite stored limits.
6. **Open a second channel**: dots or tallies under each numeral, plus an optional spoken prompt with replay (→ evidence doc).
