**Scenario:** you are the data engineer asked to recommend **Sketchy** or **Blocks** to all first-semester students, using `data/ab_study.csv` (the synthetic study from the last lesson). Go beyond the lesson: check the confounder, quantify uncertainty with a **bootstrap**, and write a defensible recommendation.

:::exercise id=p6s1 kind=project title="Step 1 — Clean pipeline in one function"
--- task
Write `load_clean()` that loads the CSV, parses `time_raw` into `minutes` (reuse the rules: MM:SS exact, whole minutes, ranges and blanks → NaN) and adds a `sus` column for task-B rows (NaN elsewhere). Return the DataFrame as `df`.
--- starter
import pandas as pd, numpy as np, re

def load_clean():
    df = pd.read_csv("data/ab_study.csv")
    # TODO: minutes, sus
    return df

df = load_clean()
df[["application", "task", "time_raw", "minutes", "sus"]].head(8)
--- check
assert "minutes" in df and "sus" in df, "add both columns"
assert df["minutes"].notna().sum() > 70, "most times should parse"
assert df.loc[df["task"] == "A", "sus"].isna().all() and df.loc[df["task"] == "B", "sus"].notna().all()
--- solution
import pandas as pd, numpy as np, re

def to_minutes(v):
    if pd.isna(v) or not str(v).strip():
        return np.nan
    t = str(v).strip().lower()
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", t)
    if m:
        return int(m.group(1)) + int(m.group(2)) / 60
    if re.search(r"\d+\s*-\s*\d+", t):
        return np.nan
    m = re.fullmatch(r"(\d+)\s*(min)?", t)
    return float(m.group(1)) if m else np.nan

def load_clean():
    df = pd.read_csv("data/ab_study.csv")
    df["minutes"] = df["time_raw"].map(to_minutes)
    odd = df[["sus1", "sus3", "sus5", "sus7", "sus9"]] - 1
    even = 5 - df[["sus2", "sus4", "sus6", "sus8", "sus10"]]
    df["sus"] = (odd.sum(axis=1, min_count=5) + even.sum(axis=1, min_count=5)) * 2.5
    return df

df = load_clean()
df[["application", "task", "time_raw", "minutes", "sus"]].head(8)
:::

:::exercise id=p6s2 kind=project title="Step 2 — Is prior experience a confounder?"
--- task
1. `exp_effect` — median minutes for `prior_experience` = yes vs no (a Series)
2. `exp_by_group` — share of rows with prior experience in each `group`

If experience speeds people up **and** is unevenly spread across groups, it can bias the comparison.
--- starter
exp_effect = None
exp_by_group = None
print(exp_effect, exp_by_group, sep="\n")
--- check
assert set(exp_effect.index) == {"yes", "no"}, "groupby prior_experience"
assert exp_effect["yes"] < exp_effect["no"], "experienced participants should be faster in this data"
assert len(exp_by_group) == 2
--- solution
exp_effect = df.groupby("prior_experience")["minutes"].median()
exp_by_group = df.groupby("group")["prior_experience"].apply(lambda s: (s == "yes").mean())
print(exp_effect, exp_by_group, sep="\n")
:::

## Bootstrap: how sure are we?

With ~24 people per condition, the difference in median time between tools is uncertain. The **bootstrap** estimates that uncertainty: resample the observed values **with replacement** many times, recompute the statistic each time, and look at the spread (e.g. the middle 95 %).

:::exercise id=p6s3 kind=project title="Step 3 — Bootstrap the difference in medians"
--- task
For task B only, take the minutes (non-missing) of each app: `a` (Sketchy), `b` (Blocks). With `rng = np.random.default_rng(0)`, repeat 2000 times: resample each with replacement (`rng.choice(x, len(x), replace=True)`) and store `median(a*) − median(b*)` in `diffs`.

`ci` = the 2.5th and 97.5th percentiles (`np.percentile(diffs, [2.5, 97.5])`). Does the interval include 0?
--- starter
rng = np.random.default_rng(0)
b_rows = df[df["task"] == "B"]
a = b_rows.loc[b_rows["application"] == "Sketchy", "minutes"].dropna().to_numpy()
b = b_rows.loc[b_rows["application"] == "Blocks", "minutes"].dropna().to_numpy()
diffs = []
# TODO
ci = None
print(np.median(a) - np.median(b), ci)
--- check
assert len(diffs) == 2000, "2000 bootstrap differences"
assert ci is not None and len(ci) == 2 and ci[0] < ci[1]
--- solution
rng = np.random.default_rng(0)
b_rows = df[df["task"] == "B"]
a = b_rows.loc[b_rows["application"] == "Sketchy", "minutes"].dropna().to_numpy()
b = b_rows.loc[b_rows["application"] == "Blocks", "minutes"].dropna().to_numpy()
diffs = [np.median(rng.choice(a, len(a), replace=True)) - np.median(rng.choice(b, len(b), replace=True)) for _ in range(2000)]
ci = np.percentile(diffs, [2.5, 97.5])
print(np.median(a) - np.median(b), ci)
import matplotlib.pyplot as plt
plt.hist(diffs, bins=40); plt.axvline(0, color="k"); plt.xlabel("median(Sketchy) − median(Blocks), minutes"); plt.show()
:::

If the interval contains 0, the data is **compatible with no difference** in speed — a strong reason to decide on other criteria.

:::exercise id=p6s4 kind=project title="Step 4 — Dashboard table and recommendation"
--- task
Build `dashboard`: one row per application with `median_min` (all tasks), `mean_ease`, `mean_sus`, `completion_rate` (share of `completed == "yes"`). Then write your recommendation as a string `recommendation` (at least 40 words) covering: which tool, two supporting findings, the main limitation, your confidence.
--- starter
dashboard = None
recommendation = """
"""
display(dashboard)
print(recommendation)
--- check
assert set(dashboard.index) == {"Sketchy", "Blocks"} and {"median_min", "mean_ease", "mean_sus", "completion_rate"} <= set(dashboard.columns)
assert len(recommendation.split()) >= 40, "write at least 40 words"
--- solution
dashboard = df.groupby("application").agg(
    median_min=("minutes", "median"),
    mean_ease=("ease", "mean"),
    mean_sus=("sus", "mean"),
    completion_rate=("completed", lambda s: (s == "yes").mean()),
).round(2)
recommendation = """
I recommend Sketchy for first-semester students. In this study it obtained a higher mean SUS score and higher
perceived ease than Blocks, while the bootstrap interval for the difference in median completion time includes zero,
so speed does not clearly separate the tools. Main limitation: a small synthetic sample with rounded self-reported
times, repeated tasks (learning effects) and slightly unbalanced groups, so my confidence is moderate.
"""
display(dashboard)
print(recommendation)
:::
