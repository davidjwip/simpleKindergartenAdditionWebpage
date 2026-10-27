# Developmental evidence on early addition and subtraction, and what it implies for a drill app

Model: deepseek-v4-flash. Judging one design: single-screen Vue 3 drill, `a + b = ?` or `a − b = ?`, one of three boxes blanked at random, keypad 1..limit, one tap auto-submits, right → chime + 2 s, wrong → buzz + 1.5 s then a new item (missed item never returns, no answer shown), streak resets on any error, 10 correct → celebration then reset, English only, no speech.

Scope note: the user is four; much of the evidence below was collected at 5–9. Where so, I say so, and I flag gaps rather than dress reasoning up as evidence.

## 1. Counting progression and response time

Baroody's three phases: "Phase 1: Counting strategies — using object counting (e.g., with blocks, fingers, marks) or verbal counting to determine an answer"; "Phase 2: Reasoning strategies — using known information (e.g., known facts and relationships) to logically determine (deduce) the answer of an unknown combination"; "Phase 3: Mastery — efficient (fast and accurate) production of answers" (Baroody, 2006, p. 22). His examples show the distance: one child counts five fingers up from "six"; another derives 6 + 5 from 5 + 5 = 10.

Clements and Sarama add that a trajectory is "a mathematical goal; a developmental path...; and a set of instructional activities, or tasks, matched to each of the levels of thinking in that path" (Clements & Sarama, 2009) — tasks pitched above the child's level don't teach the next level.

Response time follows: count-on is serial — for 6 + 3 the child produces three successive number words while holding the start value, multi-second work at four. Diamond notes "young children often rush to respond and thus make errors by giving the prepotent response", and that more time helps "because young children need time to compute the answer" (Diamond, 2013).

**Design implications for a drill app for a four-year-old**
- Auto-submit converts the first plausible tap into a scored answer; a child mid-count taps early. A confirm tap would let counting finish — otherwise the app measures guess latency.
- Size items to the slowest legitimate strategy: sums within 10 are reachable by count-on; sums to 20 with a 20-key pad invite guessing.

## 2. Subitising and concrete → representational → abstract

**Verification gap:** I could not retrieve a primary subitising source (Clements 1999; the Sarama & Clements subitising trajectory) within the eight-fetch budget, and the article I did fetch does not discuss subitising, so I claim nothing about subitising thresholds.

The sequencing claim is supported. Phase 1 is object/finger counting; Phase 2 reasons *from* known facts; symbolic recall is Phase 3, reached last. Level-matching says instruction should sit at the child's current level — for most four-year-olds, early counting. The EEF's ages 3–7 guidance builds on this: maths threaded through physical activity, "board games (such as Snakes and Ladders)" as "particularly beneficial to developing understanding of numbers", picture books, talk.

So symbolic-only drilling skips a stage: the item offers no quantity to count and no known fact to reason from, leaving recall — the phase Baroody places last — as the only route.

**Design implications for a drill app for a four-year-old**
- A dot/object representation of the addends (or tap-to-reveal counters) lets a pre-Phase-3 child answer by counting. Same item, two entry levels.
- With no representation, a wrong tap says nothing about why; the child cannot reconnect symbol to quantity afterwards.

## 3. Missing-addend / unknown-in-any-position

The Common Core progressions treat the inverse relation as a later achievement: "Initially, the meaning of addition is separate from the meaning of subtraction, and students build relationships between addition and subtraction over time. Subtraction comes to be understood as reversing the actions involved in addition and as finding an unknown addend" (Common Core Standards Writing Team, 2011).

Against Baroody's phases, `4 + ? = 7` is not a variant of `4 + 3 = ?`. Result-unknown is answerable by counting on; addend-unknown requires holding the target, holding the known part, and inverting — a reasoning step, and decomposition is "arguably the most WM-intensive arithmetic problem solving strategy" (Ramirez et al., 2016). That algebraic reach is why the progression makes it a goal.

**Gap:** no fetchable study measures how much harder addend-unknown is than result-unknown below age six; that it is harder is inference from these two sources, not a measured effect.

**Design implications for a drill app for a four-year-old**
- Uniform blanking makes roughly two of every three items unknown-addend or unknown-start — a difficulty setting disguised as variety.
- `? − 3 = 4` is the hardest form in the set and currently as likely as `7 − 3 = ?`. Result-unknown should be the default; other positions should be a deliberate, later, visually supported mode.

## 4. Timed drill, speed pressure, error handling

Closest sourced evidence is ages six to eight. Ramirez et al. found math anxiety "negatively relates to [children's] use of more advanced problem solving strategies", with the relation "strongest in children with the highest working memory capacity" — anxious high-WM children avoid the strategies that would help them; some report anxiety "as early as first and second grades" (Ramirez et al., 2016). Baroody: rote-first instruction "makes learning the basic number combinations unduly difficult and anxiety provoking" (Baroody, 2006).

