# Review rules

For the **reviewer**, not the implementer. Every rule here was paid for by a failure, and most of them
are about one thing: a green test that proves nothing.

## R1 — An assertion must fail for the reason it names

A test that checks *that* something was refused, without checking *which* refusal, stays green when the
code you meant to guard is deleted.

```
BAD   expect(result.status).toBe(1)
GOOD  expect(result.stdout).toContain('main only takes merges from UAT')
```

If a code path has three ways to exit non-zero, the test must name the one it is exercising.

## R2 — Assert the contract, not the shuffle

Any expected value that depends on random order must be written as a property that holds for **every**
seed, or the seed must be injected so the order becomes a fixture.

```
BAD   expect(secondPass).not.toEqual(firstPass)      // two permutations coincide 1 time in 24
GOOD  every pass of four contains the four bonds exactly once
GOOD  useMathGame({ anchorRng: makeRng(7) }) then assert the exact order
```

`Math.random()`, `Date.now()` and module-level caches are all "random order" in disguise. If a test's
outcome depends on any of them, it is a flake waiting for the least convenient moment.

## R3 — Zero chance of passing by luck

If an assertion can pass by coincidence, it is a defect even while green. Put a number on it: if the
chance of a coincidental pass is above ~1%, treat it as MAJOR. Repetition does not fix this class —
running a 1-in-24 test five times still passes 81% of the time.

## R4 — Name the change that would make the assertion fail

For every new assertion, mentally delete the line under test. If the test still passes, it is
decorative. A test that cannot fail is worse than no test, because it buys false confidence.

## R5 — Verify the identity of the thing, not its liveness

"Deployment succeeded" is not "the deployment of this commit succeeded". "The check passed" is not
"the check that gates this change passed". Assertions must name the subject.

## R6 — Coverage is not evidence

A line being executed says nothing about whether its behaviour is pinned. Treat a coverage number as a
smell detector, never as proof.
