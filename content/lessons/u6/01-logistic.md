So far the target was a number (litres, CHF). Now the answer is a **category**: spam or not, which species, which digit. The first classifier of the course has a confusing name: **logistic regression** — it is a **classifier**, despite “regression” in its name.

| | Fuel (week 3) | Binary example | Iris |
|---|---|---|---|
| target | litres (number) | class 0 or 1 | one of 3 species |
| model | linear regression | logistic regression | logistic regression (multiclass) |
| output | a number | a probability, then a class | 3 probabilities, then a class |

## Step 1: a linear score

Start exactly like linear regression — weights times features plus intercept:

$$
z = \mathbf w \cdot \mathbf x + b
$$

$z$ (the **score** or *logit*) can be any number from −∞ to +∞. But a probability must be between 0 and 1.

## Step 2: squash it with the sigmoid

$$
p = \sigma(z) = \frac{1}{1 + e^{-z}}
$$

- $z = 0$ → $p = 0.5$
- large positive $z$ → $p$ close to 1
- large negative $z$ → $p$ close to 0

$p$ is interpreted as $P(\text{class }1 \mid \mathbf x)$, and automatically $P(\text{class }0 \mid \mathbf x) = 1 - p$.

:::viz name=sigmoid
Move the score z and watch p. The right panel shows the **log loss** (next section) for both possible true labels.
:::

## Step 3: probability first, decision second

A **threshold** turns the probability into a class. With threshold 0.5:

| $P(\text{class }1 \mid x)$ | decision | interpretation |
|---|---|---|
| 0.15 | class 0 | model favours class 0 |
| 0.48 | class 0 | close to the decision boundary |
| 0.83 | class 1 | model favours class 1 |

:::key
A threshold is a **decision rule**; the probability is **not a guarantee**. 0.83 means “the model favours class 1”, not “it is certainly class 1”. Changing the threshold changes decisions without retraining the model (Unit 9).
:::

:::exercise id=sigmoid title="Implement the sigmoid"
--- task
Write `sigmoid(z)` using `np.exp`. It must work on single numbers and on arrays.

Then compute `p` for the scores `z = [-3, 0, 1.4, 5]` and `pred` = the predicted classes (0/1) with threshold 0.5.
--- starter
import numpy as np

def sigmoid(z):
    return None

z = np.array([-3, 0, 1.4, 5])
p = None
pred = None
print(p, pred)
--- check
import numpy as np
assert abs(sigmoid(0) - 0.5) < 1e-12, "sigmoid(0) must be 0.5"
assert np.allclose(p, 1 / (1 + np.exp(-np.array([-3, 0, 1.4, 5])))), f"p = {p}"
assert list(np.asarray(pred).astype(int)) == [0, 1, 1, 1], f"pred = {pred}; with threshold 0.5, p ≥ 0.5 → 1."
--- hint
`1 / (1 + np.exp(-z))`; for the classes: `(p >= 0.5).astype(int)`.
--- solution
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

z = np.array([-3, 0, 1.4, 5])
p = sigmoid(z)
pred = (p >= 0.5).astype(int)
print(p, pred)
:::

## How does logistic regression learn? Log loss

MSE was a good loss for numbers. For probabilities we use the **binary log loss** (also called *binary cross-entropy*):

$$
L = -\big[\,y \log p + (1-y)\log(1-p)\,\big]
$$

It looks scary but it simply **selects the probability given to the true class**:

- if the true label is $y = 1$: $L = -\log(p)$
- if the true label is $y = 0$: $L = -\log(1-p)$

| true y = 1, model says p = | loss −log(p) | |
|---|---|---|
| 0.90 | 0.105 | correct and confident → tiny loss |
| 0.60 | 0.511 | correct but unsure |
| 0.10 | 2.303 | wrong |
| 0.01 | 4.605 | **confidently wrong → huge loss** |

As $p \to 0$, $-\log(p) \to +\infty$: **a confident wrong prediction receives a large penalty.** The same $p = 0.8$ gives loss 0.223 if the truth is 1, but 1.609 if the truth is 0.

The training loss is the **average** over all observations, e.g. truths (1, 0, 1) with p = (0.9, 0.2, 0.1): (0.105 + 0.223 + 2.303) / 3 ≈ **0.877**.

The model learns $\mathbf w$ and $b$ by **minimising the mean log loss** — with gradient descent-like optimisers, just like before.

:::exercise id=logloss title="Compute the mean log loss"
--- task
Write `log_loss(y, p)` returning the **mean** binary log loss for arrays `y` (0/1 labels) and `p` (predicted P(class 1)). Check it on the example from the text (≈ 0.877).
--- starter
import numpy as np

def log_loss(y, p):
    return None

y = np.array([1, 0, 1])
p = np.array([0.9, 0.2, 0.1])
print(log_loss(y, p))
--- check
import numpy as np
v = log_loss(np.array([1, 0, 1]), np.array([0.9, 0.2, 0.1]))
assert v is not None and abs(v - 0.8770) < 0.001, f"log_loss = {v}, expected ≈ 0.877"
assert abs(log_loss(np.array([0]), np.array([0.8])) - 1.6094) < 0.001, "For y=0, p=0.8 the loss should be −log(0.2) ≈ 1.609."
--- hint
`-(y * np.log(p) + (1 - y) * np.log(1 - p)).mean()`
--- solution
import numpy as np

def log_loss(y, p):
    return -(y * np.log(p) + (1 - y) * np.log(1 - p)).mean()

y = np.array([1, 0, 1])
p = np.array([0.9, 0.2, 0.1])
print(log_loss(y, p))
:::

:::quiz
? Logistic regression is…
- a regression model that predicts numbers
+ a classifier that outputs probabilities
- an unsupervised clustering method
> The name is historical; it classifies.

? The score is z = 0. What is σ(z)?
= 0.5
> 1 / (1 + e⁰) = 1/2.

? True label y = 0, model outputs p = P(class 1) = 0.99. The log loss is…
+ very large (≈ 4.6), because the model is confidently wrong
- very small, because 0.99 is a confident prediction
- exactly 0.99
> −log(1 − 0.99) = −log(0.01) ≈ 4.6.

? Which prediction receives the **smallest** log loss when the true label is 1?
+ p = 0.95
- p = 0.6
- p = 0.5
- p = 0.05
> −log(p) is smallest when p is close to 1.
:::

:::key title="Summary"
score $z = \mathbf w\cdot\mathbf x + b$ → probability $p = \sigma(z)$ → class via threshold. Training minimises the mean **log loss**, which heavily punishes confident wrong predictions.
:::