No clock is on screen, but the streak is a live score of unbroken success that one slip zeroes — accuracy pressure without a timer.

On retry-versus-replace I found no direct comparison at this age, so this is judgement, flagged as such. Baroody's college senior who could still recite a division row but "cannot recall what the combinations themselves were" is an argument about absent meaning; a buzz with no answer supplies none. The missed item vanishes, so the child gets neither the answer nor a second attempt — only a negative signal.

**Design implications for a drill app for a four-year-old**
- Show the correct answer and allow one retry; otherwise an error teaches nothing.
- Make the streak forgiving (best-streak, not current-streak) so one slip doesn't erase visible progress.
- 1.5 s is shorter than it takes to register a correction; if one is added, lengthen the pause.

## 5. Working memory at four to five

Diamond: "Doing any math in your head requires WM", a "limited-capacity workspace" (Diamond, 2013). Decomposition holds several intermediates; `3 + ? = 8` has that shape — hold the total, hold the known part, subtract. **Gap:** no capacity figure for four-year-olds was verified, so none is given.

So item *form* consumes capacity before any arithmetic does. `4 + 3 = ?` loads two numerals and an operation; `4 + ? = 7` loads those plus a representation of absence — a different task, not a harder version.

**Design implications for a drill app for a four-year-old**
- One unknown at a time, and hold the blank position stable within a session instead of moving it at random.
- Keep addends small and the keypad limit near the largest answer in play; a 1..20 pad for sums within 10 adds twenty scan targets to a loaded task.

## 6. Tablet/touchscreen maths apps

The EEF's digital-technology guidance concerns technology that aims "to improve learning directly", valuing it as "increasing the quality and quantity of pupil practice" plus better assessment information for the adult — and it excludes screen time and mobile devices, so it does not endorse unsupervised tablet use by a four-year-old. The EEF's 3–7 maths guidance puts the weight on interaction: maths across the day, board games, picture books, talk. **Gap:** no RCT of touchscreen number apps for ages three to six was retrieved, so I claim no efficacy for apps as a category.

**Design implications for a drill app for a four-year-old**
- Position as short supplementary practice (five minutes, adult nearby), not the curriculum.
- The missing spoken prompt is the largest lost affordance: speech gives a pre-reader access to the item and could voice the correct answer on error — the feedback the design currently omits.

## Sources

- Baroody (2006), *Why Children Have Difficulties Mastering the Basic Number Combinations*, Teaching Children Mathematics 13(1): https://www.kentuckymathematics.org/docs/eerti-BaroodyTCM2006.pdf — three-phase model; rote-first teaching called anxiety-provoking and pattern-blind.
- Clements & Sarama (2009), *Learning Trajectories in Early Mathematics*, Encyclopedia on Early Childhood Development: https://mast.ecu.edu/Learning%20Progressions/Learning%20Progressions%20-%20Students%20with%20Significant%20Disabilities/Clements_Sarama_2009.pdf — trajectory = goal + path + level-matched tasks; ages approximate.
- Ramirez, Chang, Maloney, Levine & Beilock (2016), J. Experimental Child Psychology 141: https://www.hyesang-chang.com/pdf/Ramirez,%20Chang,%20Maloney,%20Levine,%20&%20Beilock%20%282016%29.pdf — anxiety predicts less use of advanced strategies, strongest in high-WM children.
- Diamond (2013), *Executive Functions*, Annual Review of Psychology 64: https://pmc.ncbi.nlm.nih.gov/articles/PMC4084861/ — mental arithmetic requires WM; young children rush to answer and benefit from time to compute.
- Common Core Standards Writing Team (2011), K–5 Operations and Algebraic Thinking Progression: http://commoncoretools.me/wp-content/uploads/2011/05/ccss_progression_cc_oa_k5_2011_05_302.pdf — addition and subtraction meanings start separate; subtraction later becomes finding an unknown addend.
- EEF, *Improving Mathematics in the Early Years and Key Stage 1*: https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/early-maths — five recommendations for ages 3–7; board games flagged as beneficial for number understanding.
- EEF, *Using Digital Technology to Improve Learning*: https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/digital — technology valued for quality/quantity of practice and assessment; screen time and mobile devices out of scope.

**Fetch failures:** IES/WWC *Teaching Math to Young Children* PDF and an ERIC mirror returned wrong or missing documents; the EEF early-maths PDF failed, so that entry cites the landing page only; the UCL repository PDF for Outhwaite et al. (2020) failed. No subitising primary source and no missing-addend-versus-result-unknown comparison at ages 3–6 were retrieved; both are flagged as gaps above, not asserted.
