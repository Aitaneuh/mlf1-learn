This is the **week 4 Iris notebook**, solved step by step with checks. It teaches the workflow you will reuse for every model in the course:

**load & inspect → X and y → train/test split → fit → predict (proba) → evaluate against a baseline**

## 1 · Load and inspect

`iris.data` has **no header line**: 150 rows, 5 columns (4 measurements + species).

:::exercise id=load title="Load and inspect Iris"
--- task
Load `data/iris.data` into `iris` with `header=None`. Then show: the first five rows, the shape, the dtypes, missing values per column and the class counts (column `4`).

Store the class counts in `counts` (`iris[4].value_counts()`).
--- starter
import pandas as pd
iris = None
counts = None
--- check
assert iris is not None and iris.shape == (150, 5), "iris = pd.read_csv('data/iris.data', header=None) → shape (150, 5)"
assert list(iris.columns) == [0, 1, 2, 3, 4], "With header=None the columns are named 0…4."
assert dict(counts) == {"Iris-setosa": 50, "Iris-versicolor": 50, "Iris-virginica": 50}, f"counts = {dict(counts) if counts is not None else None}"
--- hint
Without `header=None`, pandas would use the first flower as column names!
--- solution
import pandas as pd
iris = pd.read_csv("data/iris.data", header=None)
display(iris.head())
print(iris.shape)
print(iris.dtypes)
print(iris.isna().sum())
counts = iris[4].value_counts()
counts
:::

Balanced classes: 50 each. Column 4 is the **target** — it must not be an input feature.

## 2 · Create X and y

:::exercise id=xy title="Separate features and target"
--- task
`X` = the first four columns (a DataFrame, shape `(150, 4)`), `y` = column 4 (a Series, shape `(150,)`).
--- starter
X = None
y = None
print(X.shape, y.shape)
--- check
import pandas as pd
assert isinstance(X, pd.DataFrame) and X.shape == (150, 4), "X = iris.iloc[:, :4]"
assert isinstance(y, pd.Series) and y.shape == (150,), "y = iris[4] (a Series, single brackets!)"
--- solution
X = iris.iloc[:, :4]
y = iris[4]
print(X.shape, y.shape)
:::

## 3 · Reserve unseen examples

Iris rows are **sorted by species**. Taking the last 30 rows as test set would give 30 virginicas! `train_test_split` shuffles; `stratify=y` keeps the class proportions identical in both parts; `random_state=42` makes the split reproducible.

:::viz name=split
:::

:::exercise id=split title="Stratified 80/20 split"
--- task
Split X and y **together** into `X_train, X_test, y_train, y_test` with 20 % test data, stratified, seed 42. Print the sizes and the test class counts.
--- starter
from sklearn.model_selection import train_test_split
# TODO
--- check
assert X_train.shape == (120, 4) and X_test.shape == (30, 4), f"shapes: {X_train.shape}, {X_test.shape}"
assert sorted(y_test.value_counts().tolist()) == [10, 10, 10], "With stratify=y, the test set has exactly 10 flowers per species."
--- hint
```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)
```
--- solution
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
print(X_train.shape, X_test.shape)
print(y_test.value_counts())
:::

:::warn title="The test set is for ONE final evaluation"
We fix the model configuration in advance; the test set evaluates it once. If you repeatedly changed settings to get a better test score, the test set would no longer be “unseen” — you would need a validation set or cross-validation (Unit 7). And never change the seed until you like the result!
:::

## 4 · Configure and train

Three method calls connect everything to the fuel exercise:

- `fit(X, y)` — learn the parameters from features + targets (training)
- `predict(X)` — use the fitted model on features (prediction)
- `score(X, y)` — compare predictions with targets (accuracy for classifiers)

A model is only useful if it beats a trivial **baseline**: `DummyClassifier(strategy="most_frequent")` always predicts the most common training class.

:::exercise id=fit title="Fit the model and the baseline"
--- task
Create and fit on the **training data only**:

- `model = LogisticRegression(max_iter=1000)`
- `dummy = DummyClassifier(strategy="most_frequent")`

Then print the learned coefficients `model.coef_` (shape?) and intercepts `model.intercept_`.
--- starter
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
model = None
dummy = None
--- check
assert hasattr(model, "coef_") and model.coef_.shape == (3, 4), "model must be fitted: LogisticRegression(max_iter=1000).fit(X_train, y_train)"
assert hasattr(dummy, "classes_"), "dummy must be fitted too."
assert len(model.classes_) == 3
--- solution
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
model = LogisticRegression(max_iter=1000).fit(X_train, y_train)
dummy = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)
print(model.coef_.shape, model.coef_)
print(model.intercept_)
:::

