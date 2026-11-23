We have a model. Is it any good? To *learn*, a model needs a number that says how wrong it is — the **loss**.

## Prediction error

For one observation, the error is the target minus the prediction:

$$
\text{error} = y - \hat y
$$

Example: actual rent $y = 1750$, predicted $\hat y = 1500$ → error = **+250**: the model *under*estimated by CHF 250.

- positive error → prediction too **low**
- negative error → prediction too **high**
- zero → correct

:::quiz
? Actual rent 1750, prediction 1900. What is the error $y - \hat y$?
= -150
> 1750 − 1900 = −150: the prediction is too high.
:::

## Why not just average the errors?

Two apartments: errors +250 and −250. Average error = 0. Is the model perfect? **No!** It is wrong by 250 both times — the errors just cancel out. We need a measure where every mistake counts positively.

## Squared error and MSE

Squaring makes every error positive **and** punishes large errors much more:

| error | squared error |
|---|---|
| +2 | 4 |
| −2 | 4 |
| +5 | 25 |

The **mean squared error** over $n$ observations:

$$
\text{MSE} = \frac{1}{n}\sum_{i=1}^{n} (y_i - \hat y_i)^2
$$

In plain words: (1) predict every observation, (2) compute every error, (3) square them, (4) average. **Lower MSE = better predictions on this dataset.**

A **loss function** measures how far the predictions are from the targets. MSE is one possible loss function — the most common one for regression.

:::exercise id=compare title="Which model is better?"
--- task
Two models predicted the rent of three apartments:

| Apartment | Actual | Model A | Model B |
|---|---|---|---|
| 1 | 1200 | 1100 | 1250 |
| 2 | 1600 | 1450 | 1650 |
| 3 | 2000 | 1800 | 1950 |

Compute `mse_a` and `mse_b` with NumPy, and set `better` to `"A"` or `"B"`.
--- setup
import numpy as np
y = np.array([1200, 1600, 2000])
pred_a = np.array([1100, 1450, 1800])
pred_b = np.array([1250, 1650, 1950])
--- starter
mse_a = None
mse_b = None
better = None
print(mse_a, mse_b, better)
--- check
assert abs(float(mse_a) - 24166.6667) < 0.1, f"mse_a = {mse_a}; expected (100² + 150² + 200²)/3 ≈ 24166.67"
assert abs(float(mse_b) - 2500) < 0.1, f"mse_b = {mse_b}; expected (50² + 50² + 50²)/3 = 2500"
assert better == "B", "The model with the lower MSE is better."
--- hint
`((y - pred_a) ** 2).mean()`
--- solution
mse_a = ((y - pred_a) ** 2).mean()
mse_b = ((y - pred_b) ** 2).mean()
better = "A" if mse_a < mse_b else "B"
print(mse_a, mse_b, better)
:::

Model B is much better — and notice that Model A always *under*-predicts, a systematic bias.

## Other regression metrics

| Metric | Formula | Unit | Interpretation |
|---|---|---|---|
| **MAE** — mean absolute error | $\frac1n\sum \lvert y - \hat y\rvert$ | same as target (CHF) | “predictions are off by 50 CHF on average” |
| **MSE** — mean squared error | $\frac1n\sum (y - \hat y)^2$ | CHF² (hard to read) | penalises large errors strongly |
| **RMSE** — root MSE | $\sqrt{\text{MSE}}$ | CHF | “typical error magnitude”, still penalises large errors |
| **ME** — mean error (bias) | $\frac1n\sum (\hat y - y)$ | CHF | direction: > 0 over-predicts, < 0 under-predicts, ≈ 0 no overall bias |

:::warn title="Watch the sign of ME"
The course defines **ME = mean of (ŷ − y)** — prediction minus target, the *opposite* of our error definition. So ME > 0 means the model tends to **over**predict. ME alone is not an accuracy measure: positive and negative errors cancel out.
:::

:::exercise id=allmetrics title="Write the four metric functions"
--- task
Complete the four functions. Each takes NumPy arrays `y` (targets) and `p` (predictions) and returns one number.
--- starter
import numpy as np

def mae(y, p):
    return None

def mse(y, p):
    return None

def rmse(y, p):
    return None

def me(y, p):
    return None

y = np.array([1200, 1600, 2000])
p = np.array([1100, 1450, 1800])
print(mae(y, p), mse(y, p), rmse(y, p), me(y, p))
--- check
import numpy as np
y_ = np.array([1200, 1600, 2000]); p_ = np.array([1100, 1450, 1800])
assert abs(mae(y_, p_) - 150) < 1e-6, f"mae → {mae(y_, p_)}, expected 150"
assert abs(mse(y_, p_) - 24166.667) < 0.01, f"mse → {mse(y_, p_)}"
assert abs(rmse(y_, p_) - 155.4563) < 0.01, f"rmse → {rmse(y_, p_)}, expected sqrt(MSE) ≈ 155.46"
assert abs(me(y_, p_) + 150) < 1e-6, f"me → {me(y_, p_)}, expected −150 (the model under-predicts). Use mean of (p − y)."
--- hint
`np.abs(y - p).mean()`, `((y - p) ** 2).mean()`, `np.sqrt(mse(y, p))`, `(p - y).mean()`.
--- solution
import numpy as np

def mae(y, p):
    return np.abs(y - p).mean()

def mse(y, p):
    return ((y - p) ** 2).mean()

def rmse(y, p):
    return np.sqrt(mse(y, p))

def me(y, p):
    return (p - y).mean()

y = np.array([1200, 1600, 2000])
p = np.array([1100, 1450, 1800])
print(mae(y, p), mse(y, p), rmse(y, p), me(y, p))
:::

## Loss vs objective function

- A **loss function** measures prediction mistakes (e.g. MSE).
- An **objective function** states what training **optimises** — to *minimise* or *maximise*.

| Learning goal | Objective |
|---|---|
| reduce prediction errors | **minimise** MSE |
| make the observed data likely | **maximise** likelihood (Naive Bayes, Unit 7) |
| separate classes with a wide margin | **maximise** the margin |

For linear regression, training means:

$$
\min_{w,\,b}\ \frac{1}{n}\sum_{i=1}^{n}\big(y_i - (w x_i + b)\big)^2
$$

“Find the values of $w$ and $b$ that produce the lowest MSE.” Next lesson: *how* to find them.

:::quiz
? The average signed error of a model is 0. Does that mean the model is perfect?
- Yes
+ No — positive and negative errors can cancel out
> Two errors of +250 and −250 average to 0 but the model is wrong both times.

? Errors are +1, −3 and +2. What is the MSE?
= 4.6667
> (1 + 9 + 4) / 3 = 14/3 ≈ 4.667.

? Which metric is in the same unit as the target AND penalises large errors more strongly?
- MAE
- MSE
+ RMSE
> RMSE = √MSE: same unit, but large errors dominate because of the squaring.

? ME = +80 CHF (with ME = mean of ŷ − y). What does it tell you?
+ On average the model over-predicts by 80 CHF
- On average the model under-predicts by 80 CHF
- The model is off by 80 CHF on every apartment
> ME measures the direction of the errors (bias), not their size.
:::

:::key title="Summary"
- error = $y - \hat y$; squaring stops errors cancelling and punishes big ones.
- **MSE** (loss) is what linear regression minimises; MAE/RMSE are easier to read; ME shows bias.
- Objective = “minimise MSE over $w, b$”.
:::
