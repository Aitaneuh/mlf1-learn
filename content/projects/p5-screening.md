**Scenario:** a clinic wants a model that flags breast-tumour biopsies as **malignant** for a second review. Missing a malignant case is much worse than an extra review. Build the model **the proper way**: clean split, pipeline (no leakage), cross-validated tuning, a threshold chosen on validation data for a recall target, one final test, and an error analysis.

Data: scikit-learn's breast-cancer dataset (569 samples, 30 features). In this dataset `target = 0` means **malignant**, `1` benign — we will flip it so that **1 = malignant** (the positive class).

:::exercise id=p5s1 kind=project title="Step 1 — Data and a three-way split"
--- task
1. Load `X, y` with `load_breast_cancer(return_X_y=True)` and set `y = 1 - y` (1 = malignant). `pos_rate` = share of malignant cases.
2. Split off a **test set** (20 %, stratified, `random_state=0`): `X_rest, X_test, y_rest, y_test`.
3. Split the rest into **training** (75 %) and **validation** (25 %), stratified, `random_state=0`: `X_train, X_val, y_train, y_val`.
--- starter
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
import numpy as np
--- check
assert abs(pos_rate - 212/569) < 1e-9, f"pos_rate = {pos_rate}"
assert len(X_test) == 114 and len(X_val) + len(X_train) == 455 and abs(len(X_val) - 114) <= 1, f"sizes {len(X_train)}, {len(X_val)}, {len(X_test)}"
--- solution
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
import numpy as np
X, y = load_breast_cancer(return_X_y=True)
y = 1 - y
pos_rate = y.mean()
X_rest, X_test, y_rest, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
X_train, X_val, y_train, y_val = train_test_split(X_rest, y_rest, test_size=0.25, stratify=y_rest, random_state=0)
print(pos_rate, X_train.shape, X_val.shape, X_test.shape)
:::

:::exercise id=p5s2 kind=project title="Step 2 — Tune C with cross-validation (no leakage)"
--- task
Build `make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000, C=c))` for `c` in `[0.01, 0.1, 1, 10, 100]` and compute the mean **5-fold CV recall** on the **training set** (`cross_val_score(..., scoring="recall")`). Store `cv_recall = {c: mean}` and `best_C`.

Why is the scaler inside the pipeline? So that in each fold it is fitted only on that fold's training part.
--- starter
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
cv_recall = {}
best_C = None
--- check
assert set(cv_recall) == {0.01, 0.1, 1, 10, 100}
assert best_C == max(cv_recall, key=cv_recall.get)
--- solution
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
cv_recall = {}
for c in [0.01, 0.1, 1, 10, 100]:
    pipe = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000, C=c))
    cv_recall[c] = cross_val_score(pipe, X_train, y_train, cv=5, scoring="recall").mean()
best_C = max(cv_recall, key=cv_recall.get)
print(cv_recall, best_C)
:::

:::exercise id=p5s3 kind=project title="Step 3 — Choose a threshold on the validation set"
--- task
Fit `model` (pipeline with `best_C`) on the training set. Get validation probabilities `p_val = model.predict_proba(X_val)[:, 1]`.

Among thresholds `np.round(np.arange(0.05, 0.96, 0.01), 2)`, choose `threshold` = the **highest** one whose validation recall is ≥ **0.97**. Also store the validation precision at that threshold in `val_precision`.
--- starter
from sklearn.metrics import precision_score, recall_score
model = None
p_val = None
threshold = None
val_precision = None
print(threshold, val_precision)
--- check
from sklearn.metrics import recall_score
assert threshold is not None and recall_score(y_val, (p_val >= threshold).astype(int)) >= 0.97, "recall at your threshold must be ≥ 0.97"
higher = [t for t in np.round(np.arange(0.05, 0.96, 0.01), 2) if t > threshold + 1e-9 and recall_score(y_val, (p_val >= t).astype(int)) >= 0.97]
assert not higher, f"a higher threshold ({higher[-1]}) still reaches recall ≥ 0.97"
--- solution
from sklearn.metrics import precision_score, recall_score
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000, C=best_C)).fit(X_train, y_train)
p_val = model.predict_proba(X_val)[:, 1]
threshold, val_precision = None, None
for t in np.round(np.arange(0.05, 0.96, 0.01), 2):
    pred = (p_val >= t).astype(int)
    if recall_score(y_val, pred) >= 0.97:
        threshold, val_precision = t, precision_score(y_val, pred)
print(threshold, val_precision)
:::

:::exercise id=p5s4 kind=project title="Step 4 — Refit, then test ONCE"
--- task
Refit the pipeline (best C) on **training + validation** (`X_rest, y_rest`) as `final`. Apply your chosen threshold to the test probabilities and compute `test_recall`, `test_precision`, and the confusion matrix `cm` (`confusion_matrix(y_test, pred_test)`).
--- starter
from sklearn.metrics import confusion_matrix
final = None
pred_test = None
test_recall = None
test_precision = None
cm = None
print(cm, test_recall, test_precision)
--- check
from sklearn.metrics import recall_score, precision_score
assert hasattr(final, "predict_proba") and len(pred_test) == len(y_test)
assert abs(test_recall - recall_score(y_test, pred_test)) < 1e-12 and abs(test_precision - precision_score(y_test, pred_test)) < 1e-12
--- solution
from sklearn.metrics import confusion_matrix
final = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000, C=best_C)).fit(X_rest, y_rest)
pred_test = (final.predict_proba(X_test)[:, 1] >= threshold).astype(int)
test_recall = recall_score(y_test, pred_test)
test_precision = precision_score(y_test, pred_test)
cm = confusion_matrix(y_test, pred_test)
print(cm, test_recall, test_precision)
:::

:::exercise id=p5s5 kind=project title="Step 5 — Error analysis"
--- task
1. `missed` — indices (in the test set) of malignant cases predicted benign (FN)
2. `alarms` — indices of benign cases predicted malignant (FP)
3. For the FN cases, show their predicted probabilities. Are they borderline or confidently wrong?
--- starter
p_test = final.predict_proba(X_test)[:, 1]
missed = None
alarms = None
print("missed:", missed, p_test[missed] if missed is not None else None)
print("false alarms:", len(alarms) if alarms is not None else None)
--- check
import numpy as np
assert np.array_equal(np.sort(missed), np.where((y_test == 1) & (pred_test == 0))[0]), "missed = np.where((y_test == 1) & (pred_test == 0))[0]"
assert np.array_equal(np.sort(alarms), np.where((y_test == 0) & (pred_test == 1))[0])
--- solution
p_test = final.predict_proba(X_test)[:, 1]
missed = np.where((y_test == 1) & (pred_test == 0))[0]
alarms = np.where((y_test == 0) & (pred_test == 1))[0]
print("missed:", missed, p_test[missed])
print("false alarms:", len(alarms))
:::

## Write your conclusion

:::reveal title="Questions to answer (then compare with these notes)"
1. **What did we optimise and why?** Recall for the malignant class, because a missed malignant tumour is the costliest error; we accepted more false alarms (second reviews).
2. **Where were choices made?** C by CV on training data; threshold on the validation set; the test set was used once.
3. **Is test recall exactly 0.97?** Probably not — the validation set is small (≈ 40 malignant cases); one case changes recall by ~2.5 points. Report uncertainty.
4. **What is missing before deployment?** Evaluation on this clinic's own data (different scanners, populations), the reviewers' workload (application/process level, Unit 10), monitoring over time.
:::
