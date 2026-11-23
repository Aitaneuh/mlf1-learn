Numbers tell you **how well** a model performs. Looking at individual predictions tells you **where and why** it fails. Both are needed.

| Quantitative evaluation | Qualitative evaluation |
|---|---|
| numerical metrics (accuracy, F1…) | inspection of individual predictions |
| “how well?” | “how does it behave, why does it fail?” |

## Error analysis: look at the wrong predictions

| Email | Actual | Predicted |
|---|---|---|
| Claim your free prize today! | spam | spam |
| URGENT: Meeting moved to 15:00 | legitimate | **spam** |
| Special offer for existing clients | legitimate | **spam** |
| Your account needs verification | spam | **legitimate** |

Pattern? The false positives contain urgency/marketing words (“URGENT”, “offer”) that also appear in real business emails. The false negative is a phishing message written in a calm, legitimate tone.

## Systematic errors

A model can perform well overall but consistently fail on certain kinds of inputs — e.g. **overall recall 92 %, but much lower precision for French emails**. Possible explanation: few French examples in the training data. Aggregated metrics hide this; **slicing** the evaluation by group (language, region, device, customer type…) reveals it.

:::exercise id=slice title="Slice the errors by language"
--- task
`data/spam_predictions.csv` has columns `text, language, actual, predicted`.

1. Load it into `preds` and add a boolean column `correct`.
2. `acc_by_lang` — accuracy per language (a Series: `groupby("language")["correct"].mean()`)
3. `worst_lang` — the language with the lowest accuracy
4. Display the wrong predictions of that language.
--- starter
import pandas as pd
preds = None
acc_by_lang = None
worst_lang = None
--- check
assert "correct" in preds.columns, "add the column correct = actual == predicted"
assert abs(acc_by_lang["en"] - 0.7) < 1e-9, f"acc_by_lang = {dict(acc_by_lang) if acc_by_lang is not None else None}"
assert worst_lang == "fr", f"worst_lang = {worst_lang}"
--- hint
`preds["correct"] = preds["actual"] == preds["predicted"]`; `acc_by_lang.idxmin()`.
--- solution
import pandas as pd
preds = pd.read_csv("data/spam_predictions.csv")
preds["correct"] = preds["actual"] == preds["predicted"]
acc_by_lang = preds.groupby("language")["correct"].mean()
worst_lang = acc_by_lang.idxmin()
print(acc_by_lang)
preds[(preds["language"] == worst_lang) & ~preds["correct"]]
:::

## Model interpretability: what drives a prediction?

**Interpretability** = our ability to understand how a model uses its inputs. Example: explain one rent prediction as **feature contributions** around a baseline (the average model output):

| | CHF |
|---|---|
| baseline (average prediction) | 1'800 |
| living area | +300 |
| distance to station | −100 |
| number of rooms | +50 |
| **prediction** | **2'050** |

Such explanations help ask better diagnostic questions (“does the model perform poorly on small apartments?”). Tools for this come in MLF2.

## What to do after identifying a problem?

| Observation | Possible response |
|---|---|
| poor performance on French texts | improve multilingual training coverage |
| too many false positives | reconsider the threshold or the training strategy |
| model relies on an irrelevant feature | inspect features and potential leakage |
| poor performance on rare examples | collect representative examples or revisit weighting |

:::quiz
? A model's accuracy is 95 % overall but 60 % on images taken at night. This is an example of…
+ a systematic error revealed by slicing the evaluation
- overfitting to the night images
- data leakage
> Aggregated metrics hide group-specific failures.

? The model gives high importance to the “file name” feature of medical scans. What do you suspect?
+ leakage or a shortcut — inspect features and data collection
- the model is very smart
> File names can encode the hospital or diagnosis.

? Which is qualitative evaluation?
+ reading the 20 most confident wrong predictions
- computing the F1 score
:::

:::key title="Summary"
Metrics say *how well*; inspecting errors says *where and why*. Slice by groups to find systematic errors; separate observations from hypotheses; match the fix to the diagnosis.
:::
