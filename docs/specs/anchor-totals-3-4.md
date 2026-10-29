# Spec — anchor totals 3 and 4 ("Make 3", "Make 4")

*Increment 3c-3 for `improvement-plan.md`. Extends `anchor-facts.md`; nothing in it changes except the
totals table and the round-length rule. Approved by Dave 2026-10-29: "anchor-total extension — let's see
how that goes", with the picker order `Make 3, Make 4, Make 5, Make 10, Doubles`.*

Why: the child's school work this term is **combinations within 3 and within 4**, and start-unknown
subtraction (`? − b = c`) is the form he still stumbles on. "What goes with 2 to make 4?" is that
question without the notation, so the smallest anchor families are the ones he can use right now. They
are the same shape as make-five and make-ten at smaller totals — **a total extension, not a new mode.**

## 1. Behaviour

| ID | Behaviour |
|---|---|
| B1 | `3` and `4` join `5` and `10` as supported anchor totals. One engine, one frame, one preference — no second code path and no new mode. |
| B2 | A short family runs its pass twice, exactly as make-five already does: a make-3 round is **4 items**, make-4 is **6**, make-5 stays 8 and make-10 stays 9. |
| B3 | The keypad covers `1 … total` for bond families (3, 4, 5, 10) and stays 1–10 for doubles. |
| B4 | Doubles are untouched. They are a family of *values* (1+1 … 5+5), not totals, so "Make 3" never offers `1+1`. |
| B5 | The picker reads ascending — `Make 3`, `Make 4`, `Make 5`, `Make 10`, `Doubles` — and the selected one is marked as it is today. |
| B6 | The frame renders one row for totals ≤ 5, so a make-3 frame is three cells and a make-4 frame is four. Nothing prints a numeral in a cell. |

## 2. Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC1 | the engine | `roundLengthForTotal` is asked for 3, 4, 5 and 10 | it answers 4, 6, 8 and 9 |
| AC2 | a make-3 bond family | a pass is built | it is the two ordered pairs (1,2) and (2,1), each once, blank on the larger operand |
| AC3 | a make-4 bond family | a pass is built | it is the three ordered pairs (1,3), (2,2), (3,1), each once |
| AC4 | a make-3 round played to the goal | the items are read in order | no item repeats back-to-back across the pass boundary, over a seeded round |
| AC5 | anchor mode, bond kind | the keypad length is read at totals 3, 4, 5, 10 | it is 3, 4, 5, 10; with doubles selected it is 10 regardless of the stored total |
| AC6 | the options panel | it is rendered | the five anchor entries appear in the order Make 3, Make 4, Make 5, Make 10, Doubles |
| AC7 | a stored preference of 3 or 4 | preferences are loaded | the total survives; an unsupported stored value (e.g. 7) falls back to 10 |
| AC8 | anchor mode at totals 3 and 4 | the frame is rendered | it carries that total, one row, and as many cells as the total |

## 3. Out of scope

- Bridging through ten, "take from ten", near-doubles — unchanged, still deferred (`anchor-facts.md` §8).
- Any subtraction rendering of a bond.
- Any new pattern in the daily round: a make-3 round is 4 items and the goal stays "ten right answers".

## 4. Decisions

- **Family identity stays a total, not a name.** `anchorFamily` returns the numeric total for bond
  families (and `'doubles'` for doubles); `NAMED_FAMILIES` keeps its aliases so existing callers and
  tests do not learn a new vocabulary.
- **Two passes under 10, one pass at 10.** This is the existing rule read honestly: make-five already
  doubles up because four pairs is a short round, so 2-pair and 3-pair families double up too.
- **Ascending picker.** The child's progression is small to large and the adult is picking what he can
  do today; a descending list starts the eye at the hardest one.

## 5. Test map

| Criterion | Test file | Test name | Status |
|---|---|---|---|
| AC1 | `test/anchorEngine.test.js` | `AC1 round length doubles short families and leaves make-ten alone` | pending |
| AC2 | `test/anchorEngine.test.js` | `AC2 a make-three pass is both ordered pairs, blanked on the larger operand` | pending |
| AC3 | `test/anchorEngine.test.js` | `AC3 a make-four pass is its three ordered pairs` | pending |
| AC4 | `test/anchorFamilies.test.js` | `AC4 a make-three round never repeats an item back-to-back` | pending |
| AC5 | `test/anchorFamilies.test.js` | `AC5 keypad length is the total for bonds and ten for doubles` | pending |
| AC6 | `test/App.test.js` | `AC6 the anchor entries are listed ascending` | pending |
| AC7 | `test/usePreferences.test.js` | `AC7 a stored total of three or four survives, an unsupported one falls back to ten` | pending |
| AC8 | `test/anchorFamilies.test.js` | `AC8 the frame draws one row at totals three and four` | green |
