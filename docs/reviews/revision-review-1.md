# Review 1 — proposed spec changes R1–R9 (revision-assessment-2026-10.md)

Model: moonshotai/kimi-k3

Scope of this review: the nine proposed changes, read against the assessment (private file, not
quoted here), `specs/improvement-plan.md`, `specs/unknown-position.md`, `specs/scope-map.md`, and the
drill source at `/opt/data/cache/scratch/kgadd` (read-only). House rules applied: one difficulty knob
turns per level step; no timers; no child data in committed artefacts.

---

## Verdicts

### R1 — Step-size axis on the drill: **ACCEPT-WITH-CHANGES**

**Replacement clause.** "Add `generateProblem(operator, limit, mode, step)` and an adult setting
'adding / taking away: 1 · 2 · 3–5 · any'. The default is **'any' for every install**; the proposal's
'default 1–2 for this child' is struck. Step is a *content* knob (which facts are in the pool), and
content defaults in this estate are pedagogical, not personalised — the same reason the mode default
is `result` for everyone and the adult opts the child into `part`/`start`. The adult who read the
assessment sets step 1–2 the same way she sets the mode; the code must not ship one child's
diagnosis as every install's default. The falsifier stands as written."

**Reason.** The evidence genuinely supports the axis: the failure line in the assessment runs along
the *size of the second operand*, not along the limit — fluent at the smallest addend, collapsed by
the next size up, and the centre's own learning plan sequences by addend, which is the one thing in
that document worth borrowing. At limit 10, difficulty really is dominated by `num2`, so the limit
knob is the wrong dial for this child — that part of the analysis is correct and is also visible in
the engine (`generateAddition` re-rolls until the sum fits, so small-limit pools are already
implicitly step-biased toward 1; a step axis makes that bias explicit and controllable). What the
evidence does not support is the personalised default: defaults are the pedagogy the app asserts for
an unseen child, and '1–2' is a prescription from one sitting of one paper. Keep the knob, lose the
default. Cost analysis in (c) below.

### R2 — Stop treating tap accuracy as mastery: **ACCEPT**

**Reason.** This is the best-supported item in the set and it is not over-fitting: the divergence it
names (fluent tapped arithmetic, near-absent written production; flawless counting, failing numeral
writing) is visible in the assessment without any arithmetic score needing to be trusted, and it
matches what the plan's own §5 already half-says by logging `firstTry` and reveal rate rather than a
raw percentage. The change is cheap (one sentence, one summary line, one restated success signal) and
it corrects a real misreading risk: the plan's current success signal reads as if 80% first-try at
limit 10 is evidence of arithmetic readiness, and for this child it is evidence of *tapping*
readiness only. The one-paragraph caveat in §5 and the per-(mode × step) restatement of the success
signal are exactly the right size of response. Accept as written; sentence for §5 in (d).

### R3 — Keep mode and step orthogonal; gate the hard modes by step: **ACCEPT-WITH-CHANGES**

**Replacement clause.** "`unknown-position.md` §4 gains: mode and step are orthogonal knobs and no
level transition turns both at once; a mode change preserves the current step; a corrupt or absent
step falls back to 'any'. The gating rule is restated as a *recommendation to the adult*, not a code
gate: the mode picker shows one line of copy against `part` ('start with step 1–2') and against
`start` ('keep step at 1'), but does not disable either mode by step. No new acceptance criterion
locks mode to step in the validator."

