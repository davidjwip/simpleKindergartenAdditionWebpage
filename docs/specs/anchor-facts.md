# Spec — anchor facts ("Make 5", "Make 10", doubles)

*Proposed increment **3c** for `improvement-plan.md`, between 3b (step size) and 4 (find the missing
part). Buildable spec: behaviour, data, marking, tests. Everything here is additive to the state machine
and item shape in `unknown-position.md`; nothing in that document changes. Revised after
`reviews/anchor-review-1.md` — dispositions in §9.*

Why this exists: the app drills *unknown positions* and, as of 3b, *step size* — but nothing drills the
**structure of five and ten**, the fact strategy the rest is derived from. EYFS requires number bonds to
5 and some to 10 with automatic recall; CCSS `K.OA.A.4` is "find the number that makes 10"; HK's P1 unit
1N1 makes "decomposition and composition of numbers 2–18" the stated foundation for carrying and
borrowing; and 1N2's "within 18 verbally" is reached by bridging through ten, not by counting on from 2.
A child whose addition stops at a small step does not need larger sums — he needs the anchors that make
+3 to +5 derivable.

## 1. Domain — what "working from 5 and 10" means, and what is in scope

| Rung | What the child does | Anchored in | In 3c? |
|---|---|---|---|
| A1 See the five | ten-/five-frame with 5 and some: 6, 7, 8, 9 as "5 and 1", "5 and 2" … | subitising to 5; five-structure | yes — the frame's first job |
| A2 Bonds to 5 | "1 and ? make 5", "? and 2 make 5" | EYFS bonds to 5; 1N1 composition | yes — 3c-2 |
| A3 Bonds to 10 | "7 and ? make 10" — how many more | EYFS some bonds to 10; CCSS K.OA.A.4; 1N1 composition | **yes — the first PR** |
| A4 Doubles | "4 + 4 = ?" | derived facts; the cheapest recall route | yes — 3c-2; near-doubles later |
| A5 Bridge through ten | 8 + 5 → "8 needs 2", 10 + 3 = 13 | 1N2 within 18; the mental method | **no — deferred (§8)** |
| A6 Take from ten | 13 − 5 → 13 − 3 − 2 | borrowing; P2 | no |

A5 is the destination and it is two-step: move 2 dots into the frame, then read ten-and-three. That
cannot be one numeral tap, so it is explicitly out of this increment. Shipping A2–A4 without A5 is still
worth it — they are the prerequisites, and A5 without them is a trick.

## 2. What the child sees

A new **content mode**, not a new unknown-position. The blank-position machinery is reused as-is; what
changes is the *fact set* and the *representation*.

| | **Make 10** (`anchor` / total 10) | **Make 5** (`anchor` / total 5) | **Doubles** |
|---|---|---|---|
| Frame | ten-frame, 10 cells (two rows of 5) | five-frame, 5 cells (one row) | ten-frame |
| Equation | `7 + ? = 10` (or `? + 2 = 10`) | `3 + ? = 5` | `4 + 4 = ?` |
| Frame shows | 7 filled in group A, 3 outlined empty | 3 filled, 2 empty | 4 group A + 4 group B, no empty |
| What the child does | counts the empty cells, taps the number | same | reads or counts the two groups, taps the total |
| Keypad | 1 … 10 | 1 … 5 | 1 … 10 |
| Round | one pass of 9 | **two passes of 4** | one pass of 5 |

Rules the screens must obey:

- **The frame is the answer's scaffold, never decoration.** Cells ≥ 40 px with a visible gap; empty cells
  are visibly *outlined*, so "how many more" is countable.
- **The frame never prints the answer** — no numeral in any cell. The empty cells make the answer
  *countable*, which is the concrete stage and the point of the mode; a digit in a cell would turn
  counting into reading.
- **Two colours only where two groups exist**, the second a shade of the accent and not a new hue: group
  A `#4ecdc4`, group B `#2f9e94`. Red stays reserved for a wrong answer.
- **Cell rendering is shared, not forked.** `NumberFrame.vue` reuses the existing `DotRow` cell
  primitive; two implementations of "a row of dots" is a drift waiting to happen.

## 3. Data and generation

```
generateBond(total, blankField) → {
  num1, num2, answer: total, operator: '+',
  blankField: 'num1' | 'num2',   // never the answer
  kind: 'bond'
}
generateDoubles(a) → { num1: a, num2: a, answer: 2*a, operator: '+', blankField: 'answer', kind: 'doubles' }
```

- `answer` is the total for bonds and the sum for doubles, so the existing item shape and
  `evaluateAnswer` are unchanged. `kind` is the only new field; it tells the renderer one group or two.
- **`blankField` is assigned, never random.** For a pair with `a ≠ b` the blank is the **larger**
  operand (`1 + ? = 10`), so the bond reads the way it is normally spoken. That gives 2/2 in a make-5
  pass and 4/5 in a make-10 pass — the asymmetry is a consequence of the rule, not a coin toss. `5 + 5`
  has two identical presentations, so it blanks `num2` by convention.
