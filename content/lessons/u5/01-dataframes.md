Real data comes as tables. **pandas** is Python's table library, and its **DataFrame** is what every course notebook from week 4 onwards uses. This lesson is a hands-on tour of the operations you actually need.

## What is a DataFrame?

A table-like data structure whose columns can have different types (numbers, text, dates…). Compared with Excel or SQL tables, rows and columns have **labels** you can choose (an *index* for rows, names for columns), and there is built-in functionality for inspecting, loading, transforming, summarising — and feeding ML libraries. The concept also exists in R and Spark.

- A **DataFrame** = a whole table.
- A **Series** = one column (values + index).

Pros: huge functionality, the industry standard, integrates with scikit-learn and matplotlib. Cons: the API is large and sometimes inconsistent, and data must fit in memory.

:::code
import pandas as pd
df = pd.DataFrame({
    "name":  ["Lena", "Marco", "Aylin", "Noah", "Sofia", "Luca"],
    "age":   [22, 41, 36, 28, 33, 52],
    "city":  ["Biel", "Bern", "Thun", "Biel", "Bern", "Zurich"],
    "spend": [820, 2410, 1730, 640, 1980, 3120],
})
df
:::

## Inspect first — always

| Call | Tells you |
|---|---|
| `df.head(n)` / `df.tail(n)` / `df[:10]` | first / last rows |
| `df.shape` | `(rows, columns)` |
| `df.columns` | column names |
| `df.dtypes` | type of each column (`int64`, `float64`, `object` = text, `datetime64`) |
| `df.info()` | all of the above + non-null counts |
| `df.describe()` | count, mean, std, min, quartiles, max of numeric columns |
| `df.isna().sum()` | missing values per column |
| `df["col"].value_counts()` | how often each value occurs |
| `df["col"].unique()` | the distinct values |

:::code
print(df.shape)
print(df.dtypes)
print(df["city"].value_counts())
df.describe()
:::

## Selecting columns

:::code
ages = df["age"]              # one column → Series (1-D)
print(type(ages), ages.shape)
two = df[["name", "age"]]     # list of columns → DataFrame (2-D)
print(type(two), two.shape)
:::

:::warn title="df['col'] vs df[['col']]"
Single brackets → a **Series**, shape `(n,)` — this is what a target `y` should be. Double brackets → a **DataFrame**, shape `(n, 1)` — a table with one column. The Iris notebook asks exactly this: `iris[4]` vs `iris[[4]]`.
:::

## Selecting rows and columns by position: `.iloc`

`.iloc[rows, columns]` works like NumPy slicing (positions, end excluded):

:::code
print(df.iloc[0])          # first row (as a Series)
print(df.iloc[0:1])        # first row as a 1-row DataFrame (keeps 2 dimensions)
df.iloc[:, 1:3]            # all rows, columns 1 and 2
:::

And `.loc[rows, columns]` selects by **labels** (index values and column names; here the end is *included*): `df.loc[0:2, ["name", "spend"]]`.

The ML pattern you will use most:

```python
X = df.iloc[:, :4]   # all rows, first four columns → features (DataFrame)
y = df.iloc[:, 4]    # all rows, column 4          → target  (Series)
```

## Filtering rows with a condition

Exactly like NumPy masks:

:::code
older = df[df["age"] >= 30]
print(len(older))
bern_big = df[(df["city"] == "Bern") & (df["spend"] > 2000)]   # & = and, | = or, brackets required
bern_big
:::

## New columns and computations

Arithmetic on columns is element-wise:

:::code
df["spend_per_year_of_age"] = df["spend"] / df["age"]
df["is_bern"] = (df["city"] == "Bern").astype(int)
print(df["spend"].mean(), df["spend"].max())
df.groupby("city")["spend"].mean()      # average spend per city
:::

`groupby` = “split the table into groups, compute something per group”. You will use it in Unit 10 to compare completion times per application.

