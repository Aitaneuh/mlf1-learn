The **week 5 notebook**: compare a dummy, Gaussian NB and Multinomial NB on Pendigits — **fairly**. The new idea is **cross-validation**: choosing a model without ever touching the test set.

## The data: pen trajectories, not images

Each row is a digit written on a tablet. The pen trace was resampled to **8 points**, each with (x, y) scaled to 0–100, flattened into **16 numbers** `[x1, y1, x2, y2, …, x8, y8]`, plus the digit label (0–9). 7494 rows. A value of 20 means *the pen was at position 20* — not that something occurred 20 times.

## The plan

1. Split once: **80 % training**, **20 % final test** (stratified, seed 42). The test set is locked away.
2. Compare candidate models with **cross-validation on the training set only**.
3. Select the best by mean CV accuracy, **refit** it on all training rows, **test once**.

## Cross-validation

:::viz name=cv
:::

With 3 folds: split the training data into 3 parts. Fit on 2 parts, validate on the third — three times, so every training row is used for validation exactly once. You get 3 validation scores: their **mean** says how good, their **standard deviation** says how stable. All of this happens **inside** the training set; the final test set is outside all folds.

In `cross_validate`, the key `test_score` means the score on each held-out **validation fold** — not your `X_test`!

## 1 · Inspect

:::exercise id=pd_load title="Load and select X / y"
--- task
`digits` is loaded for you. Select `X` = all rows, first 16 columns and `y` = column 16 (a Series). Check: shapes `(7494, 16)` / `(7494,)`, no missing values, feature range 0–100, class counts.
--- starter
import numpy as np
import pandas as pd
from pathlib import Path
data_file = Path("~/bfh-datasets/bti1041-mlf1/pendigits.tra").expanduser()
digits = pd.read_csv(data_file, header=None)
display(digits.head())
X = None  # TODO 1
y = None  # TODO 2
print("Data shape:", digits.shape)
print("Missing values:", digits.isna().sum().sum())
print("Feature range:", X.min().min(), X.max().max())
print(y.value_counts().sort_index().to_dict())
--- check
assert X.shape == (7494, 16) and y.shape == (7494,), "X = digits.iloc[:, :16]; y = digits.iloc[:, 16]"
--- solution
import numpy as np
import pandas as pd
from pathlib import Path
data_file = Path("~/bfh-datasets/bti1041-mlf1/pendigits.tra").expanduser()
digits = pd.read_csv(data_file, header=None)
display(digits.head())
X = digits.iloc[:, :16]
y = digits.iloc[:, 16]
print("Data shape:", digits.shape)
print("Missing values:", digits.isna().sum().sum())
print("Feature range:", X.min().min(), X.max().max())
print(y.value_counts().sort_index().to_dict())
:::

(Notice the path `~/bfh-datasets/bti1041-mlf1/...` — the same as on JupyterHub. It works here too.)

:::code title="See what a row looks like"
import matplotlib.pyplot as plt
fig, axes = plt.subplots(1, 6, figsize=(11, 2.2))
for ax, (_, row) in zip(axes, digits.sample(6, random_state=1).iterrows()):
    xs, ys = row.values[0:16:2], row.values[1:16:2]
    ax.plot(xs, ys, "-o", ms=3); ax.plot(xs[0], ys[0], "go")
    ax.set_title(f"label {int(row.values[16])}"); ax.set_xlim(-5, 105); ax.set_ylim(-5, 105); ax.axis("off")
plt.show()
:::

## 2 · Reserve the test set

:::exercise id=pd_split title="80/20 stratified split"
--- task
Create `X_train, X_test, y_train, y_test` with `test_size=0.2`, `stratify=y`, `random_state=42`.
--- starter
from sklearn.model_selection import train_test_split
RANDOM_STATE = 42
--- check
assert X_train.shape == (5995, 16) and X_test.shape == (1499, 16), f"{X_train.shape}, {X_test.shape}"
--- solution
from sklearn.model_selection import train_test_split
RANDOM_STATE = 42
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE)
print("Training:", X_train.shape, "Test:", X_test.shape)
:::

Why stratify? So each digit is equally represented in both parts. Why keep the test set out of CV? Because anything used to *choose* a model can no longer give an unbiased estimate of performance on new data.

## 3 · Compare on training data only

:::exercise id=pd_cv title="Cross-validate three candidates"
--- task
Use `StratifiedKFold(n_splits=3, shuffle=True, random_state=42)`. For each candidate, run `cross_validate(model, X_train, y_train, cv=cv, scoring="accuracy")` and record the mean and std of `result["test_score"]` and the mean `fit_time`. Build the DataFrame `comparison`, sorted by mean accuracy (descending).
--- starter
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.dummy import DummyClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate

candidates = {
    "Dummy": DummyClassifier(strategy="most_frequent"),
    "Gaussian NB": GaussianNB(),
    "Multinomial NB": MultinomialNB(alpha=1),
}
cv = None  # TODO
rows = []
for name, model in candidates.items():
    result = cross_validate(model, X_train, y_train, cv=cv, scoring="accuracy")
    mean_accuracy = None  # TODO
    std_accuracy = None   # TODO
    rows.append({"model": name, "mean_accuracy": mean_accuracy, "std_accuracy": std_accuracy,
                 "fit_seconds": result["fit_time"].mean()})
