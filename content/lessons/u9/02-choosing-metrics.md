Which metric should you optimise? **It depends on what a mistake costs.** This lesson trains that judgement.

## Recap

| Metric | Question |
|---|---|
| **Accuracy** | how often is the model correct overall? |
| **Precision** | of the predicted positives, how many are actually positive? |
| **Recall** | of the actual positives, how many did the model identify? |
| **F1** | how well does the model balance precision and recall? |

Remember: a **false positive (FP)** is a false alarm; a **false negative (FN)** is a miss. Precision suffers from FPs, recall suffers from FNs.

## Use case 1 — medical screening

A model screens patients for a **serious but treatable** disease.

- FP: a healthy patient is flagged → extra tests, worry, cost.
- FN: an affected patient is classified healthy → **untreated disease**.

The FN is far more dangerous → prioritise **recall**.

## Use case 2 — spam detection

- FP: an important legitimate email lands in spam → you miss a job offer.
- FN: a spam email reaches the inbox → mildly annoying.

The FP is worse → prioritise **precision** (for the spam class).

## Use case 3 — defect detection

- **Scenario A, safety-critical components:** a defective part could cause an accident → misses are unacceptable → **recall**.
- **Scenario B, cosmetic defects:** flagged products are discarded, rejecting good ones is expensive → **precision**.

Same model type, same data type — different priorities. And when both matter and classes are imbalanced: **F1**. Accuracy is fine mainly when classes are balanced and both errors cost about the same.

:::quiz
? A bank flags transactions as fraud; every flag is checked by an employee (cheap), but a missed fraud is very expensive. Prioritise…
+ recall
- precision
- accuracy
> Missing fraud (FN) costs most; false alarms are cheap to check.

? A system automatically deletes uploaded photos that it classifies as inappropriate, with no human review. Prioritise…
- recall
+ precision
> A false positive deletes a legitimate photo — hard to undo.

? 99.5 % of products are fine. A model predicts “fine” for everything. Accuracy?
= 0.995
> And recall for defects is 0 — accuracy hides the failure on rare classes.
:::

## Same model, different threshold

Many classifiers output a **score / probability**. The decision rule “predict positive if score ≥ threshold” is a **separate choice** — you can trade precision against recall **without retraining**:

| threshold | recall | precision |
|---|---|---|
| 0.30 | 100 % | 75 % |
| 0.50 | 67 % | 67 % |
| 0.80 | 33 % | 100 % |

:::viz name=threshold
Find a threshold with recall ≥ 0.95. What happens to precision? Then find one with precision ≥ 0.95.
:::

For medical screening you would choose a relatively **low** threshold (catch nearly everyone, accept more false alarms). For automatic spam deletion, a **high** threshold.

:::exercise id=thresh title="Pick a threshold for a recall target"
--- task
`scores` are predicted probabilities, `y` the true labels (1 = sick). For each threshold in `np.arange(0.05, 1.0, 0.05)` compute precision and recall (predict 1 if score ≥ threshold).

Store `best_t` = the **highest** threshold whose recall is still ≥ 0.9, and `prec_at_best` = the precision at that threshold.
--- setup
import numpy as np
rng = np.random.default_rng(3)
y = np.r_[np.ones(40, int), np.zeros(160, int)]
scores = np.clip(np.r_[rng.normal(0.68, 0.16, 40), rng.normal(0.32, 0.16, 160)], 0.01, 0.99)
--- starter
best_t = None
prec_at_best = None
for t in np.arange(0.05, 1.0, 0.05):
    pred = (scores >= t).astype(int)
    tp = ((pred == 1) & (y == 1)).sum()
    fp = ((pred == 1) & (y == 0)).sum()
    fn = ((pred == 0) & (y == 1)).sum()
    # TODO: precision, recall; remember the highest t with recall >= 0.9
print(best_t, prec_at_best)
--- check
import numpy as np
ok = []
for t in np.arange(0.05, 1.0, 0.05):
    p = (scores >= t).astype(int); tp = ((p == 1) & (y == 1)).sum(); fp = ((p == 1) & (y == 0)).sum(); fn = ((p == 0) & (y == 1)).sum()
    if tp / (tp + fn) >= 0.9: ok.append((t, tp / (tp + fp)))
t_exp, p_exp = max(ok)
assert best_t is not None and abs(best_t - t_exp) < 1e-9, f"best_t = {best_t}, expected {t_exp:.2f}"
assert abs(prec_at_best - p_exp) < 1e-9, f"prec_at_best = {prec_at_best}, expected {p_exp:.3f}"
--- hint
Inside the loop: `recall = tp / (tp + fn)`, `precision = tp / (tp + fp)`; `if recall >= 0.9: best_t, prec_at_best = t, precision` — since t increases, the last one kept is the highest.
--- solution
best_t = None
prec_at_best = None
for t in np.arange(0.05, 1.0, 0.05):
    pred = (scores >= t).astype(int)
    tp = ((pred == 1) & (y == 1)).sum()
    fp = ((pred == 1) & (y == 0)).sum()
    fn = ((pred == 0) & (y == 1)).sum()
    precision = tp / (tp + fp)
    recall = tp / (tp + fn)
    if recall >= 0.9:
        best_t, prec_at_best = t, precision
print(best_t, prec_at_best)
:::

:::warn
Choose the threshold on **validation** data, not on the final test set — it is a hyperparameter of the decision rule.
:::

:::key title="Summary"
Ask “which error is worse?”. Misses costly → **recall**; false alarms costly → **precision**; both / imbalanced → **F1**. The threshold moves along the precision–recall trade-off without retraining.
:::
