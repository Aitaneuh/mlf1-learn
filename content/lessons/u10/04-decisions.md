Week 9: the experiment is done, the data is in. Now: **what can we actually conclude**, and how do we turn messy evidence into a defensible recommendation? You will analyse a **synthetic** dataset with the same structure (and the same problems!) as the class study: two diagramming tools, **Sketchy** and **Blocks**.

:::note title="About the data"
`data/ab_study.csv` is generated for this site (no real people). One row = one **task response**: `group`, `position` (first/second tool), `application`, `task` (A/B), `completed`, `time_raw` (as typed by participants!), `ease` (1–5), `prior_experience`, and for task B rows the ten SUS answers `sus1…sus10`. There is no participant ID — so, like in the course notebook, **do not pair rows** to compute within-person differences.
:::

## 1 · Load and look

:::exercise id=d_load title="Load and inspect"
--- task
Load the file into `ab`. Count rows per `application` × `task` (`pd.crosstab`) into `counts`, and the participants per group: `group_sizes` = number of **rows** per group divided by 4 (each participant produced 4 rows).
--- starter
import pandas as pd
import numpy as np
ab = None
counts = None
group_sizes = None
display(counts)
print(group_sizes)
--- check
assert ab.shape[0] == 96, "96 task responses"
assert counts.values.sum() == 96
assert dict(group_sizes) == {1: 13, 2: 11}, f"group_sizes = {dict(group_sizes)}"
--- solution
import pandas as pd
import numpy as np
ab = pd.read_csv("data/ab_study.csv")
counts = pd.crosstab(ab["application"], ab["task"])
group_sizes = ab["group"].value_counts().sort_index() / 4
display(counts)
print(group_sizes)
:::

**Group allocation:** we aimed for 50/50 but got 13 vs 11. Is that a problem? Mildly — counterbalancing is no longer perfect, so order effects don't cancel exactly. Better: assign in balanced blocks.

## 2 · A real cleaning problem: messy times

Participants typed their times: `06:13`, `7min`, `5`, `4-5 min`, or nothing. Decisions are needed — and they must be **visible**, not silent.

:::exercise id=d_parse title="Parse the completion times"
--- task
Write `parse_time(value)` returning `(minutes, flag)`:

