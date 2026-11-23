**Goal:** extend the fuel model to $\hat y = w x + b$ and train **two parameters** with gradient descent — written by you, with NumPy, from scratch. Then compare with scikit-learn.

You will practise: vectorised NumPy, partial derivatives, learning-rate tuning, learning curves, honest evaluation.

:::note title="How projects work"
Projects are a sequence of **steps** (each with a check). They are bigger than lesson exercises and give less hand-holding. Hints exist, but try first. All steps share the page's kernel — run them in order.
:::

## The data

A larger set of trips by the same car (synthetic but realistic): distance (100 km) and fuel (L). A short trip uses relatively more fuel (cold engine, city driving) — so the intercept may matter.

:::exercise id=p1s1 kind=project title="Step 1 — Load and look"
--- task
Create the NumPy arrays below, then make a **scatter plot** of fuel vs distance with labelled axes (`plt.scatter`, `plt.xlabel`, `plt.ylabel`, `plt.show()`).

Also compute `naive_rates` = fuel / distance for each trip (an array) and print its mean.
--- starter
import numpy as np
import matplotlib.pyplot as plt

x = np.array([0.4, 0.8, 1.2, 2.0, 2.5, 3.1, 4.0, 5.35, 6.2, 8.247, 10.5, 13.593])
y = np.array([4.1, 6.9, 9.6, 15.8, 19.2, 23.9, 30.6, 41.2, 47.0, 63.1, 79.8, 103.0])
x_test = np.array([1.5, 7.0, 12.0])
y_test = np.array([12.0, 53.6, 91.1])

naive_rates = None
# TODO: scatter plot
--- check
import numpy as np
assert naive_rates is not None and np.allclose(naive_rates, y / x), "naive_rates = y / x (element-wise)."
--- solution
import numpy as np
import matplotlib.pyplot as plt

x = np.array([0.4, 0.8, 1.2, 2.0, 2.5, 3.1, 4.0, 5.35, 6.2, 8.247, 10.5, 13.593])
y = np.array([4.1, 6.9, 9.6, 15.8, 19.2, 23.9, 30.6, 41.2, 47.0, 63.1, 79.8, 103.0])
x_test = np.array([1.5, 7.0, 12.0])
y_test = np.array([12.0, 53.6, 91.1])

naive_rates = y / x
print("mean naive rate:", naive_rates.mean())
plt.scatter(x, y)
plt.xlabel("distance (100 km)")
plt.ylabel("fuel (L)")
plt.title("Trips")
plt.show()
:::

Notice short trips have a much higher L/100 km — a line through the origin cannot fit that well.

## Two partial derivatives

For $L(w, b) = \frac1n \sum (y_i - (w x_i + b))^2$, the partial derivatives are:

$$
\frac{\partial L}{\partial w} = \frac{1}{n}\sum 2x_i\,(\hat y_i - y_i), \qquad \frac{\partial L}{\partial b} = \frac{1}{n}\sum 2\,(\hat y_i - y_i)
$$

:::exercise id=p1s2 kind=project title="Step 2 — Vectorised loss and gradients"
--- task
Write, **without Python loops** (NumPy only):

- `mse(x, y, w, b)` → the mean squared error
- `grads(x, y, w, b)` → a tuple `(dw, db)` of the two partial derivatives
--- starter
def mse(x, y, w, b):
    return None

def grads(x, y, w, b):
    return None, None

print(mse(x, y, 7.0, 0.0), grads(x, y, 7.0, 0.0))
--- check
import numpy as np
xx = np.array([1.0, 2.0]); yy = np.array([3.0, 4.0])
assert abs(mse(xx, yy, 1.0, 1.0) - 1.0) < 1e-9, f"mse(x=[1,2], y=[3,4], w=1, b=1) gave {mse(xx, yy, 1.0, 1.0)}; predictions are 2 and 3, errors 1 and 1, so the MSE is 1.0."
dw, db = grads(xx, yy, 1.0, 1.0)
assert abs(dw - (-3.0)) < 1e-9 and abs(db - (-2.0)) < 1e-9, f"grads gave ({dw}, {db}); expected (−3, −2) for x=[1,2], y=[3,4], w=1, b=1."
--- hint
`p = w * x + b`, then `((y - p) ** 2).mean()`; `dw = (2 * x * (p - y)).mean()`, `db = (2 * (p - y)).mean()`.
--- solution
def mse(x, y, w, b):
    p = w * x + b
    return ((y - p) ** 2).mean()

def grads(x, y, w, b):
    p = w * x + b
    return (2 * x * (p - y)).mean(), (2 * (p - y)).mean()

print(mse(x, y, 7.0, 0.0), grads(x, y, 7.0, 0.0))
:::

:::exercise id=p1s3 kind=project title="Step 3 — Train both parameters"
--- task
Write `fit(x, y, lr, epochs)` that starts at `w = 0, b = 0`, updates **both** parameters simultaneously each epoch, and returns `w, b, history` (MSE after each epoch, as a list).

Then train with `lr = 0.005` for `epochs = 3000`, store the results in `w_hat, b_hat, hist` and plot `hist` (log scale on y helps: `plt.yscale("log")`).
--- starter
def fit(x, y, lr, epochs):
    w, b = 0.0, 0.0
    history = []
    # TODO
    return w, b, history

