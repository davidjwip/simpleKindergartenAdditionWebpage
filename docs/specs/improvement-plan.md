# Improvement plan — kindergarten arithmetic drill (maths.zt489.com)

*Scope: the Vue 3 + Vite app at `/opt/data/cache/scratch/kgadd` @ `fc1f967` (70/70 tests green, ~95% statement / ~88% branch coverage). Ordered increments, each one reviewable PR, spec-first and test-first. No external services, no accounts, no child data beyond localStorage preferences. Design language stays as in `src/style.css` (cream #fff9c4 panels, 3px #4ecdc4 borders, 10px radius, emoji mascots) — no redesign.*

## 1. Target learner and pedagogical target

The learner is a four-year-old (HK K2) who already plays this app willingly, is comfortable with addition and with result-unknown subtraction, and struggles specifically with `? − b = c`. The pedagogical target is composition of numbers within 10 first — "5 is 2 and 3" — because that is the documented foundation for all later addition and subtraction (HK EDB Explanatory Notes 1N1: composing a number from two 1-digit numbers is "the foundation knowledge for performing addition with carrying and subtraction with borrowing in the future"; EYFS ELG Number: "deep understanding of numbers to 10, including the composition of each number"; Singapore NEL Learning Goal 3.8). Result-unknown items come before unknown-operand items (CCSS treats "unknowns in all positions" as Grade 1; England's `7 = ? − 9` is Year 1), and every item a four-year-old sees should be answerable by counting something concrete on screen before it is answered by recall, because counting strategies are Baroody's Phase 1 and symbolic recall is his Phase 3 (arithmetic-learning-evidence.md §1–2). The app's default limit stays 10, because every preschool source (EYFS, CCSS Kindergarten, Singapore NEL) stops there. 15 and 20 stay available — this child is already comfortable at 20, so the plan does not shrink the range — but the new `start` mode caps its own limit at 10 (unknown-position.md §3).

## 2. Ruling on the owner's proposal: "which part of the equation is blank" as a toggle

### Recommendation

**Expose it as TASK TYPE in the child's language, in an adult-only settings panel, with three choices: "Find the total" (result unknown), "Find the missing part" (operand unknown), and "Find what we started with" (start unknown, `? − b = c`) — with the default changed to "Find the total" and the positions sequenced, not mixed.** An adult setting for mode, yes; the child's experience named as a task, not as a box position; and the uniform 1/3 random blank removed entirely rather than kept as a fourth "surprise me" option.

### The three options considered

| Option | What it is | Verdict |
|---|---|---|
| A. Box position next to the +/− toggles | Owner's proposal: adult picks blank ∈ {a, b, c} | Rejected as designed, but its intent is absorbed |
| B. Task type in the child's language | Adult picks mode: "find the total" / "find the missing part" / "find what we started with" | **Recommended** |
| C. Not exposed — sequence it in code | App walks result → part → start automatically | Rejected for now; becomes a later enhancement once measurement exists (§6) |

### Reasoning

Option A (blank position) is the right instinct pointed at the wrong abstraction. The child does not have a "blank-position" problem; she has a task problem. `? − 3 = 4` is not a harder version of `7 − 3 = ?` — it is a different task requiring the child to hold a start that is never shown, and it is currently as likely as result-unknown (16.64% of all items, per app-audit.md §3). But a raw a/b/c selector has two faults. First, it conflates two tasks of different difficulty: for subtraction, "blank = b" (`a − ? = c`, find the part left) and "blank = a" (`? − b = c`, find the start) are not the same task and do not belong at the same point in a sequence; the CCSS progression treats subtraction-as-unknown-addend as a later achievement (arithmetic-learning-evidence.md §3). Second, the position picker answers "where is the box?" when the question the adult actually has is "what is my child practising?" — and the answer to that, in the app's own vocabulary, should be stated in words a child could say: "what did we start with?"

Option B is the same control the owner asked for, said properly. It maps one-to-one onto the engine's existing blank positions (see unknown-position.md §4 for the mapping, including that "find the missing part" covers both operand blanks for addition but, for subtraction, `a − ? = c` only), it produces UI copy the child can hear ("What did we start with?"), and it gives each task its own on-screen support. It also keeps the adult's choice where the +/− toggle already lives — out of the child's play area, per audit decision #2 — inside the settings panel rather than the header, so it is not a toy.

Option C (invisible sequencing) is pedagogically the most defensible default — the docs support result-unknown-first strongly — but rejected as the *only* mechanism because the owner has live observation data ("struggles specifically with `? − b = c`") and the app has no measurement yet that could drive sequencing honestly (§6). Auto-sequencing before measurement is the "per-item adaptivity" item on the NOT-build list. The compromise: sequence by default (mode defaults to "find the total"; the other two are off until the adult turns one on), expose by task type, and revisit automation after the logging in §6 has produced a few weeks of real play data.

### What this means concretely

- The uniform `pickRandomField()` blank stops being the default. Default mode = result unknown; the other positions exist only inside their named modes.
- One mode is active at a time, set by the adult, remembered between sessions (migration: absent field ⇒ "find the total"; see unknown-position.md §7).
- `? − b = c` is not merely an askable item but a taught one: it gets a concrete representation on screen (part-whole bar / countable dots / a put-back action), specified in unknown-position.md §3. The docs are explicit that most four-year-olds will count or guess unless something on screen is countable (arithmetic-learning-evidence.md §2–3); an unsupported symbolic mode would measure guessing.

## 3. Ordered increments

Each increment is one PR: tests written first, then code; acceptance criteria as Given/When/Then; and the per-file coverage gate, which **does not exist yet**: the `test:coverage:threshold` script passes global CLI flags only (80/80/80/80), `vite.config.js` declares no `coverage.thresholds`, and CI runs `npm test` with no coverage at all, so today the only enforcement is a pre-commit hook that prints `--no-verify`. Increment 1 builds the gate: `coverage.thresholds` with `perFile: true` and per-file globs matching unknown-position.md §6 in `vite.config.js`, the global CLI flags removed from the script, and `npm run test:coverage:threshold` added as a step in `.github/workflows/deploy.yml` so it binds on push. Prove it by adding a module with no tests and confirming the run fails naming that file. No increment may lower a floor.

### Increment 1 — Fix the wrong-answer contract (copy + retry)

**Purpose.** Stop discarding the one moment with teaching value. Smallest shippable change; deliverable in a session.

**What changes.** First the gate, because every later increment's acceptance leans on it: add `coverage.thresholds` with `perFile: true` and the per-file globs from unknown-position.md §6 to `vite.config.js`, drop the global CLI flags from the `test:coverage:threshold` script, and add `npm run test:coverage:threshold` as a CI step in `.github/workflows/deploy.yml` (prove it by adding a module with no tests and confirming the run fails naming that file). Then the behaviour: `useMathGame.js` on a wrong answer locks for ~1.5 s, *holds the same item*, allows one retry; on second failure it shows the completed equation ("3 and 4 make 7") for a short reveal, then advances. The blank field is cleared on entering RETRY — otherwise `fillValue`'s "first empty field" rule writes the retry into a different box and silently corrupts every operand-blank item. Copy: the encouragement pool no longer says "Try again!" while the item is discarded (audit defect D1, `useMathGame.js:42` vs `:200-202`). `mathEngine.js:45`: make `evaluateAnswer('')` return `null` as documented (defect D8).

**Streak semantics are defined here, not inherited.** The first wrong tap zeroes the live streak as today (`useMathGame.js:194`); the reveal path never increments `problemsSolved` (the item is logged missed), so an assisted answer can never complete the ten-answer goal or clear the celebration. Retry-correct does count as solved — it is an unaided second attempt — and the log keeps `firstTry: false` on it.

**Why first.** It is the highest-leverage defect (the main wrong-answer sentence lies to the child), it touches only the game composable, and the new hold→retry→reveal→advance state machine is the same one the start-unknown mode will reuse — so it de-risks increment 4.

**Tests first.** Composable tests with fake timers: wrong answer → item unchanged after 1.5 s; retry correct → scored as correct, advance scheduled; retry wrong → reveal shown, advance scheduled, `problemsSolved` unchanged and the item counted as missed. Two guards the happy path cannot reveal: "a wrong first tap, then the retry, re-fills the original blank field and never overwrites another field", and "a third tap during REVEAL does not change `problemsSolved`/`totalProblems`". Engine test: `evaluateAnswer('', 4, 7, '+') === null`.

**Acceptance criteria.**
- Given any item, when the child taps a wrong key, then the same printed equation remains on screen after 1.5 s and the keypad re-arms for one retry.
- Given a wrong answer, when the retry is correct, then the item counts as solved and the chime/advance path is the normal correct path.
- Given a wrong answer and a wrong retry, when the reveal delay elapses, then the completed equation is shown (e.g. "? − 3 = 4" becomes "7 − 3 = 4" with 7 highlighted) before the next item.
- Given the encouragement-message pool, then no string contains "Try again" or "another go" (a copy assertion over the pool, not a rendering test).
- Given a reveal has been shown, when the next item appears, then `problemsSolved` is unchanged and the item is recorded as missed.

**Risk / rollback.** Low; the change is confined to `checkAnswer` and its timer. Rollback = revert the PR; the old discard behaviour is a single branch.

**Closes audit defects:** D1, D8.

### Increment 2 — Wedged-state and progress-surface fixes (defect batch)

**Purpose.** Close the class of states that leave the app unplayable or visibly broken, before any feature work.

**What changes.** (a) `mathEngine.js`: guard both generators against `maxLimit < 2` (throw or clamp; never spin — verified hang at limit 1, audit §3). (b) `usePreferences.js`: reject non-finite stored limits (`Number('corrupt')` → NaN → empty keypad, defect D3); clamp in `setMaxLimit`. (c) `App.vue`: progress track lights step 10 (`problemsSolved % 10` never reaches 10, defect D4); remove the "Problems Solved: X / Total Problems: Y" fraction (defect D7) in favour of session counts without a ratio; remove dead imports (`progressPercent`, `getRandomName`, defect D13); fix the double-generation on limit save (direct call plus watcher, part of defect D6); celebration clears the pending 2 s advance timer (defect D6). The footer credit at `App.vue:320` is **retained**: a settled, owner-approved exception. No increment modifies it. The rule that new content says "a four-year-old" and never a name still binds everything this plan adds — comments, tests, fixtures, specs.

**Why second.** All small, all already diagnosed with file:line, all prerequisites for trusting the screen when new features land. Doing them now keeps later PR diffs about features, not about pre-existing breakage.

**Tests first.** Engine: `generateAddition(1)` and `generateSubtraction(1)` terminate (throw) rather than hang — bounded-iteration test. Preferences: corrupt JSON, non-numeric limit, limit below min / above max. Component: track step 10 lights at 10 solved; limit save generates exactly one new item; celebration opens with no pending timer and no discarded item generated behind it.

**Acceptance criteria.**
- Given localStorage contains a corrupt or non-finite limit, when the app loads, then the limit falls back to 10 and the keypad renders 1..10.
- Given limit is set to any value in [5,20], when generators run, then no item hangs and all items respect the limit on operands and answer.
- Given the child solves the 10th item, when the track renders, then step 10 lights before the celebration overlay.
- Given the celebration is visible, when timers are inspected, then no auto-advance timer is pending.

**Risk / rollback.** Low. Behavioural changes are to edge states; rollback per-PR revert.

**Closes audit defects:** D2, D3, D4, D6, D7, D13. D9 (no end-to-end celebration test) is **not** closed here: the ten-answer test lands with Increment 4 per unknown-position.md §6, and I2 adds only the no-pending-timer and single-generation assertions. D10 (footer names) is a settled owner exception — see "What changes" above.

### Increment 3 — Default mode: result unknown ("Find the total")

**Purpose.** Change the default task from the uniform blank (66.75% missing-operand) to result-unknown, per the docs and the child's observed comfort.

**What changes.** `mathEngine.js` gains `generateProblem(operator, limit, mode)` returning the shape specified in unknown-position.md §4 (`{ num1, num2, answer, blankField, mode, operator }`); `generateAddition`/`generateSubtraction` become internal helpers, and `pickRandomField()` survives only as the legacy path until mode selection is the only caller. `useMathGame.js` consumes a mode (see unknown-position.md §4). Mode ids are `result` / `part` / `start` throughout — not `startUnknown`/`partUnknown`. Preferences gain a `mode` field with migration (absent ⇒ `result`). This increment ships only the `result` mode plus persistence plumbing; the two operand modes are stubbed but not selectable.

**Why third.** It is the single largest pedagogical correction available for one screen of work (audit §5 item 1), and it builds the mode machinery that increments 4–5 fill in. Landing machinery and default first keeps the hard mode's PR small.

**Tests first.** Engine: generated items always carry `blankField`; in `result` mode every item blanks the answer. Composable: mode change regenerates; mode persists across reload; stored corrupt mode ⇒ `result`. Component: default session shows only `a + b = ?` / `a − b = ?` items.

**Acceptance criteria.**
- Given a fresh install, when the app loads, then every item asks for the result and no operand is ever blank.
- Given an existing install with stored preferences lacking a mode field, when the app loads, then mode is `result` and play is identical to a fresh install.
- Given mode is `result`, when 200 items are generated, then 100% have the answer blank and all other constraints (no zero, limit respected) hold.

**Risk / rollback.** Moderate: changes the item shape the engine returns, touching every consumer. Mitigated by the engine remaining pure and the tests asserting the old invariants still hold. Rollback = revert; old item shape restored.

**Closes audit defects:** none directly; it is the fix for audit §5 item 1 and decision #4 (blank uniform 1/3).

### Increment 3b — Step size (the difficulty dial that is not the limit)

**Purpose.** Make the size of the number being added or taken away an explicit, adult-set knob. At limit 10 the difficulty of an item is dominated by `num2`, not by the ceiling, so the limit alone cannot pitch practice at a child.

**What changes.** `generateProblem(operator, limit, mode, step)`; step ∈ `1` · `2` · `3-5` · `any`, applied to `num2` for `+`/`−` and to the larger operand for `part`/`start`. The default is **`any` on every install** — content defaults in this estate are pedagogical, never personalised, the same reason the mode default is `result` for everyone. `step` is a generation parameter recorded on the per-item log entry, never a field on the item shape (the item already carries `num2`, from which the step is recoverable). Preferences gain `step` under the migration rules in unknown-position.md §7.

**Why here.** It is independent of the operand-blank machinery (I3) and of the mode content (I4/I5), so it lands as its own small diff rather than riding inside another. One caution, stated rather than hidden: a small-step item is easier to *recall* as well as easier to count, so the step axis earns its keep only alongside the counters of I7. Until those exist, an adult who sets step 1–2 is choosing a pool with no representation on screen, and the default must stay `any`.

**Tests first.** Engine: a 1,000-item sweep per (mode, operator, step) proving the step ceiling holds and every existing invariant survives; `step: 'any'` reproduces today's distribution. Preferences: round-trip, absent/corrupt ⇒ `any`. Composable: a step change regenerates exactly once and preserves mode.

**Acceptance criteria.**
- Given step `1`, when 200 items generate in any mode, then the added or taken-away number is always 1.
- Given step `3-5`, then it is always 3, 4 or 5.
- Given a fresh install, when the app loads, then step is `any`.
- Given an adult changes step while an advance timer is pending, then the timer is cancelled and exactly one new item generates at the new step, with the mode preserved.
- **No level transition turns mode and step together**; a mode change preserves the current step.

**Risk / rollback.** Low: a pure generator input plus one preference key. Rollback: hide the setting, force `any`.

**Closes audit defects:** none. It is change R1 from `revision-assessment-2026-10.md`.

### Increment 3c — Anchor facts: "Make 5", "Make 10", doubles

**Purpose.** Drill the structure of five and ten — the fact strategy the rest is derived from — as its
own content mode. Full spec: **`anchor-facts.md`**.

**What changes.** A new content mode `anchor` with three families (`bonds` total 10 first, then `bonds`
total 5 and `doubles`), each rendered on a five- or ten-frame with the known part filled and the unknown
part left as outlined empty cells. One numeral tap submits; the I1 hold→retry→reveal machinery and the
I4 part-whole bar are untouched.

Anchor mode must not read `maxLimit` for its keypad — the keypad is `v-for="n in maxLimit"` today
(`App.vue:269`), grid included (`:267`), so the mode computes an **effective** keypad length from the
family total, leaves the stored preference alone, and restores it on exit. `limit` and `step` changes
made while anchor is active are inert on screen and take effect only on return to a mode that uses them.
Mode or family changes mid-pass regenerate item, keypad and track atomically with timers cleared once.

The adult summary carries a mode-specific line: **"first-try here means the frame was read, not that the
bond is recalled — recall shows up as fast answers."** Without it, 100% first-try at make-ten reads as
mastery, which is the R2 misreading in a new costume.

**The one convention it breaks, deliberately.** Every other mode's round is "ten right answers". An
anchor round is **a pass of the family** — 9 items for make-ten, two consecutive passes of 4 for
make-five, 5 for doubles — because those are the distinct-item counts and a ten-answer round drawn from
four items is a drill in sequence memory. Make-five runs two passes rather than one so the celebration
does not fire every four taps; the overlay itself is identical across families. The progress track must
render the round's own length rather than ten fixed cells.

**Why here.** It is the prerequisite of the step axis: step 3–5 is only derivable once 5 and 10 are
secure, otherwise it is counting on a bigger number. It needs only the item shape (I3) and the retry
machinery (I1), so it can land before the operand-blank modes without coupling to them.

**Tests first.** Named in `anchor-facts.md` §6, including a seedable `makeRng` so pass order is
assertable, and a new `test/anchorEngine.test.js`.

**Acceptance criteria.** The twelve in `anchor-facts.md` §5.

**Risk / rollback.** Moderate: a new renderer (the frame), the first pass-based round goal, and the
first mode whose keypad length is not the stored limit. Mitigate by shipping **make-ten only** in this
increment (criteria 1–10 of `anchor-facts.md`) and adding make-five and doubles as 3c-2 behind the same
mode id. Rollback: hide the mode; nothing else depends on it.

**Closes audit defects:** none.

### Increment 4 — Mode: "Find the missing part" (`a + ? = c`, `? + b = c`, `a − ? = c`)

**Purpose.** The composition skill every cited curriculum puts first — "5 is 2 and 3" — practised as a task instead of as a random blank. Full spec: **unknown-position.md**.

**What changes.** `part` mode with the part-whole bar from unknown-position.md §3 (a whole row of `c` dots, the known part pre-counted in teal, a gap for the missing part). For addition both operand blanks are equivalent tasks and both appear; for subtraction only `a − ? = c` is in this mode — `? − b = c` is `start` and stays there. The ten-answer end-to-end celebration test lands here (closes D9).

**Why fourth.** It depends on the mode machinery (I3) and the retry/reveal state machine (I1), and it is the *easier* of the two taught modes — so the shared part-whole bar is proven on a task the child can already nearly do before the put-back interaction is built on top of it. It also keeps the plan's own §1 order: composition, then reconstruction.

**Tests first.** Named in unknown-position.md §6; per-file coverage gates named there.

**Acceptance criteria.** The per-mode Given/When/Then set for `part` in unknown-position.md §5, plus the ten-answer celebration test and the boundary cases (limit 5/10, no zero, degenerate items, mode change mid-round, mode change during the 2 s advance).

**Risk / rollback.** Moderate: one new interaction (tap-to-count dots) for a four-year-old, no dragging anywhere. Rollback: hide the mode option; `result` mode is unaffected.

**Closes audit defects:** D9 (the ten-answer celebration test).

### Increment 5 — Taught mode: "Find what we started with" (`? − b = c`)

**Purpose.** The child's observed sticking point, taught with a countable representation rather than merely asked — built on a bar the child has already met in I4.

**What changes.** Per unknown-position.md: mode `start`, the put-back interaction (tap the taken-away group; the ghost dots fill and the row becomes countable), the reveal that performs the put-back itself, counters forced on for this mode, and the mode's own limit cap at 10. The mode picker carries one line of copy against this mode ("keep step at 1") and against `part` ("start with step 1–2"). It advises; it does not disable. The adult is the scheduler, and a code gate here would encode one child's paper result as policy.

**Why fifth.** It is the hardest form in the set and the only one whose interaction is new rather than a variation: it reuses I4's bar, adds the put-back, and would teach the wrong thing if shipped unsupported. Sequencing it last also means the child meets `? − b = c` deliberately, with counters, instead of as one random third of every session.

**Tests first.** Named in unknown-position.md §6 (`start` block, `putBackUsed` both ways, the limit-cap rule); coverage gates per file named there.

**Acceptance criteria.** The `start` Given/When/Then set in unknown-position.md §5, including the put-back logging flag, the mode's limit cap, and the boundary cases.

**Risk / rollback.** Highest of the plan: one new interaction on a touchscreen for a four-year-old. Mitigated by tap-only (no drag) and by the mode being opt-in. Rollback: mode flag off, selector hides the option.

### Increment 6 — Forgiving progress surface (streak, mascot, session picture)

**Purpose.** Remove the punitive scoring signals the audit flags, now that the item mix is fixed.

**What changes.** Streak becomes non-punitive: the visible counter is "best today" (no live collapse to zero — or the live streak is hidden and only best-today shows); the mascot stays mounted through mistakes (`App.vue:294`, defect D5); `bestStreak` and a daily count persist in localStorage (defect D12). Session summary for the adult (§6) gets its first visible surface: solved count and per-mode counts for the day.

**Why sixth.** These changes are cheap but their *meaning* changes with the mode work: a streak across a uniform-blank mix punished the child for items she shouldn't have been shown; after increments 3–5 the streak measures the intended task.

**Tests first.** Composable: streak no longer zeroes on wrong; best-today updates; persisted state survives reload. Component: mascot renders at streak 0 after a wrong answer.

**Acceptance criteria.**
- Given a streak of 5, when the child answers wrong, then no visible counter collapses to 0 and the mascot remains on screen.
- Given play on two consecutive days, when the adult opens the app, then today's counts reset and best-ever persists.

**Risk / rollback.** Low. Rollback: revert.

**Closes audit defects:** D5, D12.

### Increment 7 — Quantity channel for all modes (dots under numerals)

**Purpose.** Every item, in every mode, becomes countable: tap-to-reveal dot rows under each shown numeral, so a Phase-1 counter is never forced to guess (arithmetic-learning-evidence.md §2).

**What changes.** Reusable dot-row component (already built for increment 4) rendered under the equation in `result` and `partUnknown` modes too; off-by-default toggle in the adult settings ("show counters").

**Why seventh.** Increment 4 needed the representation for one mode; generalising it is deliberately last among the learning features so the interaction is proven before it is everywhere.

**Tests first.** Component: counters toggle persists; counts match numerals; counters do not affect the keypad path.

**Acceptance criteria.**
- Given counters are on, when any item renders, then each visible numeral has a matching countable row.
- Given counters are off and persisted off, when the app reloads, then no dot-row element is rendered and the equation and keypad markup match the pre-feature snapshot.

**Risk / rollback.** Low. Rollback: toggle off / revert.

### Increment 8 — Accessibility and polish batch

**Purpose.** Close the remaining audit defects: `:focus-visible` keyboard focus on the keypad (D14), and `aria-live` on the feedback region so the correction is announced (design decision #21 in the audit's §2 table, not a numbered defect). Optional, flagged: a spoken prompt/replay is the evidence doc's "largest lost affordance" but requires audio assets and a muted default decision; it is a candidate for a later increment, not this plan.

**Tests first.** Component: focus ring present; feedback node has `aria-live="polite"`.

**Acceptance criteria.**
- Given keyboard navigation, when focus moves across the keypad, then a visible focus ring follows it.
- Given the feedback region, then it carries `aria-live="polite"` and its text content equals the current feedback message after a correct and after a wrong transition (happy-dom cannot run a screen reader; the attribute is the testable contract).

**Risk / rollback.** Low.

**Closes audit defects:** D14, plus design decision #21 (no `aria-live`) — there is no defect D21; the audit's defect list runs D1–D14.

### Defect-closure summary

| Audit defect (§4) | Closed by |
|---|---|
| D1 "Try again!" vs discard | I1 |
| D2 unbounded generator hang | I2 |
| D3 NaN limit → empty keypad | I2 |
| D4 step 10 never lights | I2 |
| D5 mascot vanishes on mistake | I6 |
| D6 celebration timer + double generation | I2 |
| D7 accuracy fraction | I2 |
| D8 `evaluateAnswer('')` returns false | I1 |
| D9 no end-to-end celebration test | I4 |
| D10 footer names in public repo | **not an increment — retained as an owner-approved exception** |
| D11 analytics beacon | Not closed by this plan — owner's call; recommendation: drop it (ITP defeats its stated purpose; no opt-out) |
| D12 bestStreak not persisted | I6 |
| D13 dead imports | I2 |
| D14 no `:focus-visible` | I8 |
| decision #21 (audit §2 table) no aria-live | I8 |

## 4. What we will NOT build, and why

| Not building | Why |
|---|---|
| P1-interview question banks | No official basis: aided/government P1 admission "must not conduct tests or interviews" (EDB POA leaflet); drilling for DSS/private interviews has no curricular warrant (hk-curriculum-anchor.md §3) |
| Column form | Explicitly not required at 1N2 ("students are not required to learn the column form", EN 1N2) |
| Carrying / borrowing | 1N4 content (P1, later); subtraction "doesn't include borrowing" even there |
| `>` / `<` recording | "In Primary One, students are not required to use the symbols '>' and '<'" (EN 1N1) |
| Timers / speed scoring | No document sets a time limit; "automatically recall" (EYFS) is a memory claim, not a speed test; speed pressure is the anxiety mechanism in Ramirez et al. (evidence §4) |
| Leaderboards / cross-child comparison | One child, personal POC; comparison is the signal the audit flags as harmful (the accuracy fraction, D7) |
| Per-item adaptivity (auto-difficulty) before measurement | There is no logged data to adapt from; adaptivity now would be a random-number generator with extra steps. Revisit after §6 logging has real play history |
| Drag-and-drop counter manipulation | Tap interactions only; drag is a motor-skill confound at four and adds hit-testing complexity for no pedagogical gain |
| Sums beyond 20 / limit above 20 | Every preschool source caps at 10; 20 already spans into Year 1 / Grade 1 (international-comparison.md) |
| A zero key | Zero is never an operand, answer, or required blank by engine design (verified, audit §3); adding the key invites only wrong taps |
| Spoken prompts (this plan) | Largest lost affordance per evidence §6, but deferred: needs audio assets, a mute policy, and testing; candidate for a later increment |

## 5. Measuring progress and difficulty from real play

**Principle.** Log locally, in the same `localStorage` preferences object family, nothing transmitted, nothing that identifies the child. The adult sees a summary; the child sees nothing new.

**These figures measure tapping, not arithmetic.** They are a lower bound on written arithmetic, not a measurement of it: a child can be fluent here and score near zero on a written paper asking the same sums. No level change — limit, step or mode — is made by the numbers alone; the adult decides, with paper work as the other leg.

**What to log per item (append-only, capped at the last ~500 events, pruned on write):**
- timestamp (day granularity is enough), mode, operator, limit, blankField
- correct first try / correct on retry / missed (revealed)
- `putBackUsed: boolean` — mode `start` only: whether the child tapped the put-back before the first answer tap; always `false` when the reveal performs it (set by the composable when the put-back callback fires; carried on the per-item log entry, never on the item shape)
- time-to-first-tap in coarse buckets (<2 s, 2–5 s, >5 s) — strategy signal, not a speed score: a shift from >5 s to <2 s on result-unknown is the counting→recall transition made visible

**What the adult can see (settings panel, behind the 👤 screen):**
- Per mode × step: first-try accuracy over the last 7 days **with the reveal count beside it** and the trend arrow. Never a single rolled-up percentage for the whole app — 85% first-try with a falling reveal rate says something, a bare "80%" says nothing.
- Count of retries and reveals per mode × step (a mode needing many reveals is pitched too high — the level-matching signal from Clements & Sarama)
- Current limit and step, plus a sentence the adult reads rather than a verdict the app acts on: "finding the total at step 1 looks secure — you could try step 3–5, or 'find the missing part'". The app never changes a level itself.

**Explicitly not measured:** per-tap telemetry, session duration, anything sent off-device (the existing analytics beacon's fate is the owner's decision — recommendation is to remove it), and no per-item adaptive engine consuming this data until a few weeks of it exist and the owner has seen it.

**Success signal for the whole plan**, stated per (mode × step) rather than per limit, because the limit is not the difficulty dial: "find the total" at step 1 and step 2 at ≥80% first-try across a week; "find the missing part" introduced at step 1–2 and ≥60% first-try; `? − b = c` attempted with the counters on and its reveal rate falling week over week. And the signal that outranks all of them: the same sums, written on paper, unaided — the app cannot see that, and the adult can.

## 6. Review disposition (round 1 — adversarial read by a second model, `reviews/spec-review-1.md`)

| Finding | Severity | Disposition |
|---|---|---|
| B1 coverage gate claimed to exist; it is global-only, not in CI, bypassable | BLOCKER | **Fixed.** The §3 preamble now says the gate does not exist, and Increment 1 builds it: `perFile: true` globs in `vite.config.js`, no global CLI flags, a CI step in `deploy.yml`, and a fail-proof test. Same correction in unknown-position.md §6. |
| B2 Increment 2 removes the footer credit | BLOCKER | **Fixed.** The footer is retained as a settled owner exception; the D10 row is struck from the closure table and the increment. |
| M1 `putBackUsed` specified but absent from the log schema | MAJOR | **Fixed.** Added to §5's per-item log list with its `false` cases; its home is the log entry, never the item shape (also stated in unknown-position.md §4). |
| M2 D9 attributed to I2 while the ten-answer test lives in §6 | MAJOR | **Fixed.** D9 now closes in I4, and I2 says so. |
| M3 `start` (hardest) shipped before `part` (composition) | MAJOR | **Accepted.** I4 and I5 swapped: `part` ships first and proves the part-whole bar; `start` adds the put-back on top. |
| M4 20-dot put-back row contradicts the 10 ceiling | MAJOR | **Accepted.** `start` caps its own limit at 10; the stored preference is untouched. |
| M5 retry never clears the child's wrong digit; "two scored taps" untested | MAJOR | **Fixed.** Blank field resets on RETRY, keypad locked through REVEAL, two named guards added to I1 and to unknown-position.md §6. |
| m1 "D21" is a design decision, not a defect | MINOR | **Fixed.** Relabelled in I8 and in the closure table. |
| m2 untestable acceptance criteria (byte-identical, screen reader, "no message promises") | MINOR | **Fixed.** All four reworded to assertable forms. |
| m3 two contradictory engine contracts | MINOR | **Fixed.** One signature, `generateProblem`, with the field list held only in unknown-position.md §4. |
| m4 celebration end-to-end mechanics unspecified | MINOR | **Fixed.** The test now states how it computes each blank and advances the fake timer. |
| m5 coverage-table gaps (dot-row component, generation-count mechanism) | MINOR | **Fixed.** `src/components/DotRow.vue` has a floor; the timer test spies on `generateProblem`. |
| m6 stale line citation (`usePreferences.js:6`) | MINOR | **Fixed.** |
| (d) retry-correct counted as solved | question | **No change.** Retry is an unaided second attempt; only the reveal is assisted and it is logged missed, so it cannot complete the goal. Streak behaviour and the "reveal never increments `problemsSolved`" criterion are now explicit in I1. |

Nothing in the review was rejected. Both BLOCKERs were verified against the code before editing — `vite.config.js` really has no `coverage.thresholds`, `deploy.yml` really runs `npm test` with no coverage — and the footer exception is the owner's standing decision, not a review preference.

## 7. Review disposition (round 2 — proposed changes from the October assessment)

Nine changes (R1–R9) were proposed in `specs/revision-assessment-2026-10.md` and reviewed
adversarially in `reviews/revision-review-1.md`. Verdicts and where each landed:

| Item | Verdict | Landed as |
|---|---|---|
| R1 step-size axis | ACCEPT-WITH-CHANGES — the default must be `any`, not this child's step | Increment 3b above |
| R2 tap accuracy is not mastery | ACCEPT | §5 caveat, per-mode × step summary, restated success signal |
| R3 mode/step orthogonal, hard modes gated | ACCEPT-WITH-CHANGES — copy advice, not a code gate | Increment 3b criteria + the one-line picker copy in I5 |
| R4 counting-structure tier above money | ACCEPT | scope-map §3 and §5 |
| R5 demonstrate the split first | ACCEPT | scope-map §4 note and the POC brief |
| R6 choose a line before placing one | ACCEPT-WITH-CHANGES — recorded as H4b, deferred past the POC | scope-map §4 |
| R7 judge on equal area, one geometry function | ACCEPT | scope-map §4 note |
| R8 numeral writing stays on paper | ACCEPT | scope-map §2 and §3 note |
| R9 explicit non-changes | ACCEPT | §6 above; step is placed at 3b rather than appended to I3 |
