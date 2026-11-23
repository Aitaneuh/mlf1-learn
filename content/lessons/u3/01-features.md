How much should a 70 m², 3.5-room apartment in Biel, 600 m from the station, cost per month? You probably made a guess using the area, the location, maybe experience. A model does the same — but it needs the problem described in a precise vocabulary. This lesson is that vocabulary.

## Learning from examples

Instead of writing rules, we collect **historical observations** where the answer is known:

| Area | Rooms | Distance to station | Monthly rent |
|---|---|---|---|
| 45 m² | 2.0 | 300 m | CHF 1'250 |
| 65 m² | 3.0 | 900 m | CHF 1'550 |
| 80 m² | 3.5 | 500 m | CHF 1'900 |
| 105 m² | 4.5 | 1200 m | CHF 2'350 |
| **70 m²** | **3.5** | **600 m** | **?** |

What can the machine *use*, and what must it *predict*?

## The core vocabulary

| Term | Meaning | Apartment example |
|---|---|---|
| **Observation** / sample / row | one case in the dataset | one apartment |
| **Feature** / input / column | a property given to the model | living area, rooms, distance |
| **Target** / label / output | the value we want to predict | monthly rent |
| **Dataset** | the collection of observations | all historical apartments |
| **Prediction** $\hat y$ (“y-hat”) | the model's output for one observation | CHF 1'700 |

By convention we write the features of one observation as a vector $\mathbf x = [x_1, x_2, x_3]$ and the target as $y$. For the whole dataset, the features form a **matrix X** (one row per observation, one column per feature) and the targets a **vector y**.

<div class="diagram">
<svg viewBox="0 0 620 220" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" class="dg-h">X  (features)</text><text x="460" y="18" text-anchor="middle" class="dg-h">y  (target)</text>
  <g class="dg-s">
  <rect x="40" y="30" width="260" height="30" class="dg-bx"/><text x="85" y="50" text-anchor="middle">area</text><text x="170" y="50" text-anchor="middle">rooms</text><text x="255" y="50" text-anchor="middle">distance</text>
  <rect x="410" y="30" width="100" height="30" class="dg-bx"/><text x="460" y="50" text-anchor="middle">rent</text>
  <rect x="40" y="60" width="260" height="30" class="dg-hl"/><text x="85" y="80" text-anchor="middle">45</text><text x="170" y="80" text-anchor="middle">2.0</text><text x="255" y="80" text-anchor="middle">300</text>
  <rect x="410" y="60" width="100" height="30" class="dg-ok"/><text x="460" y="80" text-anchor="middle">1250</text>
  <rect x="40" y="90" width="260" height="30" class="dg-hl"/><text x="85" y="110" text-anchor="middle">65</text><text x="170" y="110" text-anchor="middle">3.0</text><text x="255" y="110" text-anchor="middle">900</text>
  <rect x="410" y="90" width="100" height="30" class="dg-ok"/><text x="460" y="110" text-anchor="middle">1550</text>
  <rect x="40" y="120" width="260" height="30" class="dg-hl"/><text x="85" y="140" text-anchor="middle">80</text><text x="170" y="140" text-anchor="middle">3.5</text><text x="255" y="140" text-anchor="middle">500</text>
  <rect x="410" y="120" width="100" height="30" class="dg-ok"/><text x="460" y="140" text-anchor="middle">1900</text>
  <rect x="40" y="150" width="260" height="30" class="dg-hl"/><text x="85" y="170" text-anchor="middle">105</text><text x="170" y="170" text-anchor="middle">4.5</text><text x="255" y="170" text-anchor="middle">1200</text>
  <rect x="410" y="150" width="100" height="30" class="dg-ok"/><text x="460" y="170" text-anchor="middle">2350</text>
  </g>
  <text x="330" y="115" class="dg-s dg-soft">← one row = one observation</text>
  <text x="170" y="205" text-anchor="middle" class="dg-s dg-soft">shape (4, 3): 4 observations × 3 features</text>
  <text x="460" y="205" text-anchor="middle" class="dg-s dg-soft">shape (4,)</text>
</svg>
</div>

:::warn title="Keep the target out of X"
The target must **never** be one of the input features. If the rent were a column of X, the model could simply copy it — perfect on paper, useless in reality. (In Unit 9 you will meet the sneaky version of this: *data leakage*.)
:::

:::exercise id=xy title="Split a table into X and y"
--- task
`apartments` is a list of rows `[area, rooms, distance, rent]`. Using NumPy:

1. `data` — convert it to an array
2. `X` — all rows, the first **three** columns (features)
3. `y` — all rows, the **last** column (target)

Then print the shapes. Expected: `(5, 3)` and `(5,)`.
--- starter
import numpy as np
apartments = [
    [45, 2.0, 300, 1250],
    [65, 3.0, 900, 1550],
    [80, 3.5, 500, 1900],
    [105, 4.5, 1200, 2350],
    [58, 2.5, 450, 1480],
]
data = None
X = None
y = None
print(X.shape, y.shape)
--- check
import numpy as np
assert X is not None and X.shape == (5, 3), f"X should have shape (5, 3)."
assert y is not None and y.shape == (5,), f"y should have shape (5,), got {None if y is None else y.shape}. Did you use data[:, 3] (not data[:, 3:])?"
assert np.allclose(y, [1250, 1550, 1900, 2350, 1480]), "y should contain the rents."
--- hint
`data = np.array(apartments)`, then `data[:, :3]` and `data[:, 3]` (or `data[:, -1]`).
--- solution
import numpy as np
apartments = [
    [45, 2.0, 300, 1250],
    [65, 3.0, 900, 1550],
    [80, 3.5, 500, 1900],
    [105, 4.5, 1200, 2350],
    [58, 2.5, 450, 1480],
]
data = np.array(apartments)
X = data[:, :3]
y = data[:, 3]
print(X.shape, y.shape)
:::

