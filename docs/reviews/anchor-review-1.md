# Review — anchor-facts.md (proposed Increment 3c)

Model: moonshotai/kimi-k3

Scope of this review: `specs/anchor-facts.md` and the new Increment 3c block in
`specs/improvement-plan.md`, read against `specs/unknown-position.md`, `specs/scope-map.md`,
`reviews/revision-review-1.md`, and the drill source at `/opt/data/cache/scratch/kgadd`
(read-only). House rules applied: one knob turns per level step; no timers; all levels open; the
round is a goal not a length; per-file coverage floors; no child data; design tokens unchanged.

---

## Findings

### BLOCKER

**B1 — The keypad is driven by `maxLimit`; "the limit setting is ignored" creates a new wedged-state class the spec never defines.**

> "The limit setting is ignored in anchor mode; the keypad is 1 … total. A limit of 5 must not make
> a make-ten item unanswerable." (§3)

The claim is right; the mechanism is absent. In the code under review the keypad is literally
`v-for="n in maxLimit"` (`App.vue:269`) and its grid columns are
`repeat(${Math.ceil(Math.sqrt(maxLimit))}, 1fr)` (`App.vue:267`) — keypad length and layout are the
stored preference, full stop. Anchor mode therefore needs an *effective keypad length* derived from
the mode (`anchor` ⇒ `total`), with the stored `maxLimit` left untouched and restored on exit. The
spec says none of this, and it says nothing about the two transitions that actually wedge:

1. Adult changes `limit` *while anchor mode is active* — does the keypad stay 1…total? (It must;
   unsaid.)
2. Adult changes mode or family *mid-pass* — the item, the keypad length and the pass-length
   progress track must change atomically, with pending timers cleared exactly once. This is the
   D3/D6 defect class the plan spent two increments closing, re-introduced through a new seam.

Acceptance criterion 6 tests only the static case (limit 5 stored, make-10 renders). Nothing tests
either transition.

**Replacement wording (§3, replacing the two bullet lines):** "Anchor mode derives its keypad from
the family, not from `maxLimit`: an *effective keypad length* of `total` (5 or 10) applies while the
mode is active; the stored `maxLimit` preference is never read or written by anchor mode, and
leaving the mode restores it exactly. Changing `limit` while anchor mode is active changes nothing
on screen. Changing mode or family mid-pass clears all pending timers, discards the current item
unscored, and regenerates item, keypad and progress track atomically (the D6 discipline from
unknown-position.md §4)." And two new acceptance criteria: "Given anchor mode is active, when the
adult changes the stored limit, then the keypad is unchanged and the stored preference round-trips
on exit"; "Given any anchor item on screen, when the adult changes family or mode, then timers clear
exactly once, the item is discarded unscored, and one new item renders with the correct keypad
length and track length."

### MAJOR

**M1 — The blankField assignment rule is missing, so criterion 3 is untestable and `5 + 5` is unspecified.**

> "Given any bond item, then `blankField` is `num1` or `num2` and never `answer`; across a total-10
> pass both blank positions occur (five of one, four of the other), and `5 + 5` appears once only."
> (§5, criterion 3)

A 5/4 split only falls out of a rule the spec never states. If `blankField` is random per item, the
split is binomial and the criterion is flaky; the only way it is deterministic is a rule such as
"blank the larger operand" (num1-blank for 1+9…4+6, num2-blank for 6+4…9+1, and `5+5` — whose two
blanks are the same item — assigned to one side by fiat). The make-5 pass has no central pair
(1+4, 2+3, 3+2, 4+1 ⇒ 2/2 under that rule) and the spec gives no analogous claim or rule for it.
`generateBond(total, blankField)` takes the field as a parameter but §3 never says who chooses it.

**Replacement wording (§3, after the generator block):** "`blankField` is assigned, never random:
for `a + b = total` with `a ≠ b`, the blank is the *larger* operand; for `5 + 5` the blank is
`num2` by convention (the two items would be identical). This yields a 2/2 split in a make-5 pass
and a 4/5 split in a make-10 pass — the asymmetry in criterion 3 is a consequence of the rule, not
a coin toss." Criterion 3 then asserts the rule's output, deterministically.

**M2 — §4 contradicts §3 on the progress track: "8 or 9 cells for bonds" vs a 4-item make-5 pass.**

> "Progress: the track shows the **pass**, not ten cells — 8 or 9 cells for bonds, 5 for doubles."
> (§4)

§3 and criterion 1 are explicit that make-5 is a pass of **4**. There is no 8 anywhere in the spec.
As written, the renderer requirement and the acceptance criteria disagree, and a test written from
§4 fails a build written from §3.

