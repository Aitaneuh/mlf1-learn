The whole course as one story. Read it, and wherever a sentence feels shaky, jump back to that unit (or the Glossary) before the final exam.

## The story in 12 steps

1. **Why ML** (U0) — data + computing + algorithms. ML learns rules from **examples with answers** instead of hand-written rules. Data engineers build data systems and **integrate and evaluate** ML.
2. **Python** (U1) — variables, lists/dicts, loops, comprehensions, functions, NumPy arrays, `.shape`, masks.
3. **Environments** (U2) — code depends on a whole stack. venv (packages) < Docker (application) < VM (machine); Kubernetes orchestrates containers. **Kernel = process with memory**; execution order matters; reproducible = Restart & Run All.
4. **Data → predictions** (U3) — observation, feature, target, prediction; X `(n, p)`, y `(n,)`. One-hot for nominal categories. Regression vs classification; supervised vs unsupervised. Linear regression $\hat y = \mathbf w\cdot\mathbf x + b$.
5. **Learning** (U4) — loss (MSE), derivative = slope, gradient descent $w \leftarrow w - \eta\,\frac{dL}{dw}$, learning rate, step/batch/epoch. Evaluate on **unseen** data.
6. **pandas** (U5) — inspect (`head, shape, dtypes, isna, value_counts`), select (`df["c"]`, `.iloc`), filter, groupby; load with the right `sep`, `encoding`, dates.
7. **Classification** (U6) — sigmoid → probability → threshold; log loss punishes confident mistakes; softmax for multiclass; L2 regularisation (`C` inverse); trees and forests; fit / predict_proba / predict / score; beat a dummy baseline.
8. **Bayes** (U7) — posterior ∝ likelihood × prior; Naive Bayes counts and averages; smoothing α; precision, recall, F1; cross-validation inside the training set.
9. **No labels** (U8) — K-means (assign/update, inertia, silhouette, ARI) vs KNN (vote of K neighbours); TF-IDF + NMF topics.
10. **Workflow & evaluation** (U9) — create → provision → train → evaluate → adjust. Metric depends on the cost of errors; thresholds trade precision/recall; train/validation/test; leakage; under/overfitting; error analysis.
11. **Applications & experiments** (U10) — five evaluation levels; usability testing; SUS; A/B tests (IV/DV/controls, randomise, counterbalance); clean transparently; conclude only what's supported.
12. **Annotation** (U11) — labels, guidelines, agreement; Cohen's κ.

## The ten most-confused pairs

| Don't confuse… | …with | Difference |
|---|---|---|
| feature | parameter | given input vs learned value |
| parameter | hyperparameter | learned by fit vs chosen before |
| loss | metric | what training minimises vs what we report |
| validation set | test set | choose models vs final estimate, used once |
| precision | recall | “are my alarms right?” vs “did I find them all?” |
| K-means | KNN | unsupervised, K clusters vs supervised, K neighbours |
| ARI | accuracy | agreement of groupings vs fraction of correct labels |
| notebook file | kernel | saved code/outputs vs running memory |
| sigmoid / softmax | log loss / cross-entropy | turn scores into probabilities vs measure the error |
| task completion | task success | submitted vs meets the requirements |

## Formulas on one card

| | |
|---|---|
| MSE | $\frac1n\sum(y-\hat y)^2$ · RMSE = $\sqrt{\text{MSE}}$ · MAE = $\frac1n\sum\lvert y-\hat y\rvert$ · ME = $\frac1n\sum(\hat y - y)$ |
| gradient step | $w \leftarrow w - \eta \cdot \frac{dL}{dw}$, with $\frac{d}{dw}(y - wx)^2 = 2x(wx - y)$ |
| sigmoid | $\sigma(z) = 1/(1+e^{-z})$ |
| softmax | $p_k = e^{z_k} / \sum_j e^{z_j}$ |
| log loss | $-[y\log p + (1-y)\log(1-p)]$ |
| Bayes | $P(c\mid x) = P(x\mid c)P(c)/P(x)$ |
| smoothing | $(N_{cj}+\alpha)/(\sum_k N_{ck} + \alpha V)$ |
| precision / recall / F1 | $\frac{TP}{TP+FP}$ / $\frac{TP}{TP+FN}$ / $\frac{2PR}{P+R}$ |
| SUS | (Σ(odd − 1) + Σ(5 − even)) × 2.5 |
| kappa | $(p_o - p_e)/(1 - p_e)$ |

## A last warm-up

:::quiz
? You tune K of a KNN classifier on the test set and report the best test accuracy. What is wrong?
+ The test set influenced the choice; the reported score is optimistic. Use CV/validation to choose K.
- Nothing
> The single most common evaluation mistake.

? A model reaches 99 % accuracy on a dataset where 99 % of cases are negative. What do you check next?
+ Recall/precision for the positive class and the confusion matrix
- Nothing, 99 % is excellent
> It might never predict the positive class.

? Training loss decreasing, validation loss increasing. What is happening and what do you do?
+ Overfitting — stop earlier, regularise, simplify, or get more data
- Underfitting — make the model bigger
:::

:::exercise id=mini title="A 10-line ML pipeline from memory"
--- task
Without looking back: on the Iris data, do a stratified 80/20 split (seed 0), fit a scaled logistic regression in a pipeline, and store the test accuracy in `acc` (it should exceed 0.9).
--- starter
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

acc = None
--- check
assert acc is not None and acc > 0.9, f"acc = {acc}"
--- solution
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

iris = pd.read_csv("data/iris.data", header=None)
X, y = iris.iloc[:, :4], iris[4]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_train, y_train)
acc = model.score(X_test, y_test)
print(acc)
:::

Ready? The final exam mixes every unit. Pass mark 75 %. Good luck.