- missing / empty → `(nan, "missing")`
- `MM:SS` like `06:13` → `(6 + 13/60, "exact_mmss")`
- a whole number with optional `min` like `7min` or `5` → `(7.0, "rounded_minutes")`
- a range like `4-5 min` → `(nan, "approximate_range")` (flag it, don't guess silently)

Apply it to `ab["time_raw"]` creating columns `minutes` and `time_quality`.
--- starter
import re
def parse_time(value):
    if pd.isna(value) or str(value).strip() == "":
        return np.nan, "missing"
    text = str(value).strip().lower()
    # TODO: the three patterns (use re.fullmatch / re.search)
    return np.nan, "unparsed"

parsed = ab["time_raw"].map(parse_time)
ab["minutes"] = parsed.map(lambda p: p[0])
ab["time_quality"] = parsed.map(lambda p: p[1])
ab["time_quality"].value_counts()
--- check
import numpy as np
assert parse_time("06:30") == (6.5, "exact_mmss"), f"parse_time('06:30') = {parse_time('06:30')}"
assert parse_time("7min") == (7.0, "rounded_minutes") and parse_time("5") == (5.0, "rounded_minutes")
m, f = parse_time("4-5 min"); assert np.isnan(m) and f == "approximate_range"
m, f = parse_time(np.nan); assert f == "missing"
assert "unparsed" not in set(ab["time_quality"]), "every value should be handled"
--- hint
```python
m = re.fullmatch(r"(\d{1,2}):(\d{2})", text)
if m: return int(m.group(1)) + int(m.group(2)) / 60, "exact_mmss"
```
--- hint
Range first: `re.search(r"\d+\s*-\s*\d+", text)`; then whole minutes: `re.fullmatch(r"(\d+)\s*(min)?", text)`.
--- solution
import re
def parse_time(value):
    if pd.isna(value) or str(value).strip() == "":
        return np.nan, "missing"
    text = str(value).strip().lower()
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", text)
    if m:
        return int(m.group(1)) + int(m.group(2)) / 60, "exact_mmss"
    if re.search(r"\d+\s*-\s*\d+", text):
        return np.nan, "approximate_range"
    m = re.fullmatch(r"(\d+)\s*(min)?", text)
    if m:
        return float(m.group(1)), "rounded_minutes"
    return np.nan, "unparsed"

parsed = ab["time_raw"].map(parse_time)
ab["minutes"] = parsed.map(lambda p: p[0])
ab["time_quality"] = parsed.map(lambda p: p[1])
ab["time_quality"].value_counts()
:::

Questions to think about: does `05:00` mean the time was measured to the second? (Probably not — rounded!) Is a missing time the same as a failed task? (No.) Missing values can be handled by: removing the observation, **keeping the other valid observations** and handling the gap per analysis, or imputing when appropriate.

## 3 · Which tool appears faster?

:::exercise id=d_time title="Compare completion times"
--- task
Create `summary`: group by `["task", "application"]` and compute for `minutes`: `n` (count), `median`, `mean`, `std`. Then draw a boxplot of minutes per application and task.
--- starter
summary = None
display(summary)
--- check
assert summary.shape[0] == 4, "4 groups (2 tasks × 2 applications)"
assert {"n", "median", "mean", "std"} <= set(summary.columns), "columns n, median, mean, std"
--- hint
`ab.groupby(["task", "application"])["minutes"].agg(n="count", median="median", mean="mean", std="std").round(2)`
--- solution
import matplotlib.pyplot as plt
summary = ab.groupby(["task", "application"])["minutes"].agg(n="count", median="median", mean="mean", std="std").round(2)
display(summary)
ab.boxplot(column="minutes", by=["task", "application"], figsize=(7, 3.5))
plt.suptitle(""); plt.ylabel("minutes"); plt.show()
:::

Do the boxes overlap? Large overlap = big **individual differences** relative to the difference between tools. The **median** resists outliers; the mean doesn't — they can tell different stories.

## 4 · Order effects

:::exercise id=d_order title="Did people get faster with their second tool?"
--- task
`by_position` — the median minutes per `position` (first / second). Then `order_table` — median minutes by `application` × `position` (`pivot_table`).
--- starter
by_position = None
order_table = None
print(by_position)
order_table
--- check
assert by_position["second"] < by_position["first"], "in this data the second tool is used faster"
assert order_table.shape == (2, 2)
--- solution
by_position = ab.groupby("position")["minutes"].median()
order_table = ab.pivot_table(index="application", columns="position", values="minutes", aggfunc="median")
print(by_position)
order_table
:::

- **Learning effect:** participants get faster because they practised making diagrams (they even repeat the *same* tasks!).
- **Order effect:** the position of an application in the session influences performance, independently of the application (practice, or fatigue).

Counterbalancing spreads these effects over both tools — but with unequal groups, not perfectly.

## 5 · SUS per application

:::exercise id=d_sus title="Score SUS from the task-B rows"
--- task
Take the rows where `task == "B"` into `sus_rows`. Compute a `sus` column (odd items r − 1, even items 5 − r, sum × 2.5) and `sus_by_app` = mean and median SUS per application.
--- starter
sus_rows = None
items = [f"sus{i}" for i in range(1, 11)]
# TODO
sus_by_app = None
sus_by_app
--- check
assert len(sus_rows) == 48 and "sus" in sus_rows.columns
assert sus_rows["sus"].between(0, 100).all()
assert set(sus_by_app.index) == {"Blocks", "Sketchy"}
--- hint
```python
odd = sus_rows[["sus1", "sus3", "sus5", "sus7", "sus9"]] - 1
even = 5 - sus_rows[["sus2", "sus4", "sus6", "sus8", "sus10"]]
sus_rows["sus"] = (odd.sum(axis=1) + even.sum(axis=1)) * 2.5
```
--- solution
sus_rows = ab[ab["task"] == "B"].copy()
odd = sus_rows[["sus1", "sus3", "sus5", "sus7", "sus9"]] - 1
even = 5 - sus_rows[["sus2", "sus4", "sus6", "sus8", "sus10"]]
sus_rows["sus"] = (odd.sum(axis=1) + even.sum(axis=1)) * 2.5
sus_by_app = sus_rows.groupby("application")["sus"].agg(["count", "mean", "median"]).round(1)
sus_by_app
:::

## Can we trust the measurements?

- **Measurement precision:** values like 05:00, 7min suggest rounding — the differences between tools may be smaller than the measurement error. Better: automatic timing.
- **Completion vs success:** “completed” means *submitted*, not *correct*. Effectiveness needs a **rubric** (e.g. correct logic 0–2, required elements 0–2, clear labels 0–2, readable layout 0–2), ideally with several independent assessors.
- **Subjective vs measured:** people's *perceived* efficiency can disagree with the stopwatch.
- **Sample size:** 8 of 12 preferring a tool (67 %) is much weaker evidence than 80 of 120 (also 67 %).
- **Confounding variable:** something that influences the outcome **and** is associated with the factor we study (e.g. prior experience with one tool). Record it, balance it, or add a **warm-up task** (reduces unfamiliarity and early learning effects).

## Designing better surveys

What's wrong with these questions?

1. “How easy **and** efficient was the application?” → **double-barrelled**: two things in one question.
2. “How much **faster** was diagrams.net than Excalidraw?” → **leading**: assumes the answer.
3. “**Don't you agree** that Excalidraw is easier to use?” → **suggestive**.

Good questions are **clear and unambiguous**, **neutral**, and **focused on one thing**. Ask at the right moment: right **after each task** (task difficulty — avoids *recall bias*, *halo effects*, missed pain points), **after each application** (SUS), **after both** (preference). Balance against **survey fatigue**: only ask what you will use.

## From evidence to a decision

What should BFH prioritise — efficiency, satisfaction, effectiveness, learnability? Different stakeholders choose different criteria; make it explicit with a **weighted decision matrix**:

:::exercise id=d_matrix title="Weighted decision matrix"
--- task
Weights: usability 50 %, efficiency 30 %, features 20 %. Scores (0–10): Sketchy = (9, 7, 6), Blocks = (8, 9, 9). Compute `weighted` = a dict app → weighted score, and `choice`.
--- starter
weights = {"usability": 0.5, "efficiency": 0.3, "features": 0.2}
scores = {"Sketchy": {"usability": 9, "efficiency": 7, "features": 6},
          "Blocks":  {"usability": 8, "efficiency": 9, "features": 9}}
weighted = None
choice = None
print(weighted, choice)
--- check
assert abs(weighted["Sketchy"] - 7.8) < 1e-9 and abs(weighted["Blocks"] - 8.5) < 1e-9, f"weighted = {weighted}"
assert choice == "Blocks"
--- solution
weights = {"usability": 0.5, "efficiency": 0.3, "features": 0.2}
scores = {"Sketchy": {"usability": 9, "efficiency": 7, "features": 6},
          "Blocks":  {"usability": 8, "efficiency": 9, "features": 9}}
weighted = {app: sum(weights[c] * s[c] for c in weights) for app, s in scores.items()}
choice = max(weighted, key=weighted.get)
print(weighted, choice)
:::

Change the weights (e.g. usability 80 %) and the decision may flip — the decision depends on **priorities**, and those should be stated.

## What can we actually conclude?

| Statement | Supported? |
|---|---|
| Most participants **in our experiment** preferred tool X | supported (it's what we observed) |
| Most **BFH students** prefer tool X | not established (12 first-semester DE students ≠ all students) |
| Tool Y got a higher average SUS **in our experiment** | supported |
| Tool Y is **objectively** easier to use | not established (small sample, simple tasks, learning effects) |
| We know the best tool for **every situation** | not established (complex diagrams? collaboration? semester-long use?) |

**Generalisation** is limited by *who* participated and *which tasks* were tested. Initial usability (beginners) ≠ usability after practice (experts).

:::quiz
? 7 of 12 participants preferred tool A. Can we say “most BFH students prefer A”?
- Yes
+ No — the sample is small and not representative of all BFH students
> Results don't automatically generalise to other populations.

? Prior experience with one tool influences completion time and is more common in one group. It is a…
+ confounding variable
- dependent variable
- independent variable
> It is associated with the factor and influences the outcome.

? “How easy and fast was the tool?” is a poor survey question because…
+ it asks about two things at once
- it is too short
> Double-barrelled questions can't be answered for each aspect separately.

? Why ask about task difficulty immediately after each task rather than at the end?
+ To avoid recall bias and halo effects
- To make the survey longer
:::

:::key title="Summary"
Clean transparently (flag, don't hide), compare medians and spread, watch for order/learning effects and confounders, distinguish completion from success, write neutral single-topic questions at the right moment, make priorities explicit, and state only what the evidence supports — with its uncertainty.
:::
