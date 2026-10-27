# Spec — equation form and unknown position ("Find the total" / "Find the missing part" / "Find what we started with")

*Buildable spec for the mode feature in improvement-plan.md increments 3–5. No code here; behaviour, data model, state machine, tests. The target child is four, comfortable with addition and result-unknown subtraction, and stuck on `? − b = c`. House constraints: no external services, no child data beyond localStorage, design language of `src/style.css` unchanged, "a four-year-old" — never a name — in anything committed.*

## 1. Domain: the three unknown positions

| Position | Printed form | What it asks | Child's task name | Developmental order |
|---|---|---|---|---|
| Result unknown | `a + b = ?`, `a − b = ?` | "What do you get?" — put together or take away, then count | **Find the total** (covers both; for subtraction read as "what's left") | First. Answerable by count-on from a shown start; Baroody Phase 1 reachable |
| Part unknown | `a + ? = c`, `? + b = c`, `a − ? = c` | "What part is missing?" — hold the whole and one part, find the other | **Find the missing part** | Second. Unknown-addend reasoning; "the most WM-intensive" decomposition shape (Ramirez et al. via arithmetic-learning-evidence.md §3) |
| Start unknown | `? − b = c` | "What did we start with?" — the minuend is never shown; must be reconstructed | **Find what we started with** | Last. Hardest form in the set; requires holding a start that appears nowhere on screen |

**Citation trail.**
- Composition within 10 as the foundation: EDB Explanatory Notes 1N1 ("foundation knowledge for performing addition with carrying and subtraction with borrowing in the future"); EYFS ELG Number ("deep understanding of numbers to 10, including the composition of each number"); Singapore NEL Learning Goal 3.8 ("Name the parts that form the whole in a quantity of up to 10").
- Result-unknown before unknown-in-any-position: CCSS K.OA keeps kindergarten at result-oriented word problems and reserves "unknowns in all positions" for Grade 1 (1.OA.A.1, 1.OA.D.8, example `5 = _ − 3`); England's missing-number problems (`7 = ? − 9`) are Year 1 (international-comparison.md §1.2, §2.2).
- Start-unknown as the hardest: the Common Core progression ("Subtraction comes to be understood as reversing the actions involved in addition and as finding an unknown addend", CCSS Writing Team 2011, cited in arithmetic-learning-evidence.md §3) plus working-memory load (Diamond 2013, evidence §5). The evidence doc flags that no study measures the difficulty gap below age six — the ordering here is inference from those two sources plus the owner's live observation, stated as such.
- Currently these positions are equiprobable: uniform blank, 33.25% result / 66.75% operand, and `? − b = c` alone is 16.64% of all items (app-audit.md §3, 300,000-draw probe).

## 2. Modes as the child experiences them

| | **Find the total** (`result`) | **Find the missing part** (`part`) | **Find what we started with** (`start`) |
|---|---|---|---|
| Mode id | `result` | `part` | `start` |
| Screen | Equation with the answer box showing `?`; optional countable dot rows under both shown numerals (Increment 7) | Equation with one operand box showing `?`; part-whole bar below: whole row of c dots, known part pre-filled in teal, gap for the missing part | Equation `? − b = c`; part-whole bar below with a visible "put back" group (§3) |
| What the child does | Count or recall, tap the answer key | Count the gap on the bar (or recall), tap the key | Tap the taken-away group to "put it back", count the full row, tap the key |
| What the adult sets | Mode picker in the settings panel (👤), three radio options in the child's words above; plus operator (+/−) and limit as today | same | same; this mode forces the counters on (they are the teaching, not an option) and caps its limit at 10 |
| Remembered between sessions | Yes — mode persists in `mathGame.preferences` (§7) | Yes | Yes, including counters-on |
| Default | **`result`** — fresh installs and migrated installs alike | Off until adult selects | Off until adult selects |

