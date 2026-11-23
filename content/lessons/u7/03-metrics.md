Accuracy = “fraction of correct predictions”. Simple, and often misleading. If 1 % of emails are spam, a model that **never** predicts spam is 99 % accurate — and useless. This lesson gives you the metrics that see through that.

## TP, FP, FN, TN

Focus on one class, say digit **3**: positive = “is a 3”, negative = “any other digit”.

| | **predicted 3** | **predicted not 3** |
|---|---|---|
| **actually 3** | **TP** — true positive (correctly found) | **FN** — false negative (a 3 we missed) |
| **actually not 3** | **FP** — false positive (false alarm) | **TN** — true negative (correctly rejected) |

How to remember: the second word (*positive / negative*) is **what the model predicted**; the first word (*true / false*) says whether that prediction was **correct**.

## A worked example

30 predictions: 10 actual 3s, 20 other digits.

| | predicted 3 | predicted not 3 |
|---|---|---|
| actual 3 | TP = 8 | FN = 2 |
| actual not 3 | FP = 4 | TN = 16 |

Check: 8 + 2 + 4 + 16 = 30. Actual 3s = 8 + 2 = 10. Predicted 3s = 8 + 4 = 12.

## Precision, recall, F1

| Metric | Question | Formula | Example |
|---|---|---|---|
| **Precision** | Of everything **predicted** as 3, how much really was 3? | $\frac{TP}{TP+FP}$ | 8 / 12 ≈ 0.67 |
| **Recall** | Of all **actual** 3s, how many did we find? | $\frac{TP}{TP+FN}$ | 8 / 10 = 0.80 |
| **F1** | Balance of both (harmonic mean) | $\frac{2PR}{P+R} = \frac{2TP}{2TP+FP+FN}$ | 16 / 22 ≈ 0.73 |
| **Accuracy** | Fraction of all predictions correct | $\frac{TP+TN}{\text{total}}$ | 24 / 30 = 0.80 |

F1 is the **harmonic** mean: it is high only when **both** precision and recall are high. (Precision 1.0 and recall 0.0 → F1 = 0, but the arithmetic mean would say 0.5.)

:::exercise id=prf title="Compute the metrics from labels"
--- task
From the arrays `y_true` and `y_pred` (digits), treating **3 as the positive class**, compute `tp, fp, fn, tn` with NumPy masks, then `precision`, `recall`, `f1`, `accuracy` (overall accuracy across all digits: `(y_true == y_pred).mean()`).
--- setup
import numpy as np
y_true = np.array([3, 3, 3, 8, 5, 3, 8, 3, 1, 3, 5, 8])
y_pred = np.array([3, 8, 3, 3, 5, 3, 8, 5, 1, 3, 3, 8])
--- starter
tp = None
fp = None
fn = None
tn = None
precision = None
recall = None
f1 = None
accuracy = None
print(tp, fp, fn, tn, precision, recall, f1, accuracy)
--- check
assert (tp, fp, fn, tn) == (4, 2, 2, 4), f"(tp, fp, fn, tn) = {(tp, fp, fn, tn)}; expected (4, 2, 2, 4)"
assert abs(precision - 4/6) < 1e-9 and abs(recall - 4/6) < 1e-9, f"precision {precision}, recall {recall}"
assert abs(f1 - 4/6) < 1e-9, f"f1 = {f1}"
assert abs(accuracy - 8/12) < 1e-9, f"accuracy = {accuracy} (all digits: 8 of 12 correct)"
--- hint
`tp = ((y_true == 3) & (y_pred == 3)).sum()`; `fp`: predicted 3 but actually not 3.
--- solution
tp = int(((y_true == 3) & (y_pred == 3)).sum())
fp = int(((y_true != 3) & (y_pred == 3)).sum())
fn = int(((y_true == 3) & (y_pred != 3)).sum())
tn = int(((y_true != 3) & (y_pred != 3)).sum())
precision = tp / (tp + fp)
recall = tp / (tp + fn)
f1 = 2 * precision * recall / (precision + recall)
accuracy = (y_true == y_pred).mean()
print(tp, fp, fn, tn, precision, recall, f1, accuracy)
:::

## Reading a multiclass confusion matrix

With 10 digits, the confusion matrix is 10×10. **Rows = true digit, columns = predicted digit.** For digit 3:

- the **diagonal** cell (row 3, column 3) = TP
- the other cells in **row 3** = FN (true 3s predicted as something else)
- the other cells in **column 3** = FP (other digits predicted as 3)

When you find a confused pair (e.g. 3 ↔ 5), report the counts **in both directions** separately. And keep observation and hypothesis apart: “3s are often predicted as 5s” is an observation; “because they look similar” is a **hypothesis** — to confirm it you must inspect the actual trajectories.

## scikit-learn's classification report

`classification_report(y_true, y_pred)` prints precision, recall and F1 **for each class**, plus:

- **support** — number of actual examples of that class in the evaluation set
- **macro avg** — compute the metric per class, then average **equally** (every class counts the same)
- **weighted avg** — average weighted by support (frequent classes count more)

Macro F1 is the mean of the per-class F1 values (not the F1 of macro precision and macro recall). `zero_division=0` reports 0 when a metric is undefined (e.g. precision of a class that was never predicted).

:::code
from sklearn.metrics import classification_report, confusion_matrix
print(confusion_matrix(y_true, y_pred, labels=[1, 3, 5, 8]))
print(classification_report(y_true, y_pred, zero_division=0))
:::

Compare the row for class 3 with your own numbers above.

:::quiz
? A spam filter flags 50 emails; 40 of them are spam. There were 80 spam emails in total. Precision?
= 0.8
> 40 / 50.

? Same filter: recall?
= 0.5
> 40 / 80 — it found half of the spam.

? In a confusion matrix with rows = true and columns = predicted, the off-diagonal cells in **column** 3 are…
+ false positives for class 3
- false negatives for class 3
- true negatives
> Column 3 = everything predicted as 3; off-diagonal → it was not actually 3.

? Precision = 1.0, recall = 0.2. F1?
= 0.3333 tol=0.002
> 2·1·0.2 / 1.2 ≈ 0.333 — the harmonic mean punishes the low recall.

? Classes are very unequal in size. Which average treats every class equally?
+ macro average
- weighted average
> Weighted average gives frequent classes more influence.
:::

:::key title="Summary"
Precision = TP/(TP+FP) “how trustworthy are my alarms?”; Recall = TP/(TP+FN) “how many did I find?”; F1 balances both. Rows = truth, columns = prediction. Observations ≠ explanations.
:::
