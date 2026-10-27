# Early maths: what to teach, and what to do with the addition app

Research-and-review report, 26 Oct 2026. Evidence: four cited research docs plus a code audit in
`docs/`, an independent Kimi review in `review.md`, and the author's own checks against the EDB
primary sources and the repo's test suite.

## 1. The short answer

The app is a **well-built drill for the wrong default setting**. Its engine, tests and deployment are
in good shape; its curriculum is pitched at roughly **Year 1 / P1**, aimed at a child who is in **K2**.

Three defaults carry almost all of the misalignment:

1. **The blank is in the wrong place two-thirds of the time.** One of three boxes is blanked
   uniformly, so 66.75% of items ask for a missing operand (`4 + ? = 7`, `? − 2 = 3`) — inverse
   reasoning, which every curriculum here introduces *after* result-unknown, and which CCSS places in
   Grade 1 (1.OA.A.1, 1.OA.D.8). Only 33.25% are `a + b = ?`.
2. **A wrong answer throws the item away.** Buzz, 1.5 s, new question — the child never sees the
   right answer and never retries, while the copy says "Try again!". The one moment with teaching
   value is discarded.
3. **The limit defaults to 10 and can reach 20.** Every preschool curriculum stops at 10; 20 is
   Year 1 / Grade 1 / P1 territory. Worse, the limit is applied to operands *and* answers, so the
   modal item at limit 10 is a sum of exactly 10 (19.96%) and the modal subtraction answer is 1
   (27.28%).

Verdict: **aligned-with-changes**, and **extend this repo** — the change list is defaults, removals
and one new mode, not a rewrite.

## 2. What the systems actually expect (the anchor)

| Stage | Official expectation | Source |
|---|---|---|
| HK K1–K2 (3–5) | "recite from one to twenty"; "count up to ten objects"; compare quantities in words; **no** graded arithmetic | EDB KG Curriculum Guide 2017, Appendix 2 |
| HK K3 (5–6) | "count and write from one to twenty"; "do simple mathematical addition and subtraction" — no range, no algorithm, no fluency target | same, Appendix 2 |
| HK P1 term 1 | 1N1: numerals 1–20, counting on/back, ordinal/cardinal, odd/even, **decomposition of 2–18**. 1N2: add/subtract **within 18 verbally**, concept of 0, add–sub relation, commutativity, problems "presented mainly by diagrams", horizontal recording, no column form. Explicit:"operations such as 12+5 and 17–5 are not required" | EDB Explanatory Notes KS1 (2018), 1N1–1N2 |
| England EYFS (Reception) | deep understanding of numbers to 10 incl. composition; subitise to 5; automatic recall of bonds to 5 and some to 10. **No operator symbol anywhere** | EYFS statutory framework, ELG Number |
| England Year 1 | read/write `+ − =`; bonds within 20; "missing number problems such as 7 = ? − 9" | National Curriculum KS1 |
| US CCSS K | represent with objects/fingers/drawings *or* equations; add and subtract within 10; decompose to 10; make 10; **fluently within 5** | K.OA.A.1–A.5 |
| US CCSS Grade 1 | within 20, unknowns in all positions, fluency within 10 | 1.OA.A.1, 1.OA.C.6, 1.OA.D.8 |
| Singapore NEL K1–K2 | count to 20, count 10 things, write numerals, compare, name parts of a whole to 10. **No addition objective at all**; `6 = 2 + 4` is deferred to primary | MOE Nurturing Early Learners 2022 |
| Singapore P1 | `+ − =`, relationship, within 100 written, within 20 mental | MOE P1 syllabus 2021 |

Two things follow.

**Hong Kong and the international systems agree on the order, and both are behind the app.** Nothing
in K1–K3 is graded arithmetic. The P1 prerequisite that matters is **composition** — "5 is 3 and 2",
"how many more to make 10" — and *that* is what a four-year-old should be practising, whether or not
an equation is on screen.

**The EDB explicitly rejects the app's genre as a default.** "One-way teaching and repetitive drilling
on operations of mathematics can cause resentment" (KG Guide §2.6.3); K2/K3 must not get "mechanical
copying and calculation" and should not be given homework that is "excessive, frequent and too
difficult" (Ch. 4); pre-teaching primary content is prohibited (§6.1, §6.3). P1 itself caps even its
exploratory activities because "the objective is not for drilling of calculation".

That is not a reason to bin the app. It is a reason to make it a **five-minute supplemental game with
an adult nearby**, not the maths curriculum — and to make it practise composition and counting-on
rather than fact recall.

## 3. Where the app sits against that