:::exercise id=pd1 title="Inspect and select"
--- task
Using the `df` above (run the first code cell of this page if needed):

1. `n_rows` — the number of rows (use `.shape` or `len`)
2. `cities` — a **Series** with the `city` column
3. `small` — a **DataFrame** with only the `name` and `spend` columns
4. `first_two` — the first two rows using `.iloc`
--- starter
n_rows = None
cities = None
small = None
first_two = None
--- check
import pandas as pd
assert n_rows == len(df), f"n_rows = {n_rows}"
assert isinstance(cities, pd.Series) and list(cities) == list(df["city"]), "cities should be the Series df['city']."
assert isinstance(small, pd.DataFrame) and list(small.columns) == ["name", "spend"], "small should be df[['name', 'spend']]."
assert isinstance(first_two, pd.DataFrame) and len(first_two) == 2 and first_two.iloc[0]["name"] == "Lena", "first_two = df.iloc[:2] (or df.iloc[0:2])."
--- solution
n_rows = df.shape[0]
cities = df["city"]
small = df[["name", "spend"]]
first_two = df.iloc[:2]
:::

:::exercise id=pd2 title="Filter and aggregate"
--- task
1. `biel` — rows where city is `"Biel"`
2. `rich_young` — rows with age **below 40** and spend **above 1500**
3. `mean_by_city` — the mean spend per city (a Series from `groupby`)
--- starter
biel = None
rich_young = None
mean_by_city = None
mean_by_city
--- check
assert list(biel["name"]) == ["Lena", "Noah"], f"biel names: {None if biel is None else list(biel['name'])}"
assert sorted(rich_young["name"]) == ["Aylin", "Sofia"], f"rich_young names: {None if rich_young is None else list(rich_young['name'])}"
assert abs(mean_by_city["Bern"] - 2195) < 1e-9, "mean_by_city['Bern'] should be 2195 = (2410 + 1980) / 2"
--- hint
`df[(df["age"] < 40) & (df["spend"] > 1500)]`
--- hint
`df.groupby("city")["spend"].mean()`
--- solution
biel = df[df["city"] == "Biel"]
rich_young = df[(df["age"] < 40) & (df["spend"] > 1500)]
mean_by_city = df.groupby("city")["spend"].mean()
mean_by_city
:::

## Plotting a column

pandas plots directly with matplotlib: `df["spend"].plot(kind="bar")`, `df.plot(x="age", y="spend", kind="scatter")`. A Series with a **date index** gives a time-series line plot with `.plot()` — next lesson.

:::code
import matplotlib.pyplot as plt
df.plot(x="age", y="spend", kind="scatter", figsize=(5, 3), title="Spend vs age")
plt.show()
:::

:::quiz
? `df["price"]` returns…
+ a Series (1-D)
- a DataFrame with one column
- a list
> Single brackets with one name → Series.

? Which call shows how many missing values each column has?
- `df.describe()`
+ `df.isna().sum()`
- `df.shape`
> isna() marks missing cells as True; sum() counts them per column.

? `df.iloc[:, :4]` selects…
+ all rows and the first four columns
- the first four rows and all columns
- row 4
> iloc[rows, columns]; `:` = all.

? Correct way to filter rows where age > 30 AND city is Bern?
- `df[df["age"] > 30 and df["city"] == "Bern"]`
+ `df[(df["age"] > 30) & (df["city"] == "Bern")]`
- `df.filter(age > 30, city = "Bern")`
> Use `&` with brackets around each condition; Python's `and` does not work element-wise.

? Which call counts how often each species occurs in `y`?
+ `y.value_counts()`
- `y.count()`
- `y.unique()`
> value_counts gives the frequency of each distinct value — class counts.
:::

:::key title="Summary"
Inspect (`head`, `shape`, `dtypes`, `describe`, `isna().sum()`, `value_counts`) → select (`df["c"]`, `df[["a","b"]]`, `.iloc`, `.loc`) → filter (`df[mask]`) → compute (new columns, `groupby`).
:::
