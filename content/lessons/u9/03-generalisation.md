The real goal of ML is **generalisation**: good performance on data the model has never seen. This lesson collects the tools that protect you from fooling yourself.

## Why not evaluate on the training data?

| | training data | unseen data |
|---|---|---|
| Model A | 99 % | 72 % |
| Model B | 93 % | 90 % |

Choose **B**. A has *memorised* its training data. Only unseen data tells you what to expect in production.

## Training, validation and test sets

<div class="diagram">
<svg viewBox="0 0 660 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="20" width="440" height="44" rx="7" style="fill:var(--c1);opacity:.75"/><text x="230" y="47" text-anchor="middle" style="fill:#fff;font-weight:700" class="dg-t">Training (~70 %)</text>
  <rect x="455" y="20" width="125" height="44" rx="7" style="fill:var(--c2);opacity:.85"/><text x="517" y="47" text-anchor="middle" style="fill:#fff;font-weight:700" class="dg-t">Validation (~20 %)</text>
  <rect x="585" y="20" width="65" height="44" rx="7" style="fill:var(--c3);opacity:.9"/><text x="617" y="47" text-anchor="middle" style="fill:#fff;font-weight:700" class="dg-t">Test</text>
  <text x="230" y="88" text-anchor="middle" class="dg-s">learn the model parameters</text>
  <text x="517" y="88" text-anchor="middle" class="dg-s">tune hyperparameters,</text><text x="517" y="104" text-anchor="middle" class="dg-s">select models</text>
  <text x="617" y="88" text-anchor="middle" class="dg-s">evaluate the final</text><text x="617" y="104" text-anchor="middle" class="dg-s">model once</text>
</svg>
</div>

- **Training** — how does the model learn? (fits the parameters)
- **Validation** — which model / settings should we choose? (iterate during development; cross-validation replaces a fixed validation set when data is scarce)
- **Test** — how well does the chosen model generalise? (used **once** at the end)

## Parameters vs hyperparameters (again, because it matters)

| Parameters | Hyperparameters |
|---|---|
| learned automatically from training data | chosen before training, often tuned on validation data |
| regression coefficients w, b · tree split thresholds · neural-network weights | learning rate · max tree depth · number of trees · K in KNN · C · α |

## Data leakage

**Data leakage** = information that would not legitimately be available at prediction time influences training or validation.

Example: predict whether a student passes the final exam using: lectures attended, average homework grade, previous semester grades, **final course grade**. The model will be almost perfect — and useless: the final grade *is* (almost) the answer, and it does not exist yet when you want to predict.

Other common leaks: duplicates of the same item in training and test, scaling/feature selection fitted on all data before splitting, using future information in time series, tuning on the test set.

:::quiz
? Which feature leaks the target when predicting hospital readmission within 30 days?
+ “number of days until readmission”
- age of the patient
- number of previous admissions
> It is only known after the outcome happens.

? You standardise features using the mean and std of the **whole** dataset, then split. Problem?
+ Test-set statistics leaked into the training preprocessing
- None
> Fit preprocessing on training data only (a Pipeline does this).
:::

## Underfitting and overfitting

- **Underfitting:** the model is too simple to capture the relevant pattern — bad on training **and** validation data.
- **Good fit:** captures the useful pattern without fitting the noise.
- **Overfitting:** learns the noise and quirks of the training data — great on training data, worse on validation data.

:::viz name=overfit
Slide the complexity from 0 to 11. Watch the **training** error keep falling while the **validation** error first falls, then rises.
:::

## Training vs validation curves

Plot loss against **epochs** (or complexity): the training loss usually keeps decreasing; the validation loss decreases, then starts to **increase** when overfitting begins. Stop where the validation loss is lowest (**early stopping**).

:::exercise id=curve title="Find the right tree depth with a validation set"
--- task
Using the breast-cancer data (provided as `X_tr, X_val, y_tr, y_val`), fit `DecisionTreeClassifier(max_depth=d, random_state=0)` for `d` in 1…12. Record training and validation accuracy in lists `train_acc`, `val_acc`, plot both against depth, and store `best_depth` = the depth with the highest **validation** accuracy (the smallest one if tied).
--- setup
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
X, y = load_breast_cancer(return_X_y=True)
X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.3, stratify=y, random_state=1)
--- starter
from sklearn.tree import DecisionTreeClassifier
import matplotlib.pyplot as plt
import numpy as np
depths = range(1, 13)
train_acc, val_acc = [], []
# TODO
best_depth = None
print(best_depth)
--- check
import numpy as np
assert len(train_acc) == 12 and len(val_acc) == 12
assert train_acc[-1] == 1.0, "a deep tree should fit the training data perfectly"
assert best_depth == list(range(1, 13))[int(np.argmax(val_acc))], f"best_depth = {best_depth}"
--- hint
`best_depth = list(depths)[int(np.argmax(val_acc))]` — `argmax` returns the first maximum.
--- solution
from sklearn.tree import DecisionTreeClassifier
import matplotlib.pyplot as plt
import numpy as np
depths = range(1, 13)
train_acc, val_acc = [], []
for d in depths:
    t = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr)
    train_acc.append(t.score(X_tr, y_tr))
    val_acc.append(t.score(X_val, y_val))
best_depth = list(depths)[int(np.argmax(val_acc))]
plt.plot(depths, train_acc, "o-", label="training")
plt.plot(depths, val_acc, "o-", label="validation")
plt.xlabel("max_depth"); plt.ylabel("accuracy"); plt.legend(); plt.show()
print(best_depth)
:::

## The model development loop

Create → provision → train → **evaluate on validation** → adjust (features, model, hyperparameters, more data) → repeat… and only at the very end: **one** evaluation on the test set.

:::key title="Summary"
Train / validation / test have different jobs. Avoid leakage. Underfitting: both errors high. Overfitting: training error low, validation error high. Tune hyperparameters on validation data (or CV), test once.
:::