**Reason.** The orthogonality and migration rules are sound and already house-rule-consistent; the
three acceptance criteria (no double turn, step preserved on mode change, corrupt step → 'any') are
cheap and testable. But the *hard gate* ('`part` opens at step 1–2, `start` at step 1') encodes one
child's position in one assessment as app policy. The inference behind it is real — inverse reasoning
on facts the child cannot yet count on directly is two unknowns at once, and the evidence doc's
count-on-before-derived-facts point supports it — but the evidence does not show that this child
fails `a + ? = c` at step 3; it shows he fails *written* arithmetic at step 3, which (per R2 and per
the proposal's own central claim) the paper cannot attribute to arithmetic. Gating `part` behind a
step the paper never measured in the app modality is building policy on a lower bound. Copy-level
advice keeps the sequencing wisdom; a code gate bakes in the confound.

### R4 — Promote a counting-structure tier above money: **ACCEPT**

**Reason.** This is the item least dependent on the paper's hardest items. Counting backward and skip
counting scored zero, yes, but the tier's content is independently anchored: skip counting in 2s, 5s,
10s and tens/units are 1N3 content, counting on/back is 1N1, and the scope-map's own table already
lists 'count on / count back' and 'tens/units, count in 2s, 5s, 10s' as **build** — R4 is a
sequencing change (above money), not a coverage change, and sequencing money last was already the
map's §5 recommendation ('money last — nothing else depends on it'). The proposal is honest that the
paper's backward-counting rung was pitched above K2 (from a two-digit number), so the tier is built
at the curriculum rung, not the paper's rung: backward from 10 before 20, skip counts along a number
line. That is teaching to the anchor, not to the test. Accept as written.

### R5 — Every halves item demonstrates the split first: **ACCEPT**

**Reason.** The assessment's halves result is a task-comprehension failure — the produced marks bore
no relation to a dividing line — and you cannot measure a judgement the child does not know is being
asked for. 'Demonstrate the split, then ask' is the minimal honest repair and it aligns with the
KG pedagogy the scope-map quotes ('simplicity and concreteness concentrating on one attribute at a
time'). Crucially it does not add a rung to the ladder; it changes how every existing rung opens,
which is presentation, not scope. The one caution is that this makes the POC's H2 screen carry an
animation before it carries a question — acceptable, because the split animation is the same geometry
the judge uses (R7), so it is built once either way. Accept as written, but note it is conditional on
the halves app existing at all — see (e); do not let R5/R6/R7 become reasons to grow the POC beyond
the map's two-screen brief.

### R6 — Choose a line before placing one: **ACCEPT-WITH-CHANGES**

**Replacement clause.** "Insert between H3 and H5: 'Which line cuts this into two equal pieces?' —
three candidate lines on the same shape (one equal-area, one clearly unequal, one near-miss).
Recorded in the ladder as **H4b, deferred past the POC**: the POC scope in scope-map §5.2 (H2 + H3
only) is unchanged; H4b is built only if the POC shows the child can do H3 discrimination and the
motor-demand confound actually appears in placed-line play."

**Reason.** The concept/motor separation argument is right — a wobbly, non-vertex-to-vertex placed
line measures the wrist, and the clock app's tap-over-drag lesson is directly on point — but the
POC's own logic (§5.2: build the smallest thing, watch the child, then decide) applies to R6 itself.
The assessment shows the child could not do the *placing* task at all; it does not show he could
*choose* a halving line, so R6's premise (choosing measures the concept cleanly) is plausible but
unverified for this child. Writing the rung into the ladder now costs nothing; committing to build
order now re-opens exactly the scope-creep the map warned against. Also note the rung numbering: H4
('find the half' among four pictures) already exists as 'production under choice', so R6 should be
placed and numbered relative to H4 explicitly — the proposal says 'between H3 and H5' without
acknowledging H4, which is a drafting slip to fix when applied.

### R7 — Judge on equal area; animation shares the judge's geometry: **ACCEPT**

**Reason.** This is a correctness requirement, not a feature, and the scope-map already carries the
equal-area note; R7's addition — one pure geometry function drives both the animation and the
judgement — is the only way to keep the screen and the score from disagreeing, and it makes the
geometry module the provable core the map says is 'the one worth proving first'. The symmetry trap is
real (a rectangle has infinitely many halving lines; the diagonals of a square are halves) and the
assessment's own cartoon-head item is the counter-example — a symmetry task in halves clothing. This
change needs no evidence beyond geometry; it would be right if the assessment had never happened.
Accept as written. It is also the only halves item that should be allowed to affect the POC brief:
the POC judge must be the area function from day one, because a wrong area function is invisible.

### R8 — Numeral writing stays on paper: **ACCEPT**

**Reason.** The temptation this rules against is real — numeral production is the single largest gap
the assessment shows, and the whole proposal is a reaction to that gap. The reasoning is correct on
three grounds the documents already carry: formation and motor practice need a pencil (a
stroke-tracing page is a different product with finger capture and glyph matching and no maths); the
KG guide's prohibition on 'mechanical copying' pushes against doing it in-app at all; and the
falsifier is well-formed (a term of paper practice, then revisit as its own small app if nothing
moved). The one weakness is that 'the largest single gap' is the paper's framing — it is the largest
gap *relative to what school will ask for*, not necessarily the most valuable next thing for a K2
child — but the verdict (don't build it) is right regardless. Accept as written.

### R9 — Explicit non-changes: **ACCEPT**

**Reason.** All four non-changes are correctly reasoned. Limit staying at 10/20 is right: the paper's
two-digit items are P1–P2 content under a K1–K2 cover (scope-map §1.4), and raising the app's ceiling
in response would be building to the paper — the exact pre-teaching the EDB anchor prohibits. 'No
timed anything' needs no assessment support; the plan already excludes it and nothing in the evidence
argues for speed. The 8-increment order standing is consistent with R1–R3 being an added knob and a
caveat rather than a reordering — though note R1's step axis does not appear in any of I1–I8, so
R9's 'they do not reorder I1–I8' should gain a companion sentence saying *where* step lands (see (c):
it belongs after I3's mode machinery, as its own small increment, not silently appended to I3).
The footer credit is a settled owner exception. Accept with that one addition.

---

## The five questions

### (a) Over-fitting

**Would survive without the paper:** R2 (the recognition/mastery divergence is visible in the
owner's own live observation — the app has always measured taps; the paper merely made it undeniable),
R4 (sequencing money last and building number-sense next was already scope-map §5's position), R7
(pure geometry; would be right for any child or none), R8 (a scope decision resting on pedagogy, not
scores), R9 (all four non-changes are house-rule or anchor restatements).

**Survive only because of the paper:** R1 (the step axis is a direct read of the per-addend failure
gradient), R3's gating (the step gates are the paper's gradient turned into policy — hence the
softening to copy), R5 (the comprehension failure is a paper observation; nothing else in the estate
evidences it), R6 (the motor-masking reading of one placed line).

**Teaching to the test:** the rejected part of R1 — defaulting every install to step 1–2 — is the
clearest case: it converts the centre's per-addend book sequence into the app's default pedagogy.
R3's hard gates, as proposed, are the second case, for the same reason. Both are fixed by the
replacement clauses above. R4 flirts with it (backward counting and skip counting scored zero) but
escapes because the tier is pitched at the 1N1/1N3 rungs, not the paper's rungs. Nothing else is
test-teaching; in particular R9's refusal to raise the limit is the explicit anti-test-teaching
move.

### (b) The missing alternative

Yes — the proposal's 'lower bound' reading is the most defensible single reading, but it is not the
only one the data admits, and three alternatives deserve naming. **Fatigue and item order:** fifty
written items for a four-year-old, with the written arithmetic block sitting after earlier written
demands and the numeral-writing grid first, means later production items carry the fatigue of earlier
production failures; a child who has already struggled to write for several pages may stop producing
altogether, which would depress arithmetic independent of both numeral-writing skill and arithmetic
skill. **The centre's marking and level mislabel:** the hard half is P1–P2 content under a K1–K2
cover (scope-map §1.4), so the 'hard' figures partly measure exposure the child was never supposed to
have; the gradient within arithmetic (fluent at the smallest addend, nothing beyond) is therefore
partly a teaching-coverage artefact, not a cognitive boundary. **Rote versus meaning:** in-app
fluency could be an association drilled by the app itself rather than composed number sense — the
app's own items are the practice set — so the paper may be detecting *transfer* failure, not just
production failure; the plan's own NOT-build list already worries about this shape of problem
('adaptivity now would be a random-number generator' is the same scepticism pointed inward).

Do these change verdicts? Only at the margins, and they mostly *strengthen* the review's changes: the
fatigue/order reading reinforces R2 (never advance on app numbers) and R8 (the writing gap may be
smaller than the paper's framing); the rote-versus-meaning reading is the strongest argument for R1's
step axis being paired with the counters (Increment 7) rather than alone — a step-1 pool answered by
rote is still rote. It does not rescue R3's hard gates: transfer failure is not measured by the paper
either. No verdict flips; R1's clause gains one rider — 'the step axis ships together with, or after,
the counters of Increment 7, so small-step items remain countable rather than merely easier to recall'.

### (c) R1's cost

The cost is real but bounded, and it is justified — with the default fix and the counters rider. Item
shape gains one field (`step`, or better: no field at all — `step` is a *generator input* like
`limit`, not item data; the item already carries `num2`, from which step is recoverable, so persist
`step` in preferences and in the log, not on the item — that removes the 'new field on the item
shape' cost entirely and matches how `limit` is treated today). Persistence is one more whitelisted
key in `usePreferences` (same pattern as `mode`, §7 rules already written: validate on read, absent →
'any', self-heal on save). Validator and tests: one generator constraint (`num2 ≤ stepCeiling` for
`+`/`-`; for `part`/`start` modes the constrained operand is the larger one, per the proposal) and a
1,000-item invariant sweep per (mode, operator, step) — a table extension, not a new suite.

Concretely, if it lands: **unknown-position.md §4** — the `generateProblem` signature becomes
`(operator, limit, mode, step)`; the mode→blank table is unchanged; add one line to the item-shape
block stating `step` is a generation parameter recorded on the log entry, never on the item; the
migration note §7 gains the `step` whitelist (`['1','2','3-5','any']`, absent/corrupt → 'any').
**§6** — extend the engine invariants sweep to sweep step; add the preferences round-trip for `step`;
add one composable test that a step change regenerates exactly once and preserves mode (the mirror of
criterion 19). **Level validator / acceptance criteria** — the R3 replacement clause's three criteria
live here: no level transition turns mode and step together; mode change preserves step; corrupt step
→ 'any'. Nothing in §3 (the start-mode representation) changes. Increment placement: a new small
increment between I3 and I4 (step is independent of the operand-blank machinery and should not ride
inside I4's diff).

### (d) R2's scope

It caveats §5; it does not gut it. The logging schema, the per-mode first-try accuracy, the
reveal-rate signal and the trend arrow all survive — they are measurements of *tapping fluency and
strategy*, which is exactly what the app is for; what dies is only the unspoken inference from
first-try accuracy to arithmetic mastery and to school readiness.

**The sentence §5 should carry:** "These figures measure tapped answers in this app; they are a lower
bound on, not a measurement of, written arithmetic, and no level change (limit, step or mode) is made
by the numbers alone — the adult decides, using paper work as the other leg."

**Should the adult summary show a percentage at all?** Yes — but never bare, and never as a single
rolled-up figure. Per-mode first-try percentages with the reveal count beside them are the honest
form (a mode at 85% first-try with a falling reveal rate says something; a bare '80%' says nothing
and invites the mastery misreading R2 exists to kill). The audit's D7 already removed the accuracy
*fraction* from the child's screen for the same reason; the adult surface keeps percentages because
the adult needs trend granularity, wrapped in the one-line caveat.

### (e) R5/R6 — halves

'Demonstrate the split, then ask' (R5) is the right response and is presentation, not scope. 'Choose
a line before placing one' (R6) is the right *ladder* entry but the wrong *build* commitment — as
amended, it is recorded and deferred. Together, unamended, they would be two rungs of scope creep on
an app that does not exist: the map's §5.2 brief is a two-screen POC whose entire purpose is to find
out whether 'same size' is a phrase this child can act on, and R5/R6 pre-answer questions the POC is
supposed to ask.

**Minimum viable first level, if it lands — three screens:**

1. **The split demo** (R5's screen): one shape family (circle, square, rectangle); shape splits along
   a line, the two pieces separate; no question. This is also the geometry-function proof.
2. **H2 — same size?:** two pieces of the same shape, equal or clearly unequal; tap 'same' / 'not
   same' (or tap the halves). The teaching rung, non-example included.
3. **H3 — is this half?:** one shape, one cut, yes/no; vertical, horizontal, diagonal cuts. The
   discrimination rung, judged by the area function.

That is the map's H2 + H3 brief plus R5's demonstration screen — no H4b, no placing, no quantities.
Watch the child on those three before anything else is scheduled.

---

## Ranked: the three changes that matter most

1. **R2** — the measurement caveat. It is free, it corrects the lens through which every future
   number will be read, and it protects every other decision from the app's flattering data.
2. **R1 as amended** — the step axis with a pedagogical default and the counters rider. It is the
   only proposed change that alters what the child actually practises day to day, aimed at the one
   gradient the evidence shows clearly.
3. **R7** — the shared geometry function. It is the foundation under the entire halves app; a wrong
   or forked area judge poisons every rung above it invisibly.

**Tomorrow, in the drill repo:** land Increment 1 exactly as planned (the per-file coverage gate plus
the wrong-answer hold/retry/reveal contract) — it is prerequisite to everything, unaffected by this
review, and the step axis that follows it should ride on a suite that can actually fail.

*No curriculum objectives, standards, studies or statistics were invented in this review; every
anchor cited (1N1–1N3, KG guide, EYFS, CCSS, the evidence doc's count-on point) is quoted from the
documents under review. Where the evidence could not bear a claim — the R3 step gates, the R6
choosing premise — the review says so and defers to observation rather than to the paper.*
