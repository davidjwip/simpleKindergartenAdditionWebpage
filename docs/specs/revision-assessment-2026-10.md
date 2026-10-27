# Proposed spec changes, from the October 2026 concept assessment

Status: **for review** (not yet applied). Reference: `private/assessment-2026-10-24-mathconcept.md` —
that file holds the child's scores and must never be committed. This document carries no child data;
it records what the assessment implies for the three existing documents.

Documents under revision: `specs/improvement-plan.md` (the drill, 8 increments),
`specs/unknown-position.md` (the equation-form spec), `specs/scope-map.md` (the estate, incl. the
halves app).

## What the assessment established (no numbers here — see the private file)

Three findings, in descending confidence:

1. **He counts and compares well, and produces nothing on paper.** Forward counting, comparison,
   shape recognition, patterning, ordering and clock-face filling all scored fully; *writing* numerals
   and every written arithmetic item above "add one" did not. The paper cannot separate numeral
   production from arithmetic for this child.
2. **The app is measuring recognition, not mastery.** Sums he failed on paper he answers happily by
   tapping. Tap-to-answer and write-the-answer are different tasks, and only one of them is what school
   asks for.
3. **Halves are absent as a concept, not weak.** His answer to "draw a line to cut the shape in half"
   bore no relation to a dividing line: the task itself was not understood.

## Proposed changes

Each is tagged `[E]` evidence (the assessment or a curriculum anchor says so directly) or `[I]`
inference (consistent with it, but not proved by it), with a confidence and a falsifier.

### R1 — Add a **step size** axis to the drill `[E/I]` — confidence high

**Change.** `generateProblem(operator, limit, mode, step)` and an adult setting "adding / taking away:
1 · 2 · 3–5 · any" (default 1–2 for this child). The step constrains `num2` for `+` and `−` (and
correspondingly the larger operand for `part`/`start`).

**Why.** His arithmetic stops at +1 (and half of +2) and every subtraction beyond −1 fails; the
centre's own plan sequences by addend too (Adding 2, 3, 4, 5, then "Addition Fact"). Independent
support: count-on by small numbers is the documented strategy before derived facts
(`arithmetic-learning-evidence.md` §1). The limit knob is the wrong dial for him: at limit 10 the
difficulty is dominated by the size of the second number.

**Falsifier.** If a week of play at step 1–2 shows no improvement in either taps or paper, the axis is
not the constraint and should be removed rather than kept as decoration.

### R2 — Stop treating tap accuracy as mastery `[E]` — confidence high

**Change.** (a) `improvement-plan.md` §5 gains one sentence: the app's accuracy figures measure
*tapping*, and must not be used on their own to advance limit, step or mode — the adult decides.
(b) The adult-facing summary says so in one line rather than showing a bare percentage.
(c) The plan's "success signal" is restated per (mode × step), not per limit.

**Why.** Counting 0–20 scored fully while writing the same numerals scored zero; in-app addition is
fluent while paper addition fails from +3. The skill (tapping) and the school task (writing) diverge,
and the current plan's §5 reads as if app accuracy is the evidence for readiness.

### R3 — Keep mode and step independent, and gate the hard modes `[I]` — confidence medium

**Change.** `unknown-position.md` §4 says the two knobs are orthogonal; `part` mode opens at step 1–2,
`start` mode at step 1. Add three acceptance criteria: no level turns both knobs at once; a mode change
preserves the current step; a corrupt/absent step falls back to "any" for adults who never touch it.

**Why.** Inverse reasoning (`a + ? = c`) applied to facts he cannot yet count on directly is two
unknowns at once. The house rule already says one knob per step
(`kids-early-maths-practice`: content / representation / task); step is part of content, so mode and
step must not move together.

### R4 — Promote a counting-structure tier in the estate `[E]` — confidence high

**Change.** In `scope-map.md`, move the number-sense items **above money** and name the tier: count
backward from 10 then 20; count in 2s, 5s, 10s along a number line and a 10×10 square; teen numerals
as "one ten and some ones"; compare and order within 20. All are P1 1N3/1N1 content.

**Why.** Both skip counts and the backward count scored zero — and backward counting from a two-digit
number is a P1 skill being asked of a K2 child, so the *tier* is right even though the paper's rung was
too high.

### R5 — Every halves item **demonstrates the cut** before it asks anything `[E]` — confidence high

**Change.** In `scope-map.md` §4 (and in the halves app spec when written): a level-1 screen shows a
shape splitting along a line and the two pieces separating, then asks "same size?". The reveal on every
later item replays the split. No item is asked before a split has been seen that session.

**Why.** The failure was task comprehension, not judgement: nothing that looked like a dividing line
was drawn. A child who does not know that "cut in half" means *split into two pieces* cannot fail the
test honestly.

### R6 — **Choose a line before placing one** `[E/I]` — confidence high

**Change.** Insert between the current H3 and H5: "Which line cuts this into two equal pieces?" — three
candidate lines offered on the same shape (one equal-area, one clearly unequal, one near-miss). Only
then "place the line" (H5).

**Why.** His placed line was wobbly and not vertex-to-vertex, i.e. the motor demand masked the concept.
Choosing measures the concept; placing measures the wrist. Same rule as the clock app's tap-over-drag
finding.

### R7 — The judge tests **equal area**, and the animation shares its geometry `[E/I]` — confidence high

**Change.** `scope-map.md` §4 note (already added, keep it) plus one addition: the split animation is
driven by the same pure geometry function that judges the item, so what the child sees and what is
scored cannot disagree.

**Why.** A rectangle has infinitely many halving lines; a square includes both diagonals. A
symmetry-line judge would mark correct cuts wrong, and a separate animation path would sooner or later
show a split the judge disagrees with.

### R8 — Numeral writing stays on paper `[I]` — confidence medium-high

**Change.** `scope-map.md` records it explicitly as out of app scope, with the reason (formation and
motor practice need a pencil), and names the falsifier: if paper practice has not moved the numeral
writing in a term, revisit a tracing page as its own small app.

**Why.** It is the largest single gap in the assessment, and the temptation will be to build it. A
stroke-tracing page is a different product (finger capture, glyph matching, no maths), and building it
now would pull effort from the two things the app estate is actually good at.

### R9 — Explicit non-changes `[E]` — confidence high

Recorded so the review does not reopen them:

- **Limit stays 10 by default, 20 available.** The paper's two-digit sums are why it failed, not the
  app's ceiling; raising the limit would repeat the paper's mistake.
- **No timed anything.** Nothing in the assessment argues for speed; the failures are production, not
  latency.
- **The drill's 8 increments and their order stand.** R1–R3 add a knob and a caveat; they do not
  reorder I1–I8.
- **The footer credit stays** (owner decision, unchanged).

## What would change the picture

A second assessment after a term of writing practice would separate "cannot write" from "cannot
calculate". Until then, every arithmetic number in this family of papers is a lower bound on his
arithmetic, not a measurement of it.
