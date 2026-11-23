How do we measure whether people can actually *use* an application? Two complementary sources of evidence: what users **do**, and what users **say**.

| Observed behaviour | User feedback |
|---|---|
| what do users actually do? | how do they experience it? |
| task success, completion time, errors, requests for help, navigation difficulties | questionnaires, interviews, perceived difficulty, satisfaction, confidence |

Two users can finish the same task equally fast and have completely different experiences — you need both.

## Task-based usability testing

1. **Define a task** — realistic, with a clear objective (e.g. “draw this exam-registration flowchart”).
2. **Recruit participants** — representative of the target users.
3. **Observe** — let them work **without unnecessary assistance**.
4. **Record results** — completion time, success, errors, difficulties.
5. **Collect feedback** — ask about the experience afterwards.

## The System Usability Scale (SUS)

A **standardised** questionnaire (John Brooke, 1986): **10 statements**, each answered on a **5-point Likert scale** (1 = strongly disagree … 5 = strongly agree), giving one score from **0 to 100**. It covers effectiveness, efficiency and satisfaction.

Odd statements are **positive** (“I thought the system was easy to use”), even statements **negative** (“I found the system unnecessarily complex”). Scoring:

1. odd items (1, 3, 5, 7, 9): **response − 1**
2. even items (2, 4, 6, 8, 10): **5 − response**
3. add the ten adjusted values (0–40) and **multiply by 2.5**

:::viz name=sus
Change the answers and watch the score. What happens if someone answers 5 (“strongly agree”) to everything?
:::

:::warn title="Interpreting SUS"
- A SUS score is **not a percentage**: 85 does not mean “85 % satisfied”.
- About **68** is commonly cited as the average across evaluated systems.
- App A 58 vs app B 79: don't automatically pick B — how many participants? Which tasks? Which users? How large is the variability?
:::

:::exercise id=sus title="Score SUS questionnaires in Python"
--- task
Each row of `responses` is one completed questionnaire (10 answers, 1–5). Write `sus_score(row)` for one row, then compute `scores` (a NumPy array, one SUS score per row) and `mean_sus`.
--- setup
import numpy as np
responses = np.array([
    [4, 2, 4, 1, 4, 2, 5, 2, 4, 2],
    [5, 1, 5, 1, 5, 1, 5, 1, 5, 1],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [2, 4, 2, 4, 3, 3, 2, 4, 2, 5],
])
--- starter
def sus_score(row):
    total = 0
    for i, r in enumerate(row):      # i = 0..9  → item number i + 1
        pass  # TODO: odd items (i even) r - 1 ; even items (i odd) 5 - r
    return total * 2.5

scores = None
mean_sus = None
print(scores, mean_sus)
--- check
import numpy as np
assert sus_score([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]) == 100, "best possible answers → 100"
assert sus_score([3] * 10) == 50, "all neutral → 50"
assert np.allclose(scores, [80, 100, 50, 27.5]), f"scores = {scores}"
assert abs(mean_sus - 64.375) < 1e-9
--- hint
Python's `i` starts at 0, so item 1 has `i = 0`. Odd **items** ↔ even **i**: `total += (r - 1) if i % 2 == 0 else (5 - r)`.
--- solution
def sus_score(row):
    total = 0
    for i, r in enumerate(row):
        total += (r - 1) if i % 2 == 0 else (5 - r)
    return total * 2.5

scores = np.array([sus_score(r) for r in responses])
mean_sus = scores.mean()
print(scores, mean_sus)
:::

:::quiz
? A participant answers 5 to all ten SUS statements. Score?
= 50
> Odd items give 4 each (20), even items give 0 each → 20 × 2.5 = 50. Agreeing with negative statements costs points.

? How many statements does SUS have, and what is the score range?
+ 10 statements, 0–100
- 5 statements, 1–5
- 10 statements, 0–40
> The raw sum (0–40) is multiplied by 2.5.

? SUS = 85 means…
+ a high perceived usability score (well above the ~68 average) — not “85 % of users satisfied”
- 85 % of users are satisfied
> It's a scale score, not a percentage.

? In a usability test, the observer helps the participant whenever they get stuck. Problem?
+ The measured times and success no longer reflect real use without assistance
- None, it is friendlier
:::

:::key title="Summary"
Combine observed behaviour (success, time, errors) with feedback (SUS, interviews). SUS: odd − 1, 5 − even, sum × 2.5; ~68 average; not a percentage.
:::