Notice `data[:, 3]` gives a 1-D array `(5,)`, while `data[:, 3:]` would give a 2-D table `(5, 1)`. Same difference as `iris[4]` vs `iris[[4]]` in pandas — you will meet it again in the Iris notebook.

:::quiz
? A dataset has 1000 apartments and five input columns (plus the rent). How many observations and features?
+ 1000 observations, 5 features
- 5 observations, 1000 features
- 1000 observations, 6 features
> Rows = observations; the rent is the target, not a feature.

? We want to predict whether a customer will cancel a subscription, using age, subscription duration, monthly usage and number of support requests. What is the target?
- monthly usage
+ cancelled: yes/no
- the customer
> The target is what we want to predict; the other columns are features; one customer is one observation.

? In the same subscription example, what is **one observation**?
+ One customer
- One feature column
- The whole dataset
> Each row describes one customer.
:::

## Two families of problems: regression vs classification

| | **Regression** | **Classification** |
|---|---|---|
| target is… | a **number** (quantity) | a **category** (class) |
| examples | rent, electricity demand, delivery time, temperature | spam / not spam, fraud / legit, dog / cat, which species |
| model output | a number | a class (often with a probability) |

The **same business problem** can sometimes be framed both ways: “how many days until the customer leaves?” (regression) vs “will the customer leave this month?” (classification).

:::quiz
? Predict tomorrow's electricity demand (in MWh).
+ Regression
- Classification
> The target is a quantity.

? Identify the language of a document.
- Regression
+ Classification
> The target is one of several categories.

? Predict a house's energy-efficiency class (A, B, C, …, G).
- Regression
+ Classification
> Even though the classes are ordered, the target is a category, not a measured quantity. (It is an *ordinal* category — next lesson.)

? Predict the number of deliveries tomorrow.
+ Regression
- Classification
> A count is a numeric quantity.
:::

## Two kinds of learning: supervised vs unsupervised

- **Supervised learning** — the training data contains the features **and the correct target** $y$ for each observation (“learning with known answers”). Examples: apartments with known rent, emails labelled spam / not spam, images labelled dog / cat. Regression and classification are supervised.
- **Unsupervised learning** — the data has features but **no target**. The goal is to discover structure: find groups (clustering), create representations (like Word2Vec's word vectors), detect unusual observations.

<div class="diagram">
<svg viewBox="0 0 640 170" xmlns="http://www.w3.org/2000/svg">
  <text x="160" y="20" text-anchor="middle" class="dg-h">Supervised: points come with labels</text>
  <text x="480" y="20" text-anchor="middle" class="dg-h">Unsupervised: only points</text>
  <g style="fill:var(--c1)"><circle cx="80" cy="60" r="7"/><circle cx="100" cy="80" r="7"/><circle cx="70" cy="95" r="7"/><circle cx="110" cy="55" r="7"/><circle cx="90" cy="110" r="7"/></g>
  <g style="fill:var(--c2)"><rect x="200" y="80" width="13" height="13"/><rect x="225" y="100" width="13" height="13"/><rect x="240" y="70" width="13" height="13"/><rect x="210" y="125" width="13" height="13"/><rect x="250" y="120" width="13" height="13"/></g>
  <text x="90" y="150" text-anchor="middle" class="dg-s">class A</text><text x="230" y="160" text-anchor="middle" class="dg-s">class B</text>
  <g style="fill:var(--text-faint)"><circle cx="400" cy="60" r="7"/><circle cx="420" cy="80" r="7"/><circle cx="390" cy="95" r="7"/><circle cx="430" cy="55" r="7"/><circle cx="410" cy="110" r="7"/><circle cx="527" cy="87" r="7"/><circle cx="552" cy="107" r="7"/><circle cx="567" cy="77" r="7"/><circle cx="537" cy="132" r="7"/><circle cx="577" cy="127" r="7"/></g>
  <text x="480" y="160" text-anchor="middle" class="dg-s">“are there groups?”</text>
</svg>
</div>

:::quiz
? You have 10,000 customer purchase histories and want to discover groups of similar customers. Nobody has labelled the customers.
- Supervised
+ Unsupervised
> No target is available; you look for structure (clustering).

? You have emails each marked by users as spam or not spam, and train a filter.
+ Supervised
- Unsupervised
> The labels (spam / not spam) are the known answers.
:::

:::key title="Summary"
- Observation = row, feature = input column, target = what we predict, prediction = $\hat y$.
- **X** is a table `(n_samples, n_features)`; **y** is a vector `(n_samples,)`.
- Regression → number; classification → category.
- Supervised → known targets; unsupervised → no targets, find structure.
:::