`coef_` has shape **(3, 4)**: one row of 4 weights per species — exactly the $\mathbf w_k$ of the softmax lesson. These are **learned parameters**. `max_iter=1000`, `C=1.0`, the solver are **chosen settings** (hyperparameters). Note: logistic regression minimises log loss, not the fuel notebook's MSE.

## 5 · Probabilities and predictions

:::exercise id=proba title="predict_proba vs predict"
--- task
1. `probs` — a DataFrame with the predicted probabilities for the first 5 test flowers, with columns named by `model.classes_`
2. `row_sums` — the sum of each row of `probs`
3. `first_pred` — the predicted class of the **single** first test flower (careful: one row must stay 2-D → `X_test.iloc[0:1]`)
--- starter
import pandas as pd
probs = None
row_sums = None
first_pred = None
display(probs)
print(row_sums.values, first_pred)
--- check
import numpy as np
assert list(probs.columns) == list(model.classes_) and len(probs) == 5, "probs = pd.DataFrame(model.predict_proba(X_test.iloc[:5]), columns=model.classes_)"
assert np.allclose(row_sums, 1), "each row of probabilities sums to 1"
assert first_pred == model.predict(X_test.iloc[0:1])[0], "first_pred = model.predict(X_test.iloc[0:1])[0]"
--- solution
import pandas as pd
probs = pd.DataFrame(model.predict_proba(X_test.iloc[:5]), columns=model.classes_)
row_sums = probs.sum(axis=1)
first_pred = model.predict(X_test.iloc[0:1])[0]
display(probs)
print(row_sums.values, first_pred)
:::

`predict` returns, for each row, the class whose column in `predict_proba` is largest.

## 6 · Evaluate and interpret

:::exercise id=eval title="Three accuracies and a confusion matrix"
--- task
Compute `baseline_acc` (dummy on test), `train_acc` and `test_acc` (model on train / test). Then plot a confusion matrix of the test predictions with `ConfusionMatrixDisplay.from_predictions(y_test, model.predict(X_test))`.
--- starter
from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt
baseline_acc = None
train_acc = None
test_acc = None
print(baseline_acc, train_acc, test_acc)
--- check
assert abs(baseline_acc - 1/3) < 1e-9, f"baseline_acc = {baseline_acc}; the dummy is right for 10 of 30 test flowers."
assert abs(train_acc - model.score(X_train, y_train)) < 1e-12 and abs(test_acc - model.score(X_test, y_test)) < 1e-12, "use model.score(...) on train and on test."
--- solution
from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt
baseline_acc = dummy.score(X_test, y_test)
train_acc = model.score(X_train, y_train)
test_acc = model.score(X_test, y_test)
print(baseline_acc, train_acc, test_acc)
ConfusionMatrixDisplay.from_predictions(y_test, model.predict(X_test), xticks_rotation=30)
plt.show()
:::

Reading a confusion matrix: **rows = true class, columns = predicted class**. The diagonal holds correct predictions; anything off the diagonal is an error (e.g. a versicolor predicted as virginica). With only 30 test flowers, one extra error changes accuracy by 1/30 ≈ 3.3 points — a **coarse** estimate.

:::quiz title="Exit ticket"
? In the Iris workflow, what does `fit` do?
+ learns the model parameters from X_train and y_train
- predicts classes for X_test
- splits the data
> fit = training.

? What is the difference between `predict_proba` and `predict`?
+ predict_proba gives one probability per class; predict returns the class with the largest probability
- they are identical
- predict gives probabilities, predict_proba gives labels
> Probability first, decision second.

? The dummy baseline reaches 0.33 on the test set. Why?
+ It always predicts the most frequent training class; each class is one third of the test set
- It is a weak logistic regression
- By luck
> With balanced classes the majority guess is right 1/3 of the time.

? Why use `stratify=y` in the split?
+ To keep the same class proportions in training and test sets
- To sort the data by class
- To make the model more accurate
> Iris is sorted by class; stratification keeps 10 of each in the test set.

? Why is `X_test.iloc[0:1]` used instead of `X_test.iloc[0]` for a single prediction?
+ scikit-learn expects a 2-D table (n_samples, n_features), even for one row
- iloc[0] selects the first column
- it is faster
> iloc[0] would give a 1-D Series.
:::