- **`makeRng(seed)` is new and anchor-only.** `mathEngine.js` calls `Math.random()` inline today; those
  generators are untouched. The anchor pass and its shuffle take an rng as an argument — tests pass a
  fixed seed, production passes an entropy source, so no seed ever appears in stored data.
- **A pass is a list, not a draw.** `buildPass(family, rng)` returns the family's ordered pairs exactly
  once each, shuffled, with `blankField` assigned by the rule above.

| Family | Ordered pairs | Items in a round | Round shape |
|---|---|---|---|
| total 10 | 1+9 … 9+1 (9) | 9 | one pass — one short of an ordinary round |
| total 5 | 1+4, 2+3, 3+2, 4+1 (4) | 8 | **two passes of 4**, each independently shuffled, no in-pass repeat |
| doubles | 1+1 … 5+5 (5) | 5 | one pass |

Two-pass make-5 exists for the celebration cadence: a single 4-item round would fire the overlay every
four taps, and the celebration is the app's only reward — inflating it cheapens it for every mode. The
celebration itself — mascot, copy, overlay — is identical across families; only round length and track
differ.

- **Zero is excluded**, consistently with the engine: `0 + 5` is never asked. A real gap (0 is a 1N2
  concept); recorded rather than papered over.
- **Effective keypad length is mode-derived.** The keypad is `v-for="n in maxLimit"` today
  (`App.vue:269`) and its grid is `repeat(ceil(sqrt(maxLimit)))` (`App.vue:267`). Anchor mode computes
  an **effective** length equal to the family total and renders buttons *and grid* from it; the stored
  `maxLimit` is never read or written here, and leaving the mode restores the previous keypad exactly. A
  `limit` change made while anchor is active changes nothing on screen and still persists for the other
  modes.
- **`step` is ignored** while anchor is active; a `step` change made during a pass takes effect only on
  return to a step-consuming mode.
- **Transitions are atomic.** Changing mode or family mid-pass clears every pending timer, discards the
  current item unscored, and regenerates item, keypad and track length together — the D6 discipline from
  `unknown-position.md` §4.

## 4. State machine and marking

Unchanged from `unknown-position.md` §4: `IDLE → CHECKING → CORRECT | HOLD → RETRY → REVEAL → NEXT`,
one retry, reveal never increments `problemsSolved`, keypad locked through REVEAL, blank field cleared on
entering RETRY. The reveal additionally **fills the empty cells and completes the equation**
(`3 + **2** = 5`), because the frame is where the fact lives.

Progress: the track renders the **round**, not ten fixed cells — 9 for make-10, 4 per pass for make-5
(two passes back to back), 5 for doubles. Track length is a function of the active family and changes
atomically with it. A round completion fires the celebration; the next round is a fresh shuffle.

## 5. Acceptance criteria

**3c-1 — make-ten only (first PR):**

1. Given "Make 10" is selected, when a round starts, then it is 9 items covering all nine ordered pairs
   exactly once, and a second round is produced by re-invoking the shuffle (the mechanism is asserted,
   never "a different order happened" — §6).
2. Given any bond item, then filled cells equal the shown operand, empty cells equal the required answer,
   and their sum equals `total`.
3. Given any make-ten item, then the blank rule of §3 holds: 4 items blank `num1`, 5 blank `num2`, and
   `5 + 5` blanks `num2`.
4. Given the child taps the number of empty cells, then the item scores correct; after two failures the
   reveal fills the cells and completes the equation.
5. Given the stored limit is 5 and "Make 10" is selected, then the keypad renders 1 … 10, the grid
   follows that length, and `maxLimit` in storage is unchanged.
6. Given anchor is active, when the adult changes `limit`, then the keypad does not change on screen and
   the stored preference still round-trips on leaving the mode.
7. Given a mode or family change mid-pass, when the pending timer fires, then nothing is generated twice,
   the abandoned item is not logged, and item, keypad and track change together.
8. Given `step` is 1, then make-ten items are unaffected; a `step` change made during a pass applies only
   after returning to a step-consuming mode.
9. Given stored preferences with `anchorTotal: 7`, when the app loads, then the total is 10.
10. Given the log, then each anchor item records `mode:'anchor'`, `kind`, `total`, `blankField`,
    first-try / retry / missed, and the time-to-first-tap bucket.

**3c-2 — make-five and doubles (second PR):**

11. Given "Make 5", then the round is 8 items as two passes of 4, each shuffled independently, with no
    in-pass repeat and the 2/2 blank rule holding.
12. Given a doubles item, then the frame draws two groups of `a` cells in the two accent shades and the
    blank is the answer; only totals ≤ 10 are generated (6+6 is out — the keypad cannot reach 12).
13. Given "Make 5" or "doubles", then the track renders 4 (per pass) or 5 cells and the celebration is
    the same overlay every other mode uses.
