Logistic regression draws straight boundaries. **Decision trees** learn a sequence of yes/no questions instead — and **random forests** combine many trees.

## A decision tree is a flowchart

<div class="diagram">
<svg viewBox="0 0 600 250" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="t-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-soft)"/></marker></defs>
  <rect x="200" y="10" width="200" height="40" rx="8" class="dg-hl"/><text x="300" y="35" text-anchor="middle" class="dg-t">petal length ≤ 2.5 cm?</text>
  <path d="M250 50 L130 95" class="dg-ar" marker-end="url(#t-a)"/><text x="170" y="70" class="dg-s">yes</text>
  <path d="M350 50 L430 95" class="dg-ar" marker-end="url(#t-a)"/><text x="400" y="70" class="dg-s">no</text>
  <rect x="50" y="100" width="160" height="38" rx="8" class="dg-ok"/><text x="130" y="124" text-anchor="middle" class="dg-t">predict setosa</text>
  <rect x="340" y="100" width="200" height="40" rx="8" class="dg-hl"/><text x="440" y="125" text-anchor="middle" class="dg-t">petal width ≤ 1.75 cm?</text>
  <path d="M400 140 L330 190" class="dg-ar" marker-end="url(#t-a)"/><text x="350" y="165" class="dg-s">yes</text>
  <path d="M480 140 L520 190" class="dg-ar" marker-end="url(#t-a)"/><text x="510" y="165" class="dg-s">no</text>
  <rect x="240" y="195" width="170" height="38" rx="8" class="dg-ok"/><text x="325" y="219" text-anchor="middle" class="dg-t">predict versicolor</text>
  <rect x="430" y="195" width="160" height="38" rx="8" class="dg-ok"/><text x="510" y="219" text-anchor="middle" class="dg-t">predict virginica</text>
</svg>
</div>

`fit` **learns the splits** (which feature, which threshold) from the training data, choosing questions that separate the classes best. `max_depth` limits how many questions in a row the tree may ask. Trees are easy to read, need no feature scaling, and can capture non-linear rules — but a deep tree easily **memorises** the training data (overfitting).

:::code title="Train a tree on Iris and print its rules"
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, export_text

iris = pd.read_csv("data/iris.data", header=None,
                   names=["sepal_len", "sepal_wid", "petal_len", "petal_wid", "species"])
X, y = iris.iloc[:, :4], iris["species"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

tree = DecisionTreeClassifier(max_depth=2, random_state=42).fit(X_train, y_train)
print(export_text(tree, feature_names=list(X.columns)))
print("test accuracy:", tree.score(X_test, y_test))
:::

## Random forest: many different trees vote

A single tree is sensitive to the exact training data. A **random forest** trains many trees that are deliberately different:

1. **Different data** — each tree sees a *bootstrap sample*: training rows drawn **with replacement**.
2. **Different questions** — at each split, only a random subset of features is considered.
3. **Combine** — average the trees' class probabilities; predict the class with the largest average.

Many varied trees reduce the sensitivity to any single tree's choices. As always: evaluate on unseen data.

## Parameters vs hyperparameters

| Model | **Learned** during `fit` (parameters) | **Chosen** for the run (hyperparameters) |
|---|---|---|
| Fuel model | weight w | learning rate, epochs |
| Logistic regression | coefficients, intercepts | C, solver, max_iter |
| Random forest | the splits in all fitted trees | n_estimators (number of trees), max_depth |

:::exercise id=depth title="How deep should the tree be?"
--- task
For each `depth` in `[1, 2, 3, 5, None]` (None = unlimited), fit a `DecisionTreeClassifier(max_depth=depth, random_state=42)` on the Iris training data and record train and test accuracy in a list of dicts `rows` (keys `depth`, `train`, `test`). Show it as a DataFrame.

Then fit `forest = RandomForestClassifier(n_estimators=100, random_state=42)` and store its test accuracy in `forest_acc`.
--- starter
from sklearn.ensemble import RandomForestClassifier
rows = []
for depth in [1, 2, 3, 5, None]:
    pass  # TODO
forest = None
forest_acc = None
pd.DataFrame(rows)
--- check
assert len(rows) == 5 and all({"depth", "train", "test"} <= set(r) for r in rows), "rows needs 5 dicts with keys depth, train, test."
assert rows[0]["train"] < 0.75, "A depth-1 tree can only separate one species: training accuracy around 0.67."
assert rows[-1]["train"] == 1.0, "An unlimited tree should fit the training data perfectly."
assert forest is not None and abs(forest_acc - forest.score(X_test, y_test)) < 1e-12, "forest_acc = forest.score(X_test, y_test)"
--- hint
```python
t = DecisionTreeClassifier(max_depth=depth, random_state=42).fit(X_train, y_train)
rows.append({"depth": depth, "train": t.score(X_train, y_train), "test": t.score(X_test, y_test)})
```
--- solution
from sklearn.ensemble import RandomForestClassifier
rows = []
for depth in [1, 2, 3, 5, None]:
    t = DecisionTreeClassifier(max_depth=depth, random_state=42).fit(X_train, y_train)
    rows.append({"depth": depth, "train": t.score(X_train, y_train), "test": t.score(X_test, y_test)})
forest = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
forest_acc = forest.score(X_test, y_test)
print("forest test accuracy:", forest_acc)
pd.DataFrame(rows)
:::

A depth-1 tree **underfits** (can't separate three classes with one question). The unlimited tree reaches 100 % on training data — but training accuracy is not the goal. Iris is easy, so test accuracies are all high; on harder data the gap between train and test grows with depth (Unit 9).

:::warn title="Choosing max_depth"
Picking the depth with the best **test** score and then reporting that score is cheating: the test set influenced the choice. Choose hyperparameters with validation data or cross-validation (Unit 7), then test once.
:::

:::quiz
? What does `fit` learn in a decision tree?
+ which feature and threshold to use at each split
- the value of max_depth
- the number of trees
> Splits are learned; max_depth is chosen.

? A random forest gets diversity between its trees by…
+ training each tree on a bootstrap sample and considering random feature subsets at each split
- training each tree on the test set
- using a different learning rate per tree
> Different data + different questions, then averaging.

? `n_estimators` in a random forest is…
- a learned parameter
+ a hyperparameter (number of trees)
> Chosen before training.

? An unlimited-depth tree reaches 100 % training accuracy. What should you conclude?
+ Nothing about generalisation — check performance on unseen data
- It is the best possible model
> Perfect training fit can mean memorisation.
:::
