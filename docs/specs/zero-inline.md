# Zero built in, not bolted on

Status: implemented 2026-11-01. Owner decision: zero is an *ingredient* of ordinary arithmetic, not a
topic with its own mode, rung or toggle. A child should meet `7 + 0 = 7` and `3 − 3 = 0` the way he meets
`7 + 2`: without either of us announcing it.

## Why not a mode

A "Zero" task would have asked the adult to schedule a concept the EDB introduces *through* subtraction
examples, and it would have taught the child that zero is a special lesson. The four properties HK lists
(1N2) — `0 + n`, `n + 0`, `n − 0`, `n − n` — are met inside the existing modes instead.

## The rate, and why it exists

Allowing zero at an even rate over-samples it, because the constraint is on the *sum*:

| limit | addition items with a zero operand | subtraction items with a zero |
|---|---|---|
| 5 | 50.1% | 57.9% |
| 10 | 30.7% | 40.4% |
| 20 | 17.2% | 26.5% |

(measured, 200,000 draws per limit). Half the items at limit 5 would involve zero — a zero drill wearing
an ordinary mode's clothes, and markedly easier arithmetic.

So the generator decides, with probability `ZERO_RATE = 1/8`, that an item will carry a zero; the rest are
drawn exactly as before. Nothing on screen, nothing for the adult to set.

## Rules

- **Addition:** `n + 0` / `0 + n`, `n ≥ 1`. `0 + 0` is never generated — an item with no numbers in it asks nothing.
- **Subtraction:** `n − 0 = n` and `n − n = 0`, `n ≥ 1`. The old `num1 ≥ 2` floor is gone, so `1 − 1 = 0` exists.
- **Step modes exclude zero**: a step is the size of the number being added or taken away, and zero has no size.
- **Keypad:** always `0..limit`. A keypad that appeared and disappeared would be worse than a stable one; the
  rate keeps the key from being a constant temptation to mash.
- **Counters:** a visible `0` gets a counter row like any other numeral — an empty row is how "nothing" looks.
  A blank field gets no row at all.

## Consequences accepted

- Rounds are marginally easier, because zero items need no arithmetic.
- `3 − 3 = ?` can now be the answer, which is why every falsy-zero site in the composable and the view was
  audited: a correct `0` must count toward the goal.

## Tests that changed meaning

Ten assertions across six files plus the two exported test helpers pinned "no zero" as a *contract*. They now
pin the new one: zero at the rate, never both operands zero, never a negative answer, and every legal value
reachable on the keypad.