**Replacement wording:** "Progress: the track shows the **pass**, not ten cells — 4 cells for
make-5, 9 for make-10, 5 for doubles. The track length is a function of the active family and
changes atomically with it (see B1)."

**M3 — "The same rng the rest of the engine uses" does not exist; the engine calls `Math.random()` directly.**

> "Shuffle with the same rng the rest of the engine uses; add a seedable `makeRng(seed)` so the pass
> order is testable." (§3)

`mathEngine.js:9,10,17,18,26,27` call `Math.floor(Math.random() * …)` inline; there is no rng seam
anywhere in the engine or the composable. So the sentence specifies sharing with something that
isn't there, and silently scopes the refactor: does `makeRng` seed *only* the anchor shuffle, or are
the existing generators being converted? Converting them is out of this increment's stated size;
not converting them makes the sentence false.

**Replacement wording:** "This increment introduces `makeRng(seed)` (a small deterministic PRNG)
used **only** by the anchor pass generator and its shuffle; the existing generators keep calling
`Math.random()` and are untouched. Tests assert pass order by seeding; production passes an entropy
source (e.g. `Date.now()`), so seeds never appear in stored data."

**M4 — The 4-item celebration is unexamined: five celebrations a session cheapens the one reward the app has.**

> "The 4-item make-five pass is the first deliberately short round in the estate; it is short
> because the family is small, not because the goal moved." (§3)

The distinct-item argument for ending the round at a pass boundary is sound (see (c) below). What
the spec never addresses is the *cadence* consequence: a child who plays 20+ items a session at
make-5 now gets a celebration every 4 items — roughly five per session — and the celebration is the
app's only reward. Celebration inflation is the same failure mode as a 4-item round being
infantilising: the ritual stops marking anything. The spec should decide, not drift.

**Replacement wording (§3, after the pass table):** "Make-5's round is **two consecutive passes of
the family** (8 items, each pass shuffled independently, no in-pass repeat): the distinct-item rule
still binds within each pass, and the celebration keeps a cadence a 20-item session can sustain.
Make-10 and doubles run a single pass (9 and 5). The celebration itself — mascot, copy, overlay —
is byte-identical across families; only the track length and round length differ." (If the owner
prefers a true 4-item round, the spec must instead say so explicitly and record that the celebration
cadence for this family is deliberately shorter — but the default above is the better first guess.)

### MINOR

**m1 —** "total 10 … 9 — the same length as an ordinary round" (§3 table). An ordinary round is ten
right answers; 9 ≠ 10. Replace with "9 — one short of an ordinary round, the family's full size."

**m2 —** The coverage floors are internally contradictory: §6 says "new files at ≥ 95 / 90 / 100 /
95" and then sets `NumberFrame.vue` at "the same floors as `DotRow.vue` (≥ 90 / 85 / 100 / 90)" —
and `DotRow.vue` itself entered at 90/85/100/90 under unknown-position.md §6's rule "new files enter
at ≥90/85/100/90". Three different new-file standards in two specs. Fix: one new-file floor for the
estate (90/85/100/90, matching unknown-position.md §6), applied to `anchorEngine`-touching new
files and `NumberFrame.vue` alike, stated once.

**m3 —** Criterion 8, "the next pass is a different shuffle order", is flaky as written: a fair
reshuffle of 9 items repeats the exact order with probability 1/362880, and of 4 items with
probability 1/24 — a 4% flake rate per run for make-5. The criterion should assert the *mechanism*,
not the outcome: "given a completed pass, when the next pass starts, then the shuffle is re-invoked
(seeded `makeRng` advances), and across two fixed seeds the orders differ." Same repair applies to
the "shuffle that differs between passes" clause in criterion 1.

**m4 —** Criterion 12's log schema adds `total` and `kind` but drops the plan §5 fields that carry
this mode's only strategy signal — the time-to-first-tap buckets. Anchor mode is precisely where
"counted the empty cells" vs "recalled" must be distinguishable by the adult (see (b) below).
Add to criterion 12: "…and the time-to-first-tap bucket, as in improvement-plan.md §5."

**m5 —** The keypad grid columns are computed from `maxLimit` (`App.vue:267`); an anchor keypad of
1…10 while the stored limit is 5 silently changes the grid shape (3×2 → 4×3-ish) under B1's fix.
The spec should state that the keypad grid derives from the *effective* keypad length, not the
stored limit, so the layout follows the mode.

---

## The seven questions

