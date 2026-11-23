Every supervised model in this course needed **labels**. Where do they come from? Usually from people who **annotate** data. Week 10's warm-up: annotate small Fashion-MNIST clothing images — and discover that annotators don't always agree.

## Annotation = labels + guideline + annotators

Annotating images works like annotating tweets or emails. You need:

1. **A label scheme** — the set of allowed labels. Fashion-MNIST: T-shirt/top, Trouser, Pullover, Dress, Coat, Sandal, Shirt, Sneaker, Bag, Ankle boot (+ `UNSURE`). A **coarser** scheme (TOP, TROUSER, DRESS, FOOTWEAR, BAG) makes the task easier — and the labels less detailed.
2. **A guideline** — rules for the hard cases. Example v1: *“Label the item that fills most of the image. If you cannot tell two classes apart, choose the one you think is more likely; do not use UNSURE for more than a few images.”* Real guidelines grow with every ambiguity discovered.
3. **Annotators** — people (or a team) applying the guideline, often with a small tool that saves one row per item.

The result is an ordinary table — `image_id, label` — exactly what a model later learns from. **Garbage labels → garbage model**: annotation is part of *Create training material*, step 1 of the workflow.

:::tip title="Look before you label"
28 × 28 greyscale images are blurry: a shirt vs a T-shirt vs a pullover can be genuinely ambiguous. Small, unclear images are a normal part of real datasets.
:::

## Annotators disagree — measure it

If two annotators label the same items, how much do they agree?

**Percent agreement** $p_o$ = share of items with the same label. Simple, but misleading: if 90 % of items are “negative”, two people guessing “negative” almost always agree by **chance**.

**Cohen's kappa** corrects for the agreement expected by chance:

$$
\kappa = \frac{p_o - p_e}{1 - p_e}
$$

$p_e$ = the probability that the two annotators agree **by chance**, given how often each uses each label: $p_e = \sum_{\text{labels } k} P(A{=}k)\,P(B{=}k)$.

| κ | interpretation (rough) |
|---|---|
| 1 | perfect agreement |
| > 0.8 | very strong |
| 0.6 – 0.8 | substantial |
| 0.4 – 0.6 | moderate |
| ≈ 0 | no better than chance |
| < 0 | worse than chance |

:::viz name=kappa
Two annotators label 50 items YES/NO. Make the observed agreement high but the labels very unbalanced (e.g. 45 both-NO): see how kappa stays modest.
:::

:::exercise id=kappa title="Compute agreement and kappa"
--- task
Load `data/annotations.csv` (`item_id, annotator_A, annotator_B`, labels positive/negative/neutral).

1. `p_o` — percent agreement
2. `p_e` — chance agreement: for each label k, (share of A's labels that are k) × (share of B's labels that are k), summed
3. `kappa` — Cohen's kappa; compare with `sklearn.metrics.cohen_kappa_score` → `kappa_sk`
--- starter
import pandas as pd
from sklearn.metrics import cohen_kappa_score
ann = pd.read_csv("data/annotations.csv")
p_o = None
p_e = None
kappa = None
kappa_sk = None
print(p_o, p_e, kappa, kappa_sk)
--- check
from sklearn.metrics import cohen_kappa_score
ks = cohen_kappa_score(ann["annotator_A"], ann["annotator_B"])
assert abs(p_o - (ann["annotator_A"] == ann["annotator_B"]).mean()) < 1e-12, "p_o = (A == B).mean()"
assert abs(kappa - ks) < 1e-9, f"kappa = {kappa}, sklearn says {ks}"
--- hint
`a = ann["annotator_A"].value_counts(normalize=True)`, same for B; then `p_e = sum(a[k] * b.get(k, 0) for k in a.index)`.
--- solution
import pandas as pd
from sklearn.metrics import cohen_kappa_score
ann = pd.read_csv("data/annotations.csv")
p_o = (ann["annotator_A"] == ann["annotator_B"]).mean()
a = ann["annotator_A"].value_counts(normalize=True)
b = ann["annotator_B"].value_counts(normalize=True)
p_e = sum(a[k] * b.get(k, 0) for k in a.index)
kappa = (p_o - p_e) / (1 - p_e)
kappa_sk = cohen_kappa_score(ann["annotator_A"], ann["annotator_B"])
print(p_o, p_e, kappa, kappa_sk)
:::

:::code title="Where do they disagree?"
pd.crosstab(ann["annotator_A"], ann["annotator_B"])
:::

The off-diagonal cells show **which labels get confused** — often a sign that the guideline needs a clearer rule for that pair (e.g. “neutral vs positive”).

## What to do with disagreement?

- **Improve the guideline** with examples of the confusing cases, then re-annotate a sample.
- **Adjudicate**: a third person decides the disputed items, or use a majority vote with ≥ 3 annotators.
- **Reconsider the label scheme** (coarser labels if fine distinctions are unreliable).
- Remember that disagreement limits what a model can achieve: if humans agree only 80 % of the time, a model scoring “100 %” against one annotator's labels is suspicious.

:::quiz
? Two annotators agree on 90 % of items, but 90 % of items are “negative” for both. Why is 90 % agreement unimpressive?
+ They would agree that often purely by chance given their label frequencies
- Because 90 % is low
> Kappa corrects for chance agreement.

? p_o = 0.8, p_e = 0.5. Kappa?
= 0.6
> (0.8 − 0.5) / (1 − 0.5) = 0.6.

? What is a labelling guideline for?
+ To make annotators apply the labels consistently, especially in ambiguous cases
- To train the model faster
> Guidelines are refined whenever new ambiguities appear.

? Switching from 10 clothing labels to 5 coarse labels will most likely…
+ increase annotator agreement but give less detailed labels
- decrease agreement
:::

:::key title="Summary"
Labels come from annotators following a label scheme and a guideline. Measure agreement with percent agreement and **Cohen's κ = (pₒ − pₑ)/(1 − pₑ)**. Disagreement → better guidelines, adjudication, or coarser labels.
:::