w_hat, b_hat, hist = fit(x, y, lr=0.005, epochs=3000)
print(f"w = {w_hat:.3f} L/100 km, b = {b_hat:.3f} L, final MSE = {hist[-1]:.4f}")
--- check
import numpy as np
A = np.vstack([x, np.ones_like(x)]).T
w_ls, b_ls = np.linalg.lstsq(A, y, rcond=None)[0]
assert abs(w_hat - w_ls) < 0.05 and abs(b_hat - b_ls) < 0.3, f"Got w={w_hat:.3f}, b={b_hat:.3f}; the optimum is about w={w_ls:.3f}, b={b_ls:.3f}. Did both update with the gradients computed at the SAME old (w, b)?"
assert len(hist) == 3000, "history should have one entry per epoch."
--- hint
```python
for _ in range(epochs):
    dw, db = grads(x, y, w, b)
    w, b = w - lr * dw, b - lr * db
    history.append(mse(x, y, w, b))
```
--- solution
def fit(x, y, lr, epochs):
    w, b = 0.0, 0.0
    history = []
    for _ in range(epochs):
        dw, db = grads(x, y, w, b)
        w, b = w - lr * dw, b - lr * db
        history.append(mse(x, y, w, b))
    return w, b, history

w_hat, b_hat, hist = fit(x, y, lr=0.005, epochs=3000)
print(f"w = {w_hat:.3f} L/100 km, b = {b_hat:.3f} L, final MSE = {hist[-1]:.4f}")
plt.plot(hist); plt.yscale("log"); plt.xlabel("epoch"); plt.ylabel("MSE"); plt.show()
:::

:::exercise id=p1s4 kind=project title="Step 4 — Learning-rate experiment"
--- task
Train for 300 epochs with each learning rate in `[0.0005, 0.005, 0.02, 0.03]`. Store the **final MSE** of each in a dict `final_loss = {lr: loss}`. Use `np.nan` handling: a diverged run may give `inf` or `nan`.

Set `diverging` to the list of learning rates whose final loss is not finite or larger than the starting loss.
--- starter
final_loss = {}
for lr in [0.0005, 0.005, 0.02, 0.03]:
    pass  # TODO

diverging = None
print(final_loss, diverging)
--- check
import numpy as np
assert set(final_loss) == {0.0005, 0.005, 0.02, 0.03}, "final_loss needs one entry per learning rate."
assert diverging is not None and 0.03 in diverging and 0.02 not in diverging and 0.005 not in diverging and 0.0005 not in diverging, f"diverging = {diverging}"
--- hint
`_, _, h = fit(x, y, lr, 300)`, then `final_loss[lr] = h[-1]`. Compare to `mse(x, y, 0, 0)` (the loss at the start).
--- solution
import numpy as np
start = mse(x, y, 0.0, 0.0)
final_loss = {}
for lr in [0.0005, 0.005, 0.02, 0.03]:
    with np.errstate(over="ignore", invalid="ignore"):
        _, _, h = fit(x, y, lr, 300)
    final_loss[lr] = h[-1]

diverging = [lr for lr, l in final_loss.items() if not np.isfinite(l) or l > start]
print(final_loss, diverging)
:::

:::exercise id=p1s5 kind=project title="Step 5 — Honest evaluation and comparison"
--- task
1. Compute `test_mse_wb` — test MSE of your $(w, b)$ model on `x_test, y_test`.
2. Fit the no-intercept model $\hat y = wx$ too: its best $w$ is `w0 = (x @ y) / (x @ x)` (closed form). Compute `test_mse_w0`.
3. Fit scikit-learn's `LinearRegression` on `x.reshape(-1, 1)` and `y`; store it as `lr_model` and check that its `coef_[0]` and `intercept_` match yours.
--- starter
from sklearn.linear_model import LinearRegression

test_mse_wb = None
w0 = (x @ y) / (x @ x)
test_mse_w0 = None
lr_model = None
--- check
import numpy as np
assert abs(test_mse_wb - mse(x_test, y_test, w_hat, b_hat)) < 1e-9, "test_mse_wb = mse(x_test, y_test, w_hat, b_hat)"
assert abs(test_mse_w0 - mse(x_test, y_test, w0, 0.0)) < 1e-9, "test_mse_w0 = mse(x_test, y_test, w0, 0)"
assert lr_model is not None and abs(lr_model.coef_[0] - w_hat) < 0.05, "lr_model = LinearRegression().fit(x.reshape(-1, 1), y)"
--- solution
from sklearn.linear_model import LinearRegression

test_mse_wb = mse(x_test, y_test, w_hat, b_hat)
w0 = (x @ y) / (x @ x)
test_mse_w0 = mse(x_test, y_test, w0, 0.0)
lr_model = LinearRegression().fit(x.reshape(-1, 1), y)
print(f"with intercept: test MSE {test_mse_wb:.3f} | through origin: {test_mse_w0:.3f}")
print("sklearn:", lr_model.coef_[0], lr_model.intercept_, " mine:", w_hat, b_hat)
:::

## Reflection

:::reveal title="What does b mean here, and is it physically plausible?"
b ≈ the fuel used by a trip of length 0 — physically impossible to be much above 0, yet the data says short trips use extra fuel (cold start). The intercept is a *modelling trick* to capture that within the observed range; it would be wrong to read it as “fuel for 0 km”. A better feature might be “trip is short (< 30 km)” or “cold start”.
:::

:::reveal title="Why does 0.03 diverge here (and 0.02 in the notebook), while 0.02 still works here?"
The curvature of the loss along w is roughly $2 \cdot \text{mean}(x^2)$. Gradient descent is stable only if the learning rate is below about 2 / curvature. Here that bound is ≈ 0.025, so 0.02 still converges (with oscillation) and 0.03 explodes. The notebook's three trips are all long (mean x² ≈ 94), so its bound is ≈ 0.011 and 0.02 already diverges. Rescaling x (e.g. dividing by 10) would allow a larger rate — representation affects optimisation.
:::

Mark the project complete when all steps pass. You just implemented the core of machine learning by hand.