**(a) Duplication.** Genuinely different — keep the frame, and keep both. The I4 part-whole bar is a
continuous linear row of `c` dots with a gap: it encodes "the whole is `c`, one part is shown, find
the rest" for *arbitrary* `c`. The five-/ten-frame encodes something the bar cannot: the *anchored
structure* of 5 and 10 — two rows of five, subitisable groups, "7 is 5 and 2" read off the frame's
geometry rather than counted along a row. That 5-anchor is not decoration; it is the entire content
of rungs A1–A3, and it is why the frame is the standard manipulative for exactly these facts. The
doubles frame (two groups of `a` in two shades) is the one case that drifts toward part-whole-bar
territory, but it is still discrete-structure work, not missing-part work. One caveat for the build:
the two components should share cell-rendering primitives, and the spec's promise that "the I4
part-whole bar is untouched" (improvement-plan 3c) holds — no fork of `DotRow.vue`.

**(b) The empty cells give the answer away.** It is scaffolding, not an answer key — and the spec's
own line "**The frame never shows the answer directly**" (§2) is simply false as written and should
be struck or reworded ("the frame never *prints* the answer; the empty cells make it countable").
Every mode in this estate is required to be answerable by counting something concrete before it is
answered by recall (improvement-plan §1; Baroody Phase 1 before Phase 3); a bond item whose empty
cells are countable *is* the concrete stage, and counting 3 outlined cells to answer "7 and ? make
10" is the intended strategy, not an exploit. The item is measurable — but what it measures must be
named honestly. Two additions the spec must make: (1) the log must keep the time-to-first-tap bucket
(m4 above), because first-try-correct in anchor mode means "counted correctly" and only a shift in
latency distinguishes counting from recall — this is exactly the counting→recall signal the plan's
§5 already defines for the other modes; (2) the adult-facing summary line for anchor families must
carry the plan §5 caveat in mode-specific words: "first-try here means the frame was read correctly,
not that the bond is recalled — recall shows up as fast answers, not as correct ones." With those,
the mode teaches and still yields a usable signal. Without them, the adult will read 100% first-try
at make-10 as mastery of bonds, which is the R2 misreading in a new costume.

**(c) The pass-based round.** It breaks one convention (round = ten right answers) and the break is
justified: ten right answers drawn from four distinct items is a drill in sequence memory, which is
precisely the failure the mode exists to prevent, and the house rule is "the round is a **goal**,
not a length" — a complete pass of the family is a legitimate goal. It does not break the progress
track convention provided M2 is fixed (track length follows the family). It does risk the
celebration economy, which the spec ignores: see M4. A 4-item celebration for a child who plays 20+
items a session is not infantilising in itself — the celebration copy is unchanged and the child
isn't counting — but five of them in a session devalues the ritual for the *other* modes, where ten
answers earns the same fireworks four answers earned a minute ago. Fix per M4: make-5's round is two
passes (8 items), single pass for the other two families, celebration identical across all. With
that, the pass-based round is a defensible first for the estate, and the spec's own rationale
("compute the distinct-item count before fixing a round length") should be promoted from a §3 aside
into the estate rule it plainly is.

**(d) Knob hygiene.** Not clean — this is B1, the blocker. Ignoring `limit` and `step` is the right
*policy* (the family defines the operands; a limit of 5 must not break make-10), but the spec
implements the policy as two one-line bullets and one static acceptance criterion, while the code
derives keypad length, keypad grid and track from the preference being ignored. The spec must say:
(1) anchor mode computes an *effective* keypad length from the family and never reads or writes the
stored `maxLimit`/`step`; (2) `limit` and `step` changes while anchor mode is active are inert on
screen but persist normally for the other modes; (3) mode/family changes mid-pass clear timers and
regenerate item + keypad + track atomically, item discarded unscored; (4) the keypad grid derives
from the effective length (m5). And test: the two B1 transition criteria, plus the existing
criterion 7 extended to assert that a `step` change made *during* an anchor pass takes effect only
on return to a step-consuming mode. That closes the wedged-state class; as drafted, the class is
open.

