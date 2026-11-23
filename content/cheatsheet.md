# Cheat sheet

Everything you need to *write* code for the course, on one page. For concepts, see the **Glossary**.

## Python

```python
x = 5; x += 1                    # assignment
f"{value:.2f}  {share:.1%}"      # f-strings: 2 decimals, percent
nums[0], nums[-1], nums[1:4]     # index from 0, last, slice (end excluded)
[w * x for x in xs if x > 0]     # list comprehension
for x, y in zip(xs, ys): ...     # walk two lists together
for i, x in enumerate(xs): ...   # with position
def f(a, b=2):                   # function with default
    return a * b
d = {"key": 1}; d["key"]         # dict (missing key → KeyError)
```

## NumPy

```python
import numpy as np
a = np.array([1, 2, 3]);  a * 2, a.mean(), a.std(), a.argmax()
X.shape                          # (rows, columns)
X[:, 0], X[0], X[1:3, :2]        # column, row, block
img.reshape(28, 28)              # same values, new shape
a[a > 2], (a > 2).sum()          # mask filter, count
(y_true == y_pred).mean()        # accuracy
A @ w + b                        # matrix × vector (linear model)
np.random.default_rng(42)        # reproducible randomness
```

## pandas

```python
import pandas as pd
df = pd.read_csv("data/file.csv", sep=";", encoding="latin1",
                 header=None, parse_dates=["Date"], dayfirst=True, index_col="Date")
df.head(); df.shape; df.dtypes; df.describe(); df.isna().sum()
df["col"]          # Series        df[["a", "b"]]   # DataFrame
df.iloc[:, :4]     # by position    df.loc[0:5, "a"] # by label
df[df["age"] >= 30]                       # filter
df[(df.a > 1) & (df.b == "x")]            # combine with & / |, brackets!
df["new"] = df["a"] / df["b"]             # new column
df["y"].value_counts()                    # class counts
df.groupby("city")["spend"].mean()        # per group
pd.crosstab(df.a, df.b)                   # count table
```

## scikit-learn workflow

```python
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans, MiniBatchKMeans
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             ConfusionMatrixDisplay, adjusted_rand_score, silhouette_score)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
scores = cross_val_score(model, X_train, y_train, cv=5)   # select on TRAINING data
model.fit(X_train, y_train)                               # learn parameters
model.predict_proba(X_test.iloc[0:1])                     # probabilities (2-D input!)
model.predict(X_test); model.score(X_test, y_test)        # labels; accuracy — test ONCE
print(classification_report(y_test, model.predict(X_test)))
ConfusionMatrixDisplay.from_predictions(y_test, model.predict(X_test))   # rows = true
```

## matplotlib

```python
import matplotlib.pyplot as plt
plt.plot(x, y); plt.scatter(x, y); plt.hist(v, bins=30); plt.imshow(img, cmap="gray")
plt.xlabel("..."); plt.ylabel("..."); plt.title("..."); plt.legend(); plt.show()
fig, axes = plt.subplots(2, 5, figsize=(10, 4))     # grid; loop over axes.ravel()
```

## Key formulas

| | |
|---|---|
| MSE / RMSE / MAE | $\frac1n\sum(y-\hat y)^2$ · $\sqrt{\text{MSE}}$ · $\frac1n\sum\lvert y-\hat y\rvert$ |
| gradient descent | $w \leftarrow w - \eta\,\frac{dL}{dw}$ |
| sigmoid / softmax | $\frac{1}{1+e^{-z}}$ · $\frac{e^{z_k}}{\sum_j e^{z_j}}$ |
| log loss | $-[y\log p + (1-y)\log(1-p)]$ |
| Bayes | posterior ∝ likelihood × prior |
| precision / recall / F1 | $\frac{TP}{TP+FP}$ · $\frac{TP}{TP+FN}$ · $\frac{2PR}{P+R}$ |
| SUS | (Σ(odd − 1) + Σ(5 − even)) × 2.5 |
| Cohen's κ | $(p_o-p_e)/(1-p_e)$ |

## Debugging checklist

1. Read the **last line** of the error. 2. `print(x.shape, type(x))`, `df.columns`, `os.getcwd()`. 3. One hypothesis, smallest change. 4. **Restart & Run All**.
