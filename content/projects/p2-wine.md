**Goal:** you are given chemical measurements of 178 Italian wines from three cultivars. Build a classifier that identifies the cultivar, compare **four** models fairly, and explain what you see.

New in this project: **feature scaling** with a `Pipeline`, and comparing models on equal terms. (The dataset ships with scikit-learn, so no download is needed.)

:::exercise id=p2s1 kind=project title="Step 1 — Load and inspect"
--- task
Load the data with `load_wine(as_frame=True)`. Create `X` (DataFrame of 13 features) and `y` (Series of class labels 0/1/2).

Inspect: shape, class counts, and `X.describe()`. Store the **ratio** between the largest and the smallest feature *mean* in `scale_ratio` (it shows how differently scaled the features are).
--- starter
from sklearn.datasets import load_wine
import pandas as pd
data = load_wine(as_frame=True)
X = None
y = None
scale_ratio = None
--- check
assert X.shape == (178, 13) and y.shape == (178,), "X = data.data, y = data.target"
m = X.mean()
assert abs(scale_ratio - m.max() / m.min()) < 1e-6, "scale_ratio = X.mean().max() / X.mean().min()"
--- solution
from sklearn.datasets import load_wine
import pandas as pd
data = load_wine(as_frame=True)
X = data.data
y = data.target
print(X.shape, y.value_counts().to_dict())
display(X.describe().T[["mean", "std", "min", "max"]])
scale_ratio = X.mean().max() / X.mean().min()
print("largest mean / smallest mean:", round(scale_ratio))
:::

“proline” is in the hundreds, “hue” around 1. Distance- and gradient-based models care about such scale differences; trees don't.

:::exercise id=p2s2 kind=project title="Step 2 — Split once, keep the test set locked"
--- task
Make a stratified 75/25 split with `random_state=0`: `X_train, X_test, y_train, y_test`.
--- starter
from sklearn.model_selection import train_test_split
--- check
assert len(X_test) == 45 and len(X_train) == 133, f"sizes: {len(X_train)}, {len(X_test)}"
assert abs(y_test.value_counts(normalize=True).sort_index() - y.value_counts(normalize=True).sort_index()).max() < 0.03, "Use stratify=y."
--- solution
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=0)
:::

## Scaling inside a pipeline

`StandardScaler` subtracts each feature's mean and divides by its standard deviation, so every feature has mean 0 and std 1. Crucially it must learn those means/stds **from the training data only** — a `Pipeline` guarantees that: `fit` fits the scaler on the training data, then the model; `predict` reuses the training statistics.

:::exercise id=p2s3 kind=project title="Step 3 — Compare four models with cross-validation"
--- task
Compare these models using **5-fold cross-validation on the training set only** (`cross_val_score(model, X_train, y_train, cv=5)`):

- `"dummy"`: `DummyClassifier(strategy="most_frequent")`
- `"logreg (raw)"`: `LogisticRegression(max_iter=5000)`
- `"logreg (scaled)"`: `make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000))`
- `"tree"`: `DecisionTreeClassifier(random_state=0)`
- `"forest"`: `RandomForestClassifier(n_estimators=200, random_state=0)`

Store the mean CV accuracies in a dict `cv_means = {name: mean}`.
--- starter
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier

models = {
    # TODO: the five models
}
cv_means = {}
for name, m in models.items():
    pass  # TODO
pd.Series(cv_means).sort_values(ascending=False)
--- check
assert set(cv_means) == {"dummy", "logreg (raw)", "logreg (scaled)", "tree", "forest"}, f"keys: {set(cv_means)}"
assert cv_means["dummy"] < 0.45, "the dummy should be around 0.40"
assert cv_means["logreg (scaled)"] > 0.95 and cv_means["forest"] > 0.93, "scaled logistic regression and the forest should be well above 0.93"
--- hint
`cv_means[name] = cross_val_score(m, X_train, y_train, cv=5).mean()`
--- solution
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
import warnings
warnings.filterwarnings("ignore")

models = {
    "dummy": DummyClassifier(strategy="most_frequent"),
    "logreg (raw)": LogisticRegression(max_iter=5000),
    "logreg (scaled)": make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)),
    "tree": DecisionTreeClassifier(random_state=0),
    "forest": RandomForestClassifier(n_estimators=200, random_state=0),
}
cv_means = {}
for name, m in models.items():
    cv_means[name] = cross_val_score(m, X_train, y_train, cv=5).mean()
pd.Series(cv_means).sort_values(ascending=False)
:::

:::exercise id=p2s4 kind=project title="Step 4 — Select, refit, test once"
--- task
1. `best_name` — the model with the highest mean CV accuracy (`max(cv_means, key=cv_means.get)`)
2. `final` — that model, fitted on **all** training data
3. `test_acc` — its accuracy on the test set (evaluate **once**)
4. Plot the confusion matrix of the test predictions.
--- starter
from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt
best_name = None
final = None
test_acc = None
--- check
assert best_name == max(cv_means, key=cv_means.get), "best_name = max(cv_means, key=cv_means.get)"
assert hasattr(final, "predict") and abs(test_acc - final.score(X_test, y_test)) < 1e-12, "test_acc = final.score(X_test, y_test)"
--- solution
from sklearn.metrics import ConfusionMatrixDisplay
import matplotlib.pyplot as plt
best_name = max(cv_means, key=cv_means.get)
final = models[best_name].fit(X_train, y_train)
test_acc = final.score(X_test, y_test)
print(best_name, test_acc)
ConfusionMatrixDisplay.from_predictions(y_test, final.predict(X_test))
plt.show()
:::

:::exercise id=p2s5 kind=project title="Step 5 — What does the forest find important?"
--- task
Fit a random forest (`n_estimators=200, random_state=0`) on the training data and store `importances` — a Series of `feature_importances_` indexed by feature names, **sorted descending**. Plot the top 5 as a horizontal bar chart.
--- starter
importances = None
--- check
import pandas as pd
assert isinstance(importances, pd.Series) and len(importances) == 13, "importances should be a Series with 13 entries."
assert importances.iloc[0] >= importances.iloc[-1], "sort descending"
--- solution
rf = RandomForestClassifier(n_estimators=200, random_state=0).fit(X_train, y_train)
importances = pd.Series(rf.feature_importances_, index=X.columns).sort_values(ascending=False)
importances.head(5)[::-1].plot(kind="barh", title="Top 5 feature importances")
plt.show()
importances.head()
:::

## Reflection

:::reveal title="Why did scaling help logistic regression but would not change the tree?"
Logistic regression's optimiser and its L2 penalty treat all weights alike; with features on wildly different scales, the penalty and the optimisation are unbalanced (and the solver may need many iterations). Trees split on thresholds of one feature at a time — multiplying a feature by a constant just moves the threshold, so the tree is unchanged.
:::

:::reveal title="Feature importance ≠ cause"
A high importance means the forest *used* that feature a lot to split. It does not prove the chemistry causes the cultivar difference, and correlated features can share or steal importance from each other.
:::