**(e) Scope.** Three increments dressed as one: bonds renderer + pass-goal machinery + keypad seam
is one; a second and third family behind the same mode id is another; the seedable rng and
pass-length track are infrastructure the first one needs anyway. Cut the first PR to: **`bonds`
total 10 only** — one family, `anchorTotal` present but with a single valid value (10), `makeRng`,
`NumberFrame.vue`, the pass-length track, the B1 keypad seam, and the mode picker entry. That PR is
still fully shippable (9 items, the flagship family, EYFS/K.OA.A.4 anchor) and it proves every new
mechanism — frame, pass goal, reshuffle, effective keypad — exactly once. Second PR adds make-5
(with M4's two-pass round) and doubles plus `anchorKind`; by then both new mechanisms are tested and
the diff is pure content. The improvement-plan's own risk line already says this ("shipping one
family first (`bonds` total 10)"); the spec's §5/§6 should be restructured to match it instead of
testing all three families in the first suite. Near-doubles, A5 and subtraction bonds are already
correctly out.

**(f) Numbers.** The ordered-pair counts are right: excluding 0, pairs summing to 5 are (1,4),(2,3),
(3,2),(4,1) = **4**; summing to 10, a ∈ 1…9 with 10−a ∈ 1…9 = **9**; doubles 1+1…5+5 = **5** (and
6+6=12 would exceed the 1…10 keypad, so 5 is also the *keypad-reachable* count, which the spec
should say). Excluding 0 is consistent with the whole estate: the engine never generates zero
(verified in `mathEngine.js` and asserted in unknown-position.md §5.16), and the NOT-build list
already records "a zero key" as excluded — §3's sentence recording the gap is the right handling.
The claim that "a total-10 pass contains five items with one blank and four with the other" is
**arithmetically true only under a rule the spec never states** (M1): 4 pairs have num1 < num2, 4
have num1 > num2, and `5+5` is the tie-breaker that makes it 5/4. Under "blank the larger operand,
5+5 blanks num2" the split is 4 num1-blanks and 5 num2-blanks — checkable deterministically. As
drafted (blankField random or caller-chosen), the claim is untestable or flaky. So: counts correct,
exclusion consistent, split claim correct-but-underspecified — fix per M1.

**(g) Testability.** Not checkable by a named test as written:
- Criterion 3's 5/4 split — no generator rule exists to assert against (M1).
- §4's "8 or 9 cells" — contradicts criterion 1; a track test cannot satisfy both (M2).
- The keypad-length transition behaviour — no criterion covers it at all (B1).
- §6's floor for `NumberFrame.vue` — two contradictory floors are named (m2).

Flaky as written:
- Criterion 8 ("the next pass is a different shuffle order") — 1/24 flake for make-5 on a fair
  shuffle; assert re-invocation and seeded orders instead (m3).
- The "shuffle that differs between passes" clause of criterion 1 — same defect, same repair.
- Criterion 3, if `blankField` were made random to satisfy "both blank positions occur" —
  binomial flake; the M1 deterministic rule removes this entirely.

Everything else (1, 2, 4, 5, 6, 7, 9, 10, 11, 12) is checkable in the repo's Vitest + happy-dom +
fake-timers harness, provided `makeRng(seed)` lands per M3.

---

## Before this spec is built — the three changes that must land

1. **B1: the effective-keypad seam.** Define keypad length (and grid, and track length) as
   mode-derived state, with the stored `maxLimit`/`step` untouched and restored on exit, and the
   atomic-regeneration rule plus the two transition tests for mid-pass mode/family/limit changes.
   Without this the increment re-opens the D3/D6 wedged-state class through its central feature.
2. **M1 + M2: the generation rule and the track fix.** State the blankField assignment rule (blank
   the larger operand; `5+5` blanks `num2`; make-5 is 2/2, make-10 is 4/5) so criterion 3 is
   deterministic, and correct §4's "8 or 9 cells" to "4, 9 or 5" so the renderer spec and the
   acceptance criteria stop contradicting each other.
3. **M3 + m3: an honest rng seam and non-flaky shuffle tests.** Introduce `makeRng(seed)` as a new,
   anchor-only seam (the engine today calls `Math.random()` directly), and rewrite criteria 1 and 8
   to assert shuffle re-invocation and seeded-order differences rather than "a different order".

(M4's make-5 two-pass round and (e)'s bonds-10-only first PR should also land, but they are scope
and cadence decisions the owner can take at PR time; the three above are correctness.)

**Repo:** it belongs in this repo — the mode reuses the item shape, the HOLD→RETRY→REVEAL machine,
the preferences seam, the log schema and the design tokens, and a separate repo would fork all five
for the sake of one new component.

*No curriculum objectives, standards or statistics were invented in this review; code claims were
verified against `/opt/data/cache/scratch/kgadd` (`App.vue:267–269`, `mathEngine.js:9–27`,
`usePreferences.js`, `useMathGame.js`) read-only, and combinatorial claims were checked
exhaustively. Where the spec's intent was plain but its wording wrong (M2, m1), the review says so
and repairs the wording rather than the intent.*