| Design decision | Verdict |
|---|---|
| One screen, equation + keypad, no navigation | helps |
| Immediate contingent feedback, short 10-answer round | helps |
| No timer, no countdown | helps |
| Uniform blank position | **hurts** — 66.75% missing-operand |
| One tap auto-submits, no undo | **hurts** — mis-tap on a 20-button grid is scored as a misconception |
| Wrong → new item, no reveal, no retry | **hurts** — and contradicts its own "Try again!" copy |
| Streak that resets on any error, `Best:` shown beside it | **hurts** — accuracy pressure without a timer |
| Mascot rendered only while `streak > 0` | **hurts** — the child's character vanishes on the first mistake |
| "Problems Solved: X / Total Problems: Y" | **hurts** — 6/9 reads as failure |
| Limit applies to operands *and* answers, default 10, up to 20 | neutral in code, **wrong in default** |
| Zero excluded from keypad and from all items | **correct** — verified structurally: zero is never an operand, an answer or a required blank, so a 0 key would be dead |
| Numerals only, no quantity model | **hurts** at 4.5 — the only route is recall, the last phase of the standard progression |
| Chimes only, no spoken prompt or replay | **hurts** — a pre-reader cannot hear the item |
| Subtraction excludes all zeros (no `5 − 5`, no `a = 1`) | helps pedagogically, but removes the "nothing left" idea P1 introduces |

Verified facts about the code, not opinions: 70/70 tests pass, ~95% statements / ~87–89% branches
globally, clean build, deployed HEAD matches the built bundle. The tests are thorough on mechanics and
silent on pedagogy — nothing asserts what a wrong tap teaches.

## 4. Concrete defects worth fixing regardless

1. `useMathGame.js:42` promises "Try again!" while `:200-202` discards the item.
2. `mathEngine.js:16-19, 25-28` — unbounded `do…while`; limit < 2 never returns (verified: hangs, exit 124). `setMaxLimit` does not clamp.
3. `usePreferences.js:35` — a corrupt stored limit becomes `NaN`, and `v-for="n in maxLimit"` then renders **zero keypad buttons**: unplayable until storage is cleared.
4. `App.vue:299,304` — the progress track uses `problemsSolved % 10`, so step 10 never lights; the bar is empty exactly at the celebration.
5. `App.vue:294` — the mascot unmounts on the first wrong answer.
6. Celebration does not clear the pending 2 s timer, so an item is generated behind the overlay and thrown away; saving a limit generates twice.
7. `index.html` beacon: sends `{uuid, hostname, pathname}` to the collector. No input or content, but the id is a JS-set first-party cookie, so Safari's ITP caps its life and the "count once" rationale fails.
8. The public footer hard-codes two real first names. The owner has decided this stays in the maths app; it should not spread to any new repo.

## 5. Build order

Ship the first three changes together; they are small and they are the whole argument.

1. **Blank the result by default** (`a + b = ?`), and make missing-operand a separate later mode with
   a visible dot/part-whole model. One change moves two-thirds of items into the form being practised.
2. **Wrong answer: hold the item, allow one retry, then reveal the completed equation** ("3 and 4
   make 7") and advance. This is the EYFS "have a go … not afraid to make mistakes" line made real.
3. **Cap the default limit at 10**, and add a composition mode: "5 is ○ and ○", "how many more to
   make 10" — drawn as dots first, numerals second.

Then: soften the streak (best-of, never a visible collapse), keep the mascot on screen through
mistakes, drop the `X / Y` fraction, fix the `% 10` track, clamp the limit, and add an optional spoken
prompt with replay in English and Cantonese.

Do **not** add: interview question banks (aided-school P1 admission is by points and computer
allocation; "Schools must not conduct tests or interviews on the applicant children" — EDB POA
leaflet), column form, carrying/borrowing, `>`/`<` recording, or timed fact drills.

## 6. Where the evidence is weakest

- No retrieved source measures how much harder missing-addend is than result-unknown **below age six**;
  that it is harder is inference from the CCSS progression and Baroody's phases.
- The maths-anxiety evidence (Ramirez et al. 2016) is ages 6–8; applying it to a four-year-old is
  extrapolation, which is why the recommendation is "soften the streak", not "remove the goal".
- Retry-versus-replace has no direct study at this age — judgement, labelled as such.
- No RCT of touchscreen number apps for ages 3–6 was retrieved; no efficacy claim is made for apps as
  a category.

## 7. Method and spend

Kimi (kimi-k3) wrote the workstream split; four deepseek-v4-flash workers produced the four cited
docs; Kimi reviewed and ruled on alignment and repo decision. Approximate model spend for the whole
exercise: **$0.76** — planner $0.10, four workers $0.16, review $0.50 (the review is the expensive
round because it reads everything).

Docs: `docs/hk-curriculum-anchor.md`, `docs/international-comparison.md`,
`docs/arithmetic-learning-evidence.md`, `docs/app-audit.md`, `review.md`.
