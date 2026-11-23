The most dangerous data error is the one that raises **no error**. `pd.read_csv` will happily load a file *wrongly*. This lesson teaches the loading checklist, using the Montréal bike counts from the week 4 notebook.

## Before loading: think about the format

**CSV** (“comma-separated values”) is not one format but a family:

```text
Year,Make,Model,Description,Price             ← comma-separated, with a header
1997,Ford,E350,"ac, abs, moon",3000.00

2000;Mercury;Cougar;2,38                      ← semicolon-separated, no header, decimal comma
```

Things to check (open the file in a text editor, or print the first lines):

- the **delimiter** (`,` `;` tab…)
- is there a **header** line?
- the **encoding** (how characters become bytes)
- **date** formats (day first? month first?)
- decimal separator, missing-value markers

### Encoding in one paragraph

A file is just bytes. The *encoding* says how bytes map to characters. **ASCII** covers only 128 English characters (7 bits; 'A' = `01000001`). **UTF-8** (the modern default, 1–4 bytes per character) covers every language: é, ü, 希, أمل. Older European files often use **Latin-1** (= ISO-8859-1, close to Windows-1252/CP1252). Reading a Latin-1 file as UTF-8 either fails or turns `é` into `Ã©`. Rule: use the encoding the data source specifies; otherwise try UTF-8, then Latin-1 / CP1252.

## A silent loading error

:::exercise id=bad title="Load the bike data — naively"
--- task
Load `data/bikes.csv` the naive way (only the encoding is given). Then inspect: how many **columns** does pandas think there are? Store `naive_shape` = `df.shape`.
--- starter
import pandas as pd
df = pd.read_csv("data/bikes.csv", encoding="ISO-8859-1")
naive_shape = None
print(naive_shape)
df[:5]
--- check
assert naive_shape == df.shape, "naive_shape = df.shape"
assert naive_shape[1] == 1, "With the default separator the whole line ends up in ONE column."
--- solution
import pandas as pd
df = pd.read_csv("data/bikes.csv", encoding="ISO-8859-1")
naive_shape = df.shape
print(naive_shape)
df[:5]
:::

No error — but everything sits in **one** column, because the file uses `;`, not `,`. Totally broken, completely silent.

## The repair

Tell `read_csv` what the file looks like:

| Option | Why |
|---|---|
| `sep=";"` | the delimiter is a semicolon |
| `encoding="latin1"` | French accents (Côte-Sainte-Catherine) |
| `parse_dates=["Date"]` | turn the text `01/01/2012` into real dates |
| `dayfirst=True` | `02/01/2012` is the 2nd of January, not February 1st |
| `index_col="Date"` | use the date as the row index (→ time series) |

:::exercise id=good title="Load it correctly"
--- task
Load `data/bikes.csv` into `fixed_df` with all five options above. Then check: the shape should be `(310, 9)` and the index should be dates.
--- starter
fixed_df = pd.read_csv("data/bikes.csv")
print(fixed_df.shape)
fixed_df[:5]
--- check
import pandas as pd
assert fixed_df.shape == (310, 9), f"fixed_df.shape = {fixed_df.shape}, expected (310, 9)."
assert isinstance(fixed_df.index, pd.DatetimeIndex), "The index should be the parsed Date column (parse_dates + index_col)."
assert fixed_df.index[1].month == 1 and fixed_df.index[1].day == 2, "02/01/2012 should be 2 January — use dayfirst=True."
--- hint
`pd.read_csv("data/bikes.csv", sep=";", encoding="latin1", parse_dates=["Date"], dayfirst=True, index_col="Date")`
--- solution
fixed_df = pd.read_csv("data/bikes.csv", sep=";", encoding="latin1", parse_dates=["Date"], dayfirst=True, index_col="Date")
print(fixed_df.shape)
fixed_df[:5]
:::

## The sanity-check routine

After **every** load and every important transformation:

```python
display(df.head())
print(df.shape)          # expected rows / columns?
print(df.dtypes)         # numbers are numbers? dates are dates?
print(df.isna().sum())   # missing values where?
```

A short sanity check avoids hours of wasted work on wrong data.

:::exercise id=sanity title="Sanity-check the bike table"
--- task
1. `missing` — number of missing values per column (a Series)
2. `empty_cols` — a list of the column names that are **completely** empty (all values missing)
3. `berri_total` — total number of cyclists counted on `"Berri 1"` over the whole year
--- starter
missing = None
empty_cols = None
berri_total = None
print(missing)
print(empty_cols, berri_total)
--- check
assert list(missing.index) == list(fixed_df.columns), "missing = fixed_df.isna().sum()"
assert len(empty_cols) == 2 and all("non disponibles" in c for c in empty_cols), f"empty_cols = {empty_cols}; the two columns marked 'données non disponibles' are entirely empty."
assert int(berri_total) == int(fixed_df["Berri 1"].sum()), "berri_total = fixed_df['Berri 1'].sum()"
--- hint
A column is completely empty when its missing count equals the number of rows: `[c for c in fixed_df.columns if missing[c] == len(fixed_df)]`.
--- solution
missing = fixed_df.isna().sum()
empty_cols = [c for c in fixed_df.columns if missing[c] == len(fixed_df)]
berri_total = fixed_df["Berri 1"].sum()
print(missing)
print(empty_cols, berri_total)
:::

Interesting: those columns literally say *“données non disponibles”* (data not available) in their names. The data told us — if we looked.

## Plot only after inspecting

:::code title="One line plots a whole time series"
import matplotlib.pyplot as plt
fixed_df["Berri 1"].plot(figsize=(9, 3), title="Cyclists per day on Berri 1 (2012)")
plt.show()
:::

Unsurprisingly, few people cycle in Montréal in January–March. Plotting all paths at once (`fixed_df.plot()`) shows they all move together: a bad day for cyclists is bad everywhere.

:::tip title="Detecting an encoding"
Libraries like `charset_normalizer` can *guess* an encoding (`from_path(file).best().encoding`) — useful, but only a guess. Always verify by looking at the text.
:::

:::quiz
? `read_csv` finished without error. Is the data correct?
- Yes, otherwise pandas would raise an error
+ Not necessarily — check shape, columns, dtypes and a few rows
> Silent loading errors (wrong separator, encoding, dates) are common.

? The DataFrame has only one column containing strings like `01/01/2012;35;;0;38`. What is wrong?
+ The separator: the file uses `;` but pandas used `,`
- The encoding
- The header
> Everything ended up in one column because the delimiter was wrong.

? Why `dayfirst=True` for `02/01/2012`?
+ So it is read as 2 January (European format) instead of February 1st
- To sort by day
- To skip the first day
> Ambiguous dates need to be told their format.

? A French text shows `CÃ´te` instead of `Côte`. Likely cause?
+ The file was decoded with the wrong encoding
- A missing value
- The wrong separator
> Classic UTF-8 / Latin-1 mix-up.
:::

:::key title="Summary"
Look at the raw file → set `sep`, `encoding`, `header`, `parse_dates`/`dayfirst`, `index_col` → sanity-check `shape`, `dtypes`, `isna().sum()`, `head()` → only then analyse and plot.
:::