comparison = pd.DataFrame(rows).sort_values("mean_accuracy", ascending=False).reset_index(drop=True)
comparison
--- check
assert list(comparison["model"])[-1] == "Dummy", "The dummy should be last."
assert comparison["mean_accuracy"].iloc[0] > 0.8, "The best NB model should be above 0.8."
assert comparison["std_accuracy"].notna().all(), "fill in std_accuracy"
--- hint
`result["test_score"].mean()` and `result["test_score"].std()`.
--- solution
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.dummy import DummyClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate

candidates = {
    "Dummy": DummyClassifier(strategy="most_frequent"),
    "Gaussian NB": GaussianNB(),
    "Multinomial NB": MultinomialNB(alpha=1),
}
cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)
rows = []
for name, model in candidates.items():
    result = cross_validate(model, X_train, y_train, cv=cv, scoring="accuracy")
    mean_accuracy = result["test_score"].mean()
    std_accuracy = result["test_score"].std()
    rows.append({"model": name, "mean_accuracy": mean_accuracy, "std_accuracy": std_accuracy,
                 "fit_seconds": result["fit_time"].mean()})
comparison = pd.DataFrame(rows).sort_values("mean_accuracy", ascending=False).reset_index(drop=True)
comparison
:::

Both NB models are far above the dummy (≈ 0.10, since there are 10 roughly balanced classes). Small fold std → the estimate is stable. All fit in milliseconds — NB just counts.

## 4 · Select, refit, test once

:::exercise id=pd_final title="Refit the winner and evaluate once"
--- task
1. `best_name` — first row of `comparison`
2. `fitted_model` — `clone(candidates[best_name])` fitted on **all** training rows
3. `predictions` — for `X_test`
4. Print the test accuracy and `classification_report`, and plot the confusion matrix.
--- starter
from sklearn.base import clone
from sklearn.metrics import classification_report, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
best_name = None
fitted_model = None
predictions = None
--- check
assert best_name == comparison["model"].iloc[0], "best_name = comparison['model'].iloc[0]"
assert hasattr(fitted_model, "classes_"), "fit the cloned model on X_train, y_train"
assert len(predictions) == len(X_test), "predictions = fitted_model.predict(X_test)"
--- solution
from sklearn.base import clone
from sklearn.metrics import classification_report, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
best_name = comparison["model"].iloc[0]
fitted_model = clone(candidates[best_name]).fit(X_train, y_train)
predictions = fitted_model.predict(X_test)
print("Selected:", best_name, "· test accuracy:", fitted_model.score(X_test, y_test))
print(classification_report(y_test, predictions, zero_division=0))
ConfusionMatrixDisplay.from_predictions(y_test, predictions, cmap="Blues")
plt.show()
:::

:::exercise id=pd_pair title="Find the most confused pair"
--- task
From the test confusion matrix (`confusion_matrix(y_test, predictions)`), find the most confused **pair** of digits (adding both directions). Store it as a sorted tuple `worst_pair` (e.g. `(1, 7)`), and the two directional counts in `counts_ab`, `counts_ba`.
--- starter
from sklearn.metrics import confusion_matrix
import numpy as np
cm = confusion_matrix(y_test, predictions)
worst_pair = None
counts_ab = None
counts_ba = None
print(worst_pair, counts_ab, counts_ba)
--- check
import numpy as np
cm_ = confusion_matrix(y_test, predictions)
sym = cm_ + cm_.T; np.fill_diagonal(sym, 0)
a, b = np.unravel_index(sym.argmax(), sym.shape)
assert worst_pair == tuple(sorted((int(a), int(b)))), f"worst_pair = {worst_pair}; expected {tuple(sorted((int(a), int(b))))}"
--- hint
Add the matrix to its transpose (`cm + cm.T`), set the diagonal to 0 (`np.fill_diagonal`), then find the position of the maximum with `np.unravel_index(m.argmax(), m.shape)`.
--- solution
from sklearn.metrics import confusion_matrix
import numpy as np
cm = confusion_matrix(y_test, predictions)
sym = cm + cm.T
np.fill_diagonal(sym, 0)
a, b = np.unravel_index(sym.argmax(), sym.shape)
worst_pair = tuple(sorted((int(a), int(b))))
counts_ab = int(cm[worst_pair[0], worst_pair[1]])
counts_ba = int(cm[worst_pair[1], worst_pair[0]])
print(worst_pair, counts_ab, counts_ba)
:::

:::warn title="Observation vs explanation"
The matrix shows *that* these digits get confused — not *why*. “Similar pen paths” is a hypothesis. To investigate, plot the misclassified trajectories and check the model's assumptions. And do **not** go back and tune the model on these test results.
:::

:::quiz title="Exit ticket"
? Where did model selection happen?
+ In cross-validation on the training set
- On the final test set
- On the whole dataset
> The test set was used once, after the choice.

? In `cross_validate`, what is `test_score`?
+ the score on each validation fold inside the training data
- the score on X_test
> A confusing name — it is not the final test set.

? What does a small standard deviation of the fold scores indicate?
+ The performance estimate is stable across folds
- The model is always correct
> Large std means the score depends a lot on which rows are validated.

? Why must the final model be refit on all training rows after CV?
+ CV fits were each trained on only part of the training data; the final model should use all of it
- Because CV deletes the model
> CV estimates; the refit produces the final model.

? What does α fix in Multinomial NB?
+ Zero probabilities for features never seen in a class
- Numerical underflow
- The class imbalance
> Smoothing replaces zeros by small values; logs fix underflow.
:::
