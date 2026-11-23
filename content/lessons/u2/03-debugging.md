A colleague sends you an analysis and says *“It worked yesterday.”* It doesn't work today. This lesson is the in-browser version of the week 2 **Broken Notebook**, with a different dataset: `data/shop_customers.csv`.

## A debugging routine (do not guess!)

Before changing any code:

1. **Read** the error message. Which line failed? What is the error *type*?
2. **Classify** the likely layer: kernel state? working directory / file? Python / package? data?
3. **Inspect** the evidence (print things!).
4. Form **one** hypothesis.
5. Test the **smallest** change.
6. After all repairs: **Restart & Run All**.

Error messages are your friends. Read them from the **bottom**: the last line says *what* went wrong (`KeyError: 'annual_spend'`), the lines above say *where*.

| Error | Usually means | First thing to check |
|---|---|---|
| `FileNotFoundError` | wrong path relative to the working directory | `os.getcwd()`, `os.listdir(...)` |
| `NameError` | variable not defined (yet) — kernel state / order | was the defining cell run? typo? |
| `KeyError` | key / column name does not exist | `df.columns` (spelling, spaces, capitals) |
| `ModuleNotFoundError` | package not in the kernel's environment | `sys.executable`, `%pip install` |
| *no error, wrong result* | logic or data problem | inspect values, types, counts |

## Bug 1 — “The file does not exist”

:::exercise id=bug1 title="Bug 1: FileNotFoundError"
--- task
Run the starter code: it raises `FileNotFoundError`. **Don't guess the filename** — first inspect: the starter also prints the working directory and what is inside it.

Then repair the path with a **relative path** (no personal absolute path like `/home/yourname/...`). The DataFrame must be called `df`.
--- setup
# data file used: data/shop_customers.csv
import os
--- starter
import os
import pandas as pd
print("working directory:", os.getcwd())
print("contains:", os.listdir("."))
print("data/ contains:", os.listdir("data"))

df = pd.read_csv("files/shop_customers.csv")
df.head()
--- check
assert 'df' in globals(), "Create the DataFrame `df`."
assert len(df) == 10 and "spend_chf" in df.columns, "df should contain the 10 customers from data/shop_customers.csv."
--- hint
The listing shows a folder `data`, not `files`. The file is `data/shop_customers.csv`.
--- solution
import os
import pandas as pd
print("working directory:", os.getcwd())
print("contains:", os.listdir("."))
print("data/ contains:", os.listdir("data"))

df = pd.read_csv("data/shop_customers.csv")
df.head()
:::

**Diagnosis:** the *working directory / file* layer — evidence: the folder listing.

## Bug 2 — A convincing saved output

In the original notebook, a cell showed a nice filtered table. It was saved from the author's kernel — where a variable existed that is defined **nowhere** in the notebook.

:::exercise id=bug2 title="Bug 2: NameError from hidden state"
--- task
This filter should keep customers aged **30 or older**, but `minimum_age` was never defined in the notebook (it only existed in the author's kernel). Add the missing definition **above** the line that uses it, and keep the result in `df_filtered`.
--- starter
df_filtered = df[df["age"] >= minimum_age]
df_filtered
--- check
assert 'minimum_age' in globals() and minimum_age == 30, "Define `minimum_age = 30` before the filter."
assert len(df_filtered) == 6, f"Expected 6 customers aged 30+, got {len(df_filtered)}."
--- hint
Add `minimum_age = 30` as the first line.
--- solution
minimum_age = 30
df_filtered = df[df["age"] >= minimum_age]
df_filtered
:::

**Diagnosis:** *kernel state* — the output was real once, but came from memory, not from the code.

## Bug 3 — The column is missing… or is it?

:::exercise id=bug3 title="Bug 3: KeyError"
--- task
The colleague wants the **mean spend** of customers aged 30+. The code raises a `KeyError`. Inspect `df.columns`, then fix the column name. Store the result in `average_spend_30_plus`.
--- starter
print(df.columns)
average_spend_30_plus = df_filtered["annual_spend"].mean()
print(f"Average spend (age 30+): CHF {average_spend_30_plus:.2f}")
--- check
assert abs(average_spend_30_plus - 13090/6) < 0.01, f"Got {average_spend_30_plus}; expected the mean of spend_chf for ages ≥ 30 (2181.67)."
--- hint
The printed columns show `spend_chf`, not `annual_spend`.
--- solution
print(df.columns)
average_spend_30_plus = df_filtered["spend_chf"].mean()
print(f"Average spend (age 30+): CHF {average_spend_30_plus:.2f}")
:::

## Bug 4 — No error, wrong result

The most dangerous bugs raise **no error**.

:::exercise id=bug4 title="Bug 4: the silent bug"
--- task
This code should select **members** (`member == "yes"`). It runs without error… but selects everybody. Why? Inspect the column: `df["member"].unique()` and `df["member"].dtype`.

Repair it so `members` contains only rows with `"yes"`.
--- starter
members = df[df["member"].astype(bool)]
print("Members:", len(members))
members[["name", "member"]]
--- check
assert len(members) == 5, f"members has {len(members)} rows; there are 5 'yes' rows."
assert set(members["member"]) == {"yes"}, "members should contain only 'yes' rows."
--- hint
`astype(bool)` turns every non-empty string — including `"no"` — into `True` (remember Unit 1!).
--- hint
Compare with the string instead: `df["member"] == "yes"`.
--- solution
members = df[df["member"] == "yes"]
print("Members:", len(members))
members[["name", "member"]]
:::

**Diagnosis:** a *data / logic* problem. No tool would have warned you — only **inspecting the data** and checking counts against expectations.

## Code or environment?

A colleague reports the notebook works on their machine:

| Component | Author | You |
|---|---|---|
| Python | 3.12 | 3.10 |
| pandas | 2.3 | 1.5 |
| OS | Linux | Windows |

Does this prove the *code* is wrong? **No.** Differences can come from any layer: Python version, package versions (functions and defaults change), the OS (paths, encodings). Collect evidence (`sys.version`, `pd.__version__`, `platform.system()`, `os.getcwd()`) before blaming the code.

:::quiz
? `KeyError: 'Annual_Spend'` when running `df["Annual_Spend"]`. What do you check first?
+ `df.columns`, to see the exact column names
- Reinstall pandas
- Restart the computer
> A KeyError on a DataFrame almost always means the column name differs (spelling, capitals, spaces).

? A cell shows a correct-looking table, but running it now gives `NameError`. What is the most likely explanation?
- pandas is broken
+ The saved output came from a kernel where a variable existed that the notebook never defines
- The file is corrupt
> Saved outputs can be stale. The variable lived only in the author's kernel memory.

? `df["active"].astype(bool)` on a column of "yes"/"no" strings gives…
- True for "yes", False for "no"
+ True for both "yes" and "no"
- an error
> Non-empty strings are always True.

? What is the final step after fixing all bugs?
- Save the notebook
+ Restart the kernel and Run All, and check the results
- Delete the output cells
> Only a clean top-to-bottom run proves the repairs work without hidden state.
:::

:::key title="Summary"
Read → classify the layer → inspect evidence → one hypothesis → smallest change → **Restart & Run All**. Silent bugs are found by checking counts and values against expectations.
:::