Mode switching is one mode at a time. There is no "mixed" option in this spec: the uniform random blank it would replace is the exact defect being removed (audit decision #4). A mixed/review mode is a candidate for a later increment, after measurement (improvement-plan §6).

## 3. Teaching `? − b = c`, not merely asking it

A four-year-old facing `? − 3 = 4` with only numerals will count on from nothing or guess — there is nothing countable on screen (arithmetic-learning-evidence.md §2). The mode therefore carries its own representation, in the existing design language (cream panel, teal accents, no new palette).

**The representation.** Below the equation, a part-whole bar rendered as two dot rows inside a cream `#fff9c4` panel with the standard 3 px `#4ecdc4` border:

- **The "left" row**: c filled teal dots — the part that remains, always countable.
- **The "taken-away" row**: b ghost dots (outlined, hollow) shown *crossed or faded*, sitting to the right of the filled row, so the two rows together visibly total the unknown start.
- **The "put back" action**: the child taps the taken-away group. The ghost dots fill in (same teal), the two rows merge into one row of `?` length, and the equation's `?` box pulses — the child now counts the full row and taps the answer on the keypad.
- The action is a single tap. No dragging anywhere in this spec.

**Worked example, `? − 3 = 4`, limit 10.** Screen shows the equation; below it, 4 filled dots and 3 ghost dots. Feedback line says "3 were taken away. 4 are left. Put them back!" (copy in the child's task language, final wording a copy pass, never a name). Child taps the ghost group; the 3 fill; the row is 7 long; child counts to 7 and taps `7`. Correct: chime, the completed equation `7 − 3 = 4` flashes with the 7 highlighted in teal, normal 2 s advance.

**How the app marks it.** The put-back tap is optional, not required — the keypad is never gated on it. The app logs whether the put-back was used before the first answer tap (§6 of the plan: this is the strategy signal — falling put-back use with rising first-try accuracy is the counting→recall transition for this mode). Marking itself is unchanged: keypad tap submits, correct/wrong per the state machine in §5.

**Wrong-answer reveal for this mode (the teaching moment).** On a second wrong tap, the reveal does the put-back itself: ghost dots animate to filled, the full row counts itself (dots pulse left to right), and the completed equation appears — "? − 3 = 4" becomes "**7** − 3 = 4", with the spoken-equivalent copy "We started with 7. Take away 3, 4 are left." The reveal holds ~2.5 s (longer than the correct-answer 2 s, because it is doing work), then advances.

**Constraints on items in this mode.** Same engine guarantees as today: no zero anywhere, `num1 > num2`, limit applies to operands and answer — so `? − b = c` items have `? ≤ limit`, the answer always on the keypad (keypad is 1..limit, no zero, correct by design per audit §3). At limit 5 the mode yields items like `? − 2 = 3` (`? = 5`). **This mode caps its own limit at 10**: while `start` is selected the limit picker greys out 15 and 20, so the put-back row is always a single countable row of ≤10 dots. A wrapped 20-dot row would require the child to compose a ten and a remainder — the skill still being taught — and it contradicts both the plan's default ceiling and the evidence that sums to 20 invite guessing. The stored preference is not overwritten by the cap: leaving the mode restores the adult's limit.

## 4. Data model and state machine

### Item shape (mathEngine must return)

Today `generateAddition`/`generateSubtraction` return `{ num1, num2, answer }` and `pickRandomField()` decides the blank at random in `useMathGame.js`. New contract:

```
generateProblem(operator, limit, mode, step) → {
  num1, num2, answer,        // full solution, as today
  operator: '+' | '-',
  blankField: 'num1' | 'num2' | 'answer',   // decided by MODE, never random
  mode: 'result' | 'part' | 'start'
}
```

`step` ∈ `'1'` · `'2'` · `'3-5'` · `'any'` is a **generation parameter, not item data**: it constrains
`num2` for `+`/`−` and the larger operand for `part`/`start`, and it is recorded on the per-item log
entry beside `limit` and `mode`. It is deliberately absent from the returned object — the item already
carries `num2`, so a field would be a second copy of the same fact, free to drift. The default is
`'any'` on every install; a personalised default would ship one child's diagnosis to every user.

Mode → blank mapping:

| mode | operator | blankField |
|---|---|---|
| `result` | + or − | `answer` always |
| `part` | + | `num1` or `num2`, alternated/random 50-50 (same task either way) |
| `part` | − | `num2` only (`a − ? = c`) — `? − b = c` is **not** this mode |
| `start` | − only | `num1` only |
| `start` | + | **n/a — mode unavailable under +**; the mode picker greys out "find what we started with" when operator is +, with one line of copy ("that one's a take-away game") |

`pickRandomField()` is retained for the legacy default path during migration only and is removed once mode selection is the only caller. `evaluateAnswer` is unchanged in shape — it already checks the full triple — but gains the documented `null` on empty input (defect D8, closed in increment 1).

### Wrong-answer state machine (all modes)

```
IDLE ──tap──> CHECKING
CHECKING ──correct──> CORRECT ──2 s timer──> NEXT
CHECKING ──wrong, attempt 1──> HOLD(1.5 s, keypad locked, item unchanged)
HOLD ──timer──> RETRY (keypad re-arms, same item, blank field reset to `?` so the wrong digit is not retained)
RETRY ──correct──> CORRECT (counts as solved; logged as first-try=false)
RETRY ──wrong──> REVEAL (completed equation +, in mode 'start', the put-back animation)
REVEAL ──2.5 s──> NEXT (logged as missed)
```

Properties: at most two scored taps per item; the item never changes under the child between taps, **and the blank field is cleared on entering RETRY** — without that, `fillValue`'s "first empty field" rule writes the retry into a different box and silently corrupts the item on every operand blank (all `part` and `start` items); the keypad stays locked through REVEAL and a third tap is ignored; any pending timer is cleared on mode change, limit change, operator change, or celebration (defect D6 discipline). The `putBackUsed` flag lives on the per-item log entry, never on the item shape: `true` when the child taps the put-back before the first answer tap, `false` when the reveal performs it or the child never taps it. The "correct answer" when the blank is not the result is the **full solution triple** — the reveal always completes the printed equation (e.g. "**7** − 3 = 4"), never just speaks a number.

## 5. Acceptance criteria (Given/When/Then)

### Mode `result` (default)
1. Given a fresh or migrated install, when the app loads, then every item blanks only the answer across both operators.
2. Given 200 generated items at limit 10, when blankField is tallied, then 100% are `answer` and all engine invariants hold (no zero, `a > b` for −, answer ≤ limit).

### Mode `part`
3. Given mode `part` and operator +, when 200 items generate, then blanks are `num1` or `num2` only, and the shown answer equals the sum.
4. Given mode `part` and operator −, when 200 items generate, then no item blanks `num1`.
5. Given any `part` item, when the child taps the bar's gap count correctly on the keypad, then the item scores as correct.
6. Given a wrong first tap, when 1.5 s passes, then the same printed equation remains and the keypad re-arms once.
7. Given a wrong retry, when the reveal shows, then the equation completes ("4 and 3 make 7" copy; bar gap fills).

### Mode `start`
8. Given mode `start` and operator −, when items generate, then every item is `? − b = c` with `? ≤ limit`, `b ≥ 1`, `c ≥ 1`.
9. Given a `start` item, when the child taps the taken-away dot group, then the ghost dots fill and the row length equals the required answer — with no keypad input yet accepted or required.
10. Given the put-back has been tapped, when the child taps the correct key, then the item scores correct and is logged with `putBackUsed: true`.
11. Given the put-back was never tapped and the first tap is correct, when logged, then `putBackUsed: false`.
12. Given a wrong retry in mode `start`, when the reveal plays, then the put-back animates, the completed equation highlights the start value, and the item is logged missed.
13. Given operator + is active, when the adult opens the mode picker, then "find what we started with" is disabled with its one-line explanation.

### Boundary cases
14. **Limit 5, mode start:** items like `? − 2 = 3` render 2 ghost + 3 filled dots; no item requires a key above 5.
15. **Limit 10, mode start:** put-back row wraps at 10; the largest answer (10) is reachable on the keypad.
16. **No zero:** across all modes and 1,000 generated items, no zero appears as operand, answer, blank value, or keypad key.
17. **Degenerate items:** no `a − a`, no `1 − b` (engine's existing `num1 === 1` guard holds in all modes).
18. **Mode change mid-round:** Given any item on screen, when the adult changes mode, then timers clear, the current item is discarded unscored, and a new item generates in the new mode.
19. **Mode change during the 2 s advance:** Given a correct answer with the advance timer pending, when the adult changes mode before it fires, then the timer is cancelled and exactly one new item generates in the new mode (no discarded phantom item — the defect-D6 class).
20. **Mode change during HOLD/RETRY/REVEAL:** same as 18 — the state machine resets to IDLE in the new mode and the abandoned item is not written to the log at all.
21. **Stored corrupt mode:** Given localStorage with `mode: "banana"`, when the app loads, then mode is `result` and play proceeds (§7).
22. **Reveal never scores:** Given any mode, when a reveal has been shown and the next item appears, then `problemsSolved` is unchanged and the item is recorded as missed.
23. **Limit cap in `start`:** Given `start` is selected, when the adult opens the limit picker, then 15 and 20 are disabled with a one-line reason, and an install whose stored limit is 20 plays `start` at 10 without changing the stored preference on exit.
24. **Step ceiling:** Given step `1`, when items generate in every mode, then the added or taken-away number is exactly 1; given `3-5`, it is always 3, 4 or 5; given `any`, the distribution matches today's.
25. **Orthogonal knobs:** Given any item on screen, when the adult changes mode, then the step is preserved; when the adult changes step, then the mode is preserved; and no transition turns both at once.
26. **Stored corrupt step:** Given localStorage with `step: "banana"` or a missing field, when the app loads, then step is `any`.

## 6. Tests to write first, and coverage gates

Tests are written before code in each PR, in the repo's existing layout (Vitest + happy-dom, fake timers for the state machine).

**`test/mathEngine.test.js` (extend)**
- `generateProblem` returns `{num1, num2, answer, blankField, mode, operator}` for every (mode, operator, step) pair, and the returned object carries **no** `step` field (it is a generation parameter, logged separately).
- Mode→blank mapping per §4 table, incl. `part`/− never blanking `num1` and `start` never existing under +.
- Invariants sweep: 1,000 items per (mode, operator, step): no zero; limit respected on operands and answer; `num1 > num2` for −; blank value ∈ 1..limit (always keypad-reachable); and the step ceiling holds for `1` / `2` / `3-5` while `any` reproduces today's distribution.
- `generateProblem('+', limit, 'start')` throws or is uncallable.
- `evaluateAnswer('')` returns `null`.
- Generators terminate at limit < 2 (throw, bounded).

**`test/useMathGame.test.js` (extend)**
- Full state machine with fake timers: IDLE→HOLD→RETRY→CORRECT; IDLE→HOLD→RETRY→REVEAL→NEXT; retry-correct counts solved; reveal counts missed and never increments `problemsSolved`; item identity preserved between HOLD and RETRY.
- "a wrong first tap, then the retry, re-fills the original blank field and never overwrites another field" — the `fillValue` corruption guard.
- "a third tap during REVEAL does not change `problemsSolved`/`totalProblems`".
- Timer-clearing test observes generation count by spying on `generateProblem` (`vi.spyOn`) and asserts exactly one call after a mode change during the 2 s advance.
- Mode change clears all pending timers (advance, hold, reveal) and generates exactly one item.
- `putBackUsed` flag recorded both ways.
- Mode persists through the preferences seam; corrupt stored mode ⇒ `result`.
- Step persists through the same seam; absent or corrupt step ⇒ `any`; a step change regenerates exactly once and preserves the mode (the mirror of criterion 19).

**`test/usePreferences.test.js` (extend)**
- Migration: preferences without `mode` load as `result` and save back with `mode` present.
- Non-finite/corrupt `mode` and `maxLimit` rejected to defaults.
- `countersOn` round-trips; defaults false except forced-on in `start` mode.

**`test/App.test.js` (extend)**
- End-to-end celebration: answer ten items by computing each blank from the rendered `num1`/`num2`/`answer` inputs and the operator, advancing the fake 2 s timer after each correct tap before the next (closes audit D9; the existing tests set `celebrationVisible` directly — keep those, add the real path).
- Mode picker renders the three child-language options; `start` disabled under +.
- Dot rows render correct counts for the shown equation; put-back tap fills ghost dots; reveal path renders the completed equation.
- Step 10 of the progress track lights at 10 solved.
- `aria-live` region announces feedback (increment 8).

**Coverage gates (per file, all four measures).** These do not exist today: the current script sets *global* CLI thresholds, `vite.config.js` has no `coverage.thresholds`, and CI runs `npm test` with no coverage step. Increment 1 adds `coverage.thresholds` with `perFile: true` plus the per-file globs below to `vite.config.js`, drops the global CLI flags from the script, and adds `npm run test:coverage:threshold` to `.github/workflows/deploy.yml`. Prove the gate by adding a module with no tests and watching the run fail naming that file.

| File | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `src/mathEngine.js` | ≥95 | ≥90 | ≥90 | ≥95 |
| `src/useMathGame.js` | ≥95 | ≥90 | 100 | ≥95 |
| `src/usePreferences.js` | ≥90 | ≥85 | 100 | ≥90 |
| `src/App.vue` | ≥95 | ≥85 | ≥80 (raised from the current 57.14 by the new component tests, not by deleting functions) | ≥95 |
| `src/useAudioFeedback.js` | ≥90 | ≥85 | 100 | ≥90 |
| `src/components/DotRow.vue` (new) | ≥90 | ≥85 | 100 | ≥90 |

No threshold may be lowered to land a PR; new files (e.g. a dot-row component) enter at ≥90/85/100/90.

## 7. Migration note — stored preferences must not wedge an existing install

Current storage: one key, `mathGame.preferences`, JSON `{playerName, mascot, maxLimit}` (`usePreferences.js:7`, save at `:65-72`). The mode feature adds `mode` and `countersOn`.

Rules:
1. **Absent fields default, never throw.** Load path: `mode = ['result','part','start'].includes(prefs.mode) ? prefs.mode : 'result'`; `step = ['1','2','3-5','any'].includes(prefs.step) ? prefs.step : 'any'`; `countersOn = prefs.countersOn === true`. A pre-feature install has none of these keys and loads exactly as a fresh `result` / `any` install.
2. **Validate on read, not just on write.** The existing NaN-limit defect (audit D3) shows what happens when `Math.min(Math.max(NaN,5),20)` is trusted; the new loader validates `maxLimit` with `Number.isFinite` before clamping, and validates `mode` and `step` against their whitelists. Anything invalid falls back to the default *and is rewritten* on the next save, so a corrupt blob self-heals instead of persisting.
3. **No version field yet.** Two added optional keys do not justify a schema version. If a third preference family ever lands, add `v: 2` then; the loader already tolerates its absence.
4. **Corrupt JSON stays handled.** The existing `try/catch` around `JSON.parse` remains the last line; defaults apply.
5. **Key name unchanged.** No new storage key, no migration of the old one, nothing removed — `playerName`, `mascot`, `maxLimit` keep their meanings, so no install can lose a name or mascot to this feature.
6. **Test coverage of migration** is the usePreferences block in §6: absent-field, corrupt-value, and valid-value round-trips are all asserted before the feature ships.
