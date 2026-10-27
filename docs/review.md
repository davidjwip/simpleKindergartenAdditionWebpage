Model: moonshotai/kimi-k3 (via OpenRouter). App-audit claims spot-checked read-only against the code clone.

# COVERAGE

All twelve questions have material.

1. **HK EDB K1–K3 expectations; drilling** — fully cited ([KG] §2.6.3 "repetitive drilling… can cause resentment"; Ch. 4; Appendix 2: recite to 20, count ten objects at 4–5; "simple" addition/subtraction at 5–6). EDB does not endorse symbolic drilling.
2. **HK P1 contents; position of a ≤10-fluent child** — 1N1–1N4 accurately documented (within 18 verbally, decomposition pairs only, "12+5 and 17–5 are not required"). The ahead/at/behind verdict is only implicit; assembled from the docs, such a child is at or ahead of term-one P1 demands.
3. **Written equations / memorised facts before age 6** — answered for all three systems: no operator in either EYFS ELG; CCSS K.OA.A.1 lists equations as one option in an *or* list; Singapore NEL defers `6 = 2 + 4` to primary.
4. **Number ranges by age, four systems** — comparison table complete; matches the verified standards.
5. **Uniform blank position at 4.5** — answered: 66.75% of items demand inverse reasoning, "a difficulty setting disguised as variety"; the doc honestly flags no fetched study measures this below age six.
6. **Wrong-answer policy** — answered as flagged judgement (no direct study), resting on Baroody's rote-first critique and EYFS "not afraid to make mistakes". The "Try again!" copy that discards the item is a verified code contradiction.
7. **Streak/reset as pressure** — answered; caveat stated: the anxiety evidence (Ramirez et al. 2016) is ages 6–8.
8. **Concrete/representational stage skipped** — answered via Baroody's three phases and EEF; the subitising gap is disclosed, not asserted.
9. **Constraint logic, tests, build** — verified in the code: uniform 1/3 blank, zero never operand or answer, NaN stored limit empties the keypad, mascot only when streak > 0, `% 10` track so step 10 never lights, wrong item discarded at 1.5 s. The 70/70 pass and coverage figures stand.
10. **Defects and highest-leverage changes** — app-audit §4–§5 deliver both, traced to evidence.
11–12. **Alignment and repo verdicts** — not the workers' to give; inputs are complete. Below. The only uncited claims are the two the evidence doc itself flags as gaps.

# ALIGNMENT VERDICT

**Aligned-with-changes.** The core loop (one-tap answer, immediate contingent feedback, short goal, no timer) fits the curricula; the defaults do not. Changes, by leverage:

1. **Default to result-unknown; missing-operand becomes a later, opt-in mode** — two-thirds of items currently demand inverse reasoning (evidence §3; unknowns-in-all-positions is Grade 1, 1.OA.A.1).
2. **Wrong answer: hold the item, one retry, then reveal the completed equation** — replaces a pure negative signal with the only teaching moment (evidence §4; EYFS "not afraid to make mistakes"; fixes audit defect 1).
3. **Cap the default limit at 10 and aim at composition, not sums** — every preschool system stops at 10; the high-leverage skill is part-whole ("5 is 3 and 2", make-10), exactly HK's 1N1 foundation (comparison "may not assume"; anchor §4.4; EYFS Number ELG).
4. **Remove punitive streak mechanics; keep the mascot through mistakes; fix the `% 10` track** (evidence §4, flagged extrapolation; audit defects 4–5, decisions 9–11, 14).
5. **Add a countable representation (dots/tallies) and an optional spoken prompt with replay** — opens items to Phase-1 counters and pre-readers (evidence §2, §6).
6. **Fix the wedged-state class**: clamp `setMaxLimit`, guard limit < 2, reject non-finite stored limits (audit defects 2–3).

# REPO VERDICT

**Expand this repo.**

- Small, healthy codebase: six source files, 70/70 tests, ~95% statement coverage, clean build, deployed HEAD verified.
- Defects are real but shallow — copy contradictions, unclamped inputs, a modulo off-by-one, missing persistence. Days of work, not a rewrite.
- The deep changes are mostly *removals and defaults*: one blank position, a retry path, a smaller limit, a quieter streak. The engine's guarantees (no zero, no degenerate items, answer ≤ limit) are correct and worth keeping.
- What the app must become to match the HK anchor — verbal, concrete, composition-first, short playful rounds, adult nearby — is a mode and content layer on the existing engine, not a different app.
- Hygiene: defect 10 (real children's names in the public footer) — remove regardless.

*Alternative:* start fresh only if the target pivots to a full concrete-stage manipulatives app (drag-objects, part-whole diagrams, speech-first). Even then, `mathEngine.js` and the test harness port over.

# CORRECTIONS NEEDED

1. **app-audit defect 9 is wrong; I agree with the orchestrator.** The test calls `testRandomField(1000)`; tolerance is 20% of the *expected count* (333.33 ± 66.67, strict `<`), so each field must land in (266.7, 400). A 250/400/400 split fails on both bounds. Strike "passing a 25/40/40 split"; the defect stands only for the celebration tests setting state directly.
2. **app-audit defect 11 is a non sequitur; I agree with the orchestrator.** The cookie is first-party, set via `document.cookie` on maths.zt489.com with `domain=.zt489.com`; the beacon POST target has no bearing on whether it is stored. The real reason `v` rotates under Safari is ITP's cap on JavaScript-set first-party cookie lifetimes, not cross-origin blocking. Rewrite the sentence.
3. Minor: hk-curriculum-anchor cites `EN_KS1_e.pdf`; the canonical file is lowercase — both return HTTP 200. No other citation-support failures; the evidence-doc gaps are disclosed, not asserted.

# WHAT I WOULD BUILD FIRST

Change the default blank to the answer position, cap the default limit at 10, and replace the wrong-answer path with hold → one retry → reveal ("3 and 4 make 7"). Those three edits turn the app from a symbolic quiz the curriculum documents warn against into practice of the exact skill every system names first — composition of numbers to 10 — with the error handling the evidence supports. Dots, streak softening, and the defect fixes follow after.