14. Given operator − is selected, when the adult opens the picker, then anchor families are shown
    disabled with one line ("making 5 and 10 is adding") — advice plus a disabled option, not a hidden
    one.

## 6. Tests to write first

**`test/anchorEngine.test.js` (new)**
- `buildPass` per family: 9 / 8-in-two-passes-of-4 / 5 items, every ordered pair exactly once per pass, no
  in-pass repeat, blank rule per §3 (4/5 at total 10 including the `5+5` convention; 2/2 at total 5),
  `answer === total`, zero never generated.
- Seeded reproducibility: the same seed yields the same order; a new round is asserted by the shuffle
  being re-invoked with a new seed and the seeded orders differing — never by "a different order
  happened", which repeats by chance one time in 24 for a 4-item pass.

**`test/useMathGame.test.js` (extend)**
- Round advances on its own length, not on `problemsSolved`; celebration on round completion; second
  round reshuffles.
- Effective keypad: a limit change during anchor is inert on screen; leaving the mode restores the stored
  keypad; a mid-pass mode/family change clears timers once and regenerates item, keypad and track
  together; `step` changes apply only after leaving.
- Time-to-first-tap bucket recorded for anchor items.

**`test/App.test.js` (extend)**
- Frame cell counts and states for a bond and for a doubles item; empty cells outlined; the reveal fills
  them; keypad is 1 … total and the grid matches; anchor options disabled under −.

**`test/usePreferences.test.js` (extend)** — `anchorTotal` / `anchorKind` round-trip, invalid ⇒ 10 /
`bond`.

**Coverage:** the estate's new-file floor from `unknown-position.md` §6 (≥ 90 / 85 / 100 / 90) applies to
`src/components/NumberFrame.vue`, `src/anchorEngine.js` and the new test file. One floor, stated once;
raised by tests, never by excluding a file.

## 7. Migration

`mathGame.preferences` gains `anchorTotal` (5 or 10, absent or invalid ⇒ 10) in 3c-1, and `anchorKind`
(`bond` | `doubles`) in 3c-2. Same rules as `unknown-position.md` §7: validate on read, self-heal on save,
no schema version, and an install that never opens the mode behaves exactly as today.

## 8. Explicitly out of scope

- **Bridging through ten (A5)** — two-step interaction; its own increment or its own app. Pretending a
  one-tap drill teaches it would be the same lie as an inert speaker button.
- **Near-doubles** (4+5 as "one more than 4+4") — after plain doubles are secure.
- **Subtraction bonds** (13 − ? = 10) — after A5; it needs take-from-ten first.
- **A spoken prompt** — unchanged position: recorded audio is a later, separate increment across modes.
- **Per-item adaptivity between families** — the adult chooses the family; the app does not.

## 9. Build order and review disposition

**PR 1 (3c-1):** the mode with **make-ten only** — `anchorEngine.js`, `NumberFrame.vue`, `makeRng`, the
effective-keypad seam, the pass-length track, the picker entry, criteria 1–10. One family proves every new
mechanism exactly once.

**PR 2 (3c-2):** make-five (two passes) and doubles, `anchorKind`, criteria 11–14. By then the diff is
content, not machinery.

Disposition of `reviews/anchor-review-1.md`:

| Finding | Verdict | Where it landed |
|---|---|---|
| B1 keypad is driven by `maxLimit`; "limit ignored" had no mechanism | BLOCKER | §3 effective keypad length; criteria 5–7 |
| M1 blank rule unstated, so the 4/5 split was untestable | MAJOR | §3 assigned-blank rule; criterion 3 |
| M2 §4 said "8 or 9 cells" against a 4-item make-5 pass | MAJOR | §4 rewritten |
| M3 "the same rng the rest of the engine uses" — there is no such seam | MAJOR | §3 `makeRng`, anchor-only |
| M4 4-item celebration cadence unexamined | MAJOR | make-5 = two passes of 4 |
| m1 "same length as an ordinary round" for 9 | MINOR | §3 table ("one short") |
| m2 triple-contradictory coverage floors | MINOR | §6 one floor, stated once |
| m3 flaky "different shuffle order" criteria | MINOR | §5.1 and §6 seeded assertion |
| m4 latency bucket missing from the anchor log | MINOR | §5.10 |
| m5 keypad grid derives from `maxLimit` | MINOR | §3 effective length |
| (a) duplication with the I4 part-whole bar | — | kept both; §2 shares the cell primitive |
| (b) empty cells give the answer away | — | §2 reworded: never *prints* it, but is countable; latency log + adult caveat in the plan |
| (e) three increments dressed as one | — | split into 3c-1 / 3c-2 |

Nothing was rejected. One suggestion was not adopted: promoting "compute the distinct-item count before
fixing a round length" to an estate rule — it already lives in the kids'-maths skill, and a third copy is
how rules rot.
