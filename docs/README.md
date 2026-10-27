# Docs — early-maths research and app review

Reference set compiled October 2026, before any change to the app. It records what the curricula
actually require, what the evidence says about how 4–6-year-olds learn addition and subtraction, and
what this app does against both.

| Doc | Answers |
|---|---|
| [hk-curriculum-anchor.md](hk-curriculum-anchor.md) | What HK's EDB expects K1–K3 and P1 to do with number, quoted from the Kindergarten Education Curriculum Guide (2017) and the Explanatory Notes to Primary Mathematics KS1 (2018); P1 admission and interview facts |
| [international-comparison.md](international-comparison.md) | England EYFS/KS1, US CCSS K–G1, Singapore NEL/P1 — verbatim objectives, number ranges, when symbols appear, and what none of them expects before age 6 |
| [arithmetic-learning-evidence.md](arithmetic-learning-evidence.md) | Counting-strategy progression, concrete-to-abstract, missing-addend difficulty, drill and maths anxiety, working memory, tablet-app evidence — each closing with design implications |
| [app-audit.md](app-audit.md) | What this app actually does, verified by reading the source and sampling the real engine; design decisions classified help/neutral/hurt; defects with file:line |
| [review.md](review.md) | Independent review of the four docs above: coverage check, alignment verdict, expand-vs-new-repo verdict, corrections |
| [report.md](report.md) | The summary: the short answer, the anchor table, where the app sits, the build order, and where the evidence is weakest |

## The one-paragraph version

The app is a well-built drill for the wrong default setting. It is pitched at roughly Year 1 / P1 and
is being used by a K2 child. Two-thirds of its items ask for a missing operand — inverse reasoning,
which every curriculum here introduces after result-unknown — and a wrong answer discards the item
instead of teaching from it. The fix is defaults, removals and one new mode on the existing engine,
not a rewrite.

## Sourcing rules used here

Primary documents only (EDB PDFs, gov.uk, corestandards.org, moe.gov.sg, peer-reviewed papers and
EEF guidance), each claim carrying a URL and the sentence it rests on. Where a source could not be
fetched, the doc says so and the claim is marked as a gap rather than asserted. No child's name,
school or date of birth appears anywhere in this directory.
