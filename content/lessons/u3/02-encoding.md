Models only understand **numbers**. A real apartment is described by “renovated: yes”, “location: Biel/Bienne”, “built in 1995”. This lesson shows how to turn such information into features without fooling the model.

## Types of variables

| Main type | Subtype | What it covers | Examples |
|---|---|---|---|
| **Categorical** | Nominal / binary | distinct groups **without** order | eye colour, country, true/false |
| | Ordinal | groups **with** a clear order | education level, satisfaction (low/medium/high) |
| **Numeric** | Discrete | countable quantities | number of rooms, number of children |
| | Continuous | measured quantities | income, age, temperature |

For **ordinal** data the order is meaningful, but the *distance* between levels is not necessarily equal (is “high” − “medium” the same as “medium” − “low”?). For **numeric** data, differences are meaningful: 30 °C − 20 °C is the same step as 20 °C − 10 °C.

## Binary features → 0 / 1

| Recently renovated | Numeric |
|---|---|
| No | 0 |
| Yes | 1 |

The apartment becomes `[70, 3.5, 1]` = area, rooms, renovated.

## Several categories: the trap

What about the location (Biel/Bienne, Bern, Zürich)? A tempting but **poor** representation:

| Location | Code |
|---|---|
| Biel/Bienne | 1 |
| Bern | 2 |
| Zürich | 3 |

What could a model wrongly assume? That **Zürich > Bern > Biel**, that Bern is “halfway” between Biel and Zürich, and that Zürich = 3 × Biel. A linear model would multiply the code by one weight — giving each city a fixed *step* in rent. Pure nonsense for nominal data.

## One-hot encoding

Give **each category its own 0/1 column**:

| Location | Biel/Bienne | Bern | Zürich |
|---|---|---|---|
| Biel/Bienne | 1 | 0 | 0 |
| Bern | 0 | 1 | 0 |
| Zürich | 0 | 0 | 1 |

Our apartment becomes `[70, 3.5, 1, 1, 0, 0]` = area, rooms, renovated, Biel, Bern, Zürich. Now each city gets its own learned weight, and no fake order exists.

:::exercise id=onehot title="One-hot encode by hand"
--- task
Write a function `one_hot(value, categories)` that returns a list with a `1` at the position of `value` in `categories` and `0` everywhere else.

Example: `one_hot("Bern", ["Biel", "Bern", "Zurich"])` → `[0, 1, 0]`.
--- starter
def one_hot(value, categories):
    # TODO
    return None

print(one_hot("Bern", ["Biel", "Bern", "Zurich"]))
--- check
assert one_hot("Bern", ["Biel", "Bern", "Zurich"]) == [0, 1, 0], f"got {one_hot('Bern', ['Biel', 'Bern', 'Zurich'])}"
assert one_hot("Zurich", ["Biel", "Bern", "Zurich"]) == [0, 0, 1]
assert one_hot("c", ["a", "b", "c", "d"]) == [0, 0, 1, 0]
--- hint
A comprehension can do it: for each category `c`, put `1 if c == value else 0`.
--- solution
def one_hot(value, categories):
    return [1 if c == value else 0 for c in categories]

print(one_hot("Bern", ["Biel", "Bern", "Zurich"]))
:::

In practice pandas does it for you:

:::code
import pandas as pd
flats = pd.DataFrame({
    "area": [70, 45, 105, 80],
    "renovated": ["yes", "no", "no", "yes"],
    "location": ["Biel", "Bern", "Zurich", "Biel"],
})
flats["renovated"] = (flats["renovated"] == "yes").astype(int)   # binary → 0/1
pd.get_dummies(flats, columns=["location"], dtype=int)           # one-hot
:::

:::tip title="Ordinal categories"
For ordered categories (e.g. satisfaction low/medium/high) you *may* use codes 0/1/2 because the order is real — but you still assume equal steps. One-hot is the safe default for nominal data.
:::

## Feature engineering

**Feature engineering** is selecting, creating and transforming raw information into features a model can use well.

| Raw information | Engineered feature |
|---|---|
| Recently renovated: Yes | `renovated = 1` |
| Location: Biel/Bienne | `location_biel = 1` |
| Construction year: 1995 | `building_age = 31` (in 2026) |
| Area 70 m², rooms 3.5 | `area_per_room = 20` |

*The representation determines what the model can learn.* A linear model cannot invent “age” from “construction year” relations on its own if you don't help it — and a feature like `area_per_room` can capture something neither column says alone.

Units matter too: in the fuel notebook, distance is recorded in tenths of a km and fuel in millilitres. Converting to *hundreds of km* and *litres* makes the learned weight directly readable as **litres per 100 km**.

:::exercise id=engineer title="Engineer features with pandas"
--- task
Starting from the DataFrame `raw`, add two new columns:

- `building_age` = 2026 − `year_built`
- `area_per_room` = `area` ÷ `rooms`

(Create a column with `raw["new_name"] = ...`; arithmetic on columns works element-wise, like NumPy.)
--- setup
import pandas as pd
raw = pd.DataFrame({"area": [70, 45, 105], "rooms": [3.5, 2.0, 4.5], "year_built": [1995, 2010, 1968]})
--- starter
raw["building_age"] = None
raw["area_per_room"] = None
raw
--- check
assert list(raw["building_age"]) == [31, 16, 58], f"building_age = {list(raw['building_age'])}"
assert [round(v, 3) for v in raw["area_per_room"]] == [20.0, 22.5, 23.333], f"area_per_room = {list(raw['area_per_room'])}"
--- hint
`raw["building_age"] = 2026 - raw["year_built"]`
--- solution
raw["building_age"] = 2026 - raw["year_built"]
raw["area_per_room"] = raw["area"] / raw["rooms"]
raw
:::

:::quiz
? Why is coding Biel = 1, Bern = 2, Zürich = 3 a poor representation for a linear model?
+ The model may treat the codes as quantities with an order and equal steps that do not exist
- Because numbers cannot be used as features
- Because it uses too many columns
> Nominal categories have no order; one-hot encoding avoids inventing one.

? With categories [Biel, Bern, Zürich], what is the one-hot vector for Zürich?
- [3]
- [1, 1, 1]
+ [0, 0, 1]
> One column per category, 1 for the matching one.

? Satisfaction measured as low / medium / high is…
- nominal
+ ordinal
- continuous
> Categories with a meaningful order but not necessarily equal distances.

? “Number of rooms” (2, 3.5, 4.5) is best described as…
+ numeric
- nominal
> Differences between values are meaningful quantities.
:::

:::key title="Summary"
- Binary → 0/1. Nominal categories → **one-hot**, never arbitrary integer codes.
- Ordinal = ordered categories; numeric = meaningful differences.
- Feature engineering (ages, ratios, unit conversions) decides what the model *can* learn.
:::
