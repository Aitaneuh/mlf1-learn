This lesson is the **week 3 notebook “Learning fuel consumption from data”**, rebuilt step by step with checks. If you understood the last three lessons, every line will make sense now. Run the cells **in order** — they share the kernel.

## 1 · From measurements to features and targets

Three trips. Distance is recorded in **tenths of a kilometre**, fuel in **millilitres**. We want to predict litres from distance.

Let `x` = distance in **hundreds of km** and `y` = fuel in **litres**: `x = distance_tenths_km / 1000`, `y = fuel_ml / 1000`. Then the weight `w` of $\hat y = w x$ is directly in **litres per 100 km**.

:::exercise id=units title="Convert the raw measurements"
--- task
Create `x_train` and `y_train` from `raw_train` using list comprehensions (unpack each tuple as `distance, fuel`).

What does `x = 5.350` mean? → 535 km.
--- starter
raw_train = [(13593, 99641), (5350, 44522), (8247, 65802)]
x_train = None
y_train = None
for x, y in zip(x_train, y_train):
    print(f"{x:.3f} × 100 km → {y:.3f} L; observed: {y / x:.2f} L/100 km")
--- check
assert [round(v, 3) for v in x_train] == [13.593, 5.35, 8.247], f"x_train = {x_train}"
assert [round(v, 3) for v in y_train] == [99.641, 44.522, 65.802], f"y_train = {y_train}"
--- hint
`x_train = [distance / 1000 for distance, fuel in raw_train]`
--- solution
raw_train = [(13593, 99641), (5350, 44522), (8247, 65802)]
x_train = [distance / 1000 for distance, fuel in raw_train]
y_train = [fuel / 1000 for distance, fuel in raw_train]
for x, y in zip(x_train, y_train):
    print(f"{x:.3f} × 100 km → {y:.3f} L; observed: {y / x:.2f} L/100 km")
:::

The three trips have **different** consumptions (7.33, 8.32, 7.98 L/100 km). One fixed rate cannot describe all of them perfectly — other things matter: speed, terrain, driving style, temperature… This is why we need a *loss* that balances the errors.

## 2 · Predictions and errors at w = 6

:::exercise id=w6 title="Predict and compute errors"
--- task
With `w = 6.0`, compute `predictions` (one per trip) and `errors` = target − prediction.
--- starter
w = 6.0
predictions = None
errors = None
for x, target, prediction, error in zip(x_train, y_train, predictions, errors):
    print(f"{x:5.3f} × 100 km: actual {target:7.3f} L | predicted {prediction:7.3f} L | error {error:+7.3f} L")
--- check
assert [round(p, 3) for p in predictions] == [81.558, 32.1, 49.482], f"predictions = {predictions}"
assert [round(e, 3) for e in errors] == [18.083, 12.422, 16.32], f"errors = {errors}"
--- hint
`predictions = [w * x for x in x_train]`
--- solution
w = 6.0
predictions = [w * x for x in x_train]
errors = [target - prediction for target, prediction in zip(y_train, predictions)]
for x, target, prediction, error in zip(x_train, y_train, predictions, errors):
    print(f"{x:5.3f} × 100 km: actual {target:7.3f} L | predicted {prediction:7.3f} L | error {error:+7.3f} L")
:::

All errors are positive: at 6 L/100 km the model under-predicts every trip.

## 3 · The objective: minimise MSE

:::exercise id=mse_by_hand title="MSE by hand for one observation"
--- task
The notebook defines `predict` and `mse` (provided below — run it). Then compute **by hand** the squared error of the **first** observation at `w = 8` and store it in `first_squared_error`.

First trip: x = 13.593, y = 99.641.
--- starter
def predict(xs, w):
    return [w * x for x in xs]

def mse(xs, ys, w):
    predictions = predict(xs, w)
    squared_errors = [(target - prediction) ** 2 for target, prediction in zip(ys, predictions)]
    return sum(squared_errors) / len(squared_errors)

for candidate in [6.0, 8.0, 10.0]:
    print(f"w={candidate:.1f} L/100 km → training MSE={mse(x_train, y_train, candidate):.2f} L²")

first_squared_error = None
print("First squared error:", first_squared_error)
--- check
assert first_squared_error is not None and abs(first_squared_error - 82.8646) < 0.01, f"first_squared_error = {first_squared_error}; expected (99.641 − 8·13.593)² = (−9.103)² ≈ 82.865"
--- hint
Prediction 8 × 13.593 = 108.744; error 99.641 − 108.744 = −9.103; square it.
--- solution
def predict(xs, w):
    return [w * x for x in xs]

def mse(xs, ys, w):
    predictions = predict(xs, w)
    squared_errors = [(target - prediction) ** 2 for target, prediction in zip(ys, predictions)]
    return sum(squared_errors) / len(squared_errors)

for candidate in [6.0, 8.0, 10.0]:
    print(f"w={candidate:.1f} L/100 km → training MSE={mse(x_train, y_train, candidate):.2f} L²")

first_squared_error = (y_train[0] - 8 * x_train[0]) ** 2
print("First squared error:", first_squared_error)
:::

w = 8 is best of the three candidates — but the three are just guesses, not necessarily the optimum. MSE is in **squared litres** (L²), not litres.

## 4 · The loss landscape

:::code title="Plot the training MSE for many values of w"
import matplotlib.pyplot as plt

candidate_ws = [5 + i * 0.05 for i in range(101)]
losses = [mse(x_train, y_train, c) for c in candidate_ws]
plt.figure(figsize=(6, 3.2))
plt.plot(candidate_ws, losses)
plt.scatter([6, 8, 10], [mse(x_train, y_train, c) for c in [6, 8, 10]], color="tomato")
plt.xlabel("w (L/100 km)")
plt.ylabel("Training MSE (L²)")
plt.title("Loss for different model parameters")
plt.grid(alpha=0.25)
plt.show()
:::

Before reading on: which $w$ minimises the loss? Is the slope at $w = 6$ negative or positive?

## 5 · One gradient step

For the **mean** squared error over our three trips, the derivative is the mean of the individual derivatives:

$$
\frac{d\,\text{MSE}}{dw} = \frac{1}{n}\sum 2x_i(wx_i - y_i)
$$

:::exercise id=step title="Gradient and one update"
--- task
Complete `gradient(xs, ys, w)`, then do one update from `w_before = 6.0` with `learning_rate = 0.003`.

Expected: derivative ≈ −297.901, new w ≈ 6.894.
--- starter
def gradient(xs, ys, w):
    return None  # TODO: mean of 2 * x * (w * x - y)

learning_rate = 0.003
w_before = 6.0
slope = gradient(x_train, y_train, w_before)
w_after = None  # TODO
print(f"Derivative: {slope:.3f}; w: {w_before:.3f} → {w_after:.3f}")
print(f"Training MSE: {mse(x_train, y_train, w_before):.3f} → {mse(x_train, y_train, w_after):.3f} L²")
--- check
assert abs(gradient(x_train, y_train, 6.0) + 297.901) < 0.01, f"gradient at 6 = {gradient(x_train, y_train, 6.0)}, expected ≈ −297.901"
assert abs(w_after - 6.8937) < 0.001, f"w_after = {w_after}, expected 6 − 0.003 · (−297.901) ≈ 6.894"
--- hint
`return sum(2 * x * (w * x - y) for x, y in zip(xs, ys)) / len(xs)`
--- hint
`w_after = w_before - learning_rate * slope`
--- solution
def gradient(xs, ys, w):
    return sum(2 * x * (w * x - y) for x, y in zip(xs, ys)) / len(xs)

learning_rate = 0.003
w_before = 6.0
slope = gradient(x_train, y_train, w_before)
w_after = w_before - learning_rate * slope
print(f"Derivative: {slope:.3f}; w: {w_before:.3f} → {w_after:.3f}")
print(f"Training MSE: {mse(x_train, y_train, w_before):.3f} → {mse(x_train, y_train, w_after):.3f} L²")
:::

Why is the derivative so large (−298)? Because the feature values are 5–14 and get squared. The learning rate 0.003 is chosen **for these units** — if you measured distance in km instead, you would need a completely different learning rate. *Representation affects optimisation.*

## 6 · Train for several epochs

:::exercise id=epochs title="Train and compare learning rates"
--- task
Write `train(xs, ys, start_w=6.0, learning_rate=0.003, epochs=40)` (full-batch, one update per epoch, returning `w, history`) — you did this in the previous lesson. Then run the comparison loop. Which learning rate diverges?

Store the learned weight with the default settings in `w_fitted`.
--- starter
def train(xs, ys, start_w=6.0, learning_rate=0.003, epochs=40):
    # TODO
    return None, None

w_fitted, history = train(x_train, y_train)
print(f"Learned w: {w_fitted:.3f} L/100 km   MSE {history[0]:.3f} → {history[-1]:.3f}")

for rate in [0.0001, 0.003, 0.02]:
    _, trial = train(x_train, y_train, learning_rate=rate, epochs=10)
    print(f"learning rate={rate}: first loss={trial[0]:.2f}; loss after 10 steps={trial[-1]:.2f}")
--- check
assert abs(w_fitted - 7.578) < 0.01, f"w_fitted = {w_fitted}, expected ≈ 7.578"
_, t = train(x_train, y_train, learning_rate=0.02, epochs=10)
assert t[-1] > t[0] * 100, "With learning rate 0.02 the loss should explode (divergence)."
--- hint
```python
w = start_w
history = [mse(xs, ys, w)]
for epoch in range(epochs):
    w = w - learning_rate * gradient(xs, ys, w)
    history.append(mse(xs, ys, w))
return w, history
```
--- solution
def train(xs, ys, start_w=6.0, learning_rate=0.003, epochs=40):
    w = start_w
    history = [mse(xs, ys, w)]
    for epoch in range(epochs):
        w = w - learning_rate * gradient(xs, ys, w)
        history.append(mse(xs, ys, w))
    return w, history

w_fitted, history = train(x_train, y_train)
print(f"Learned w: {w_fitted:.3f} L/100 km   MSE {history[0]:.3f} → {history[-1]:.3f}")

for rate in [0.0001, 0.003, 0.02]:
    _, trial = train(x_train, y_train, learning_rate=rate, epochs=10)
    print(f"learning rate={rate}: first loss={trial[0]:.2f}; loss after 10 steps={trial[-1]:.2f}")
:::

0.0001 barely moves, 0.003 converges, 0.02 **diverges** (the loss explodes).

## 7 · Use the model, then check new data

:::exercise id=test title="Predict and evaluate on held-out trips"
--- task
1. `pred_700km` — predicted fuel for a 700 km trip (`x = 7`)
2. `test_mse` — the MSE on the two held-out trips `x_test`, `y_test` (they were **not** used in training)
--- starter
x_test = [4.2, 11.0]    # hundreds of km — unseen during training
y_test = [34.1, 91.3]   # litres
pred_700km = None
test_mse = None
print(f"Predicted fuel for 700 km: {pred_700km:.2f} L")
print(f"Training MSE: {mse(x_train, y_train, w_fitted):.2f} L²   Test MSE: {test_mse:.2f} L²")
--- check
assert abs(pred_700km - 7 * w_fitted) < 1e-6, "pred_700km = w_fitted * 7"
assert abs(test_mse - mse([4.2, 11.0], [34.1, 91.3], w_fitted)) < 1e-6, "test_mse = mse(x_test, y_test, w_fitted)"
--- solution
x_test = [4.2, 11.0]
y_test = [34.1, 91.3]
pred_700km = w_fitted * 7.0
test_mse = mse(x_test, y_test, w_fitted)
print(f"Predicted fuel for 700 km: {pred_700km:.2f} L")
print(f"Training MSE: {mse(x_train, y_train, w_fitted):.2f} L²   Test MSE: {test_mse:.2f} L²")
:::

:::quiz title="Think critically"
? Does a low training loss guarantee good predictions on future trips?
- Yes
+ No — the model may not generalise (different conditions, missing features, extrapolation)
> Training loss measures fit to *these* three trips only.

? Is a test set of two invented trips enough to claim the model is accurate?
- Yes, two trips are plenty
+ No — far too few to establish real-world reliability
> Two observations give a very noisy estimate.

? What is risky about predicting fuel for 3000 km when all training trips are under 1400 km?
+ Extrapolation: the model is used outside the range it was trained on
- Nothing, a line is a line
> The relationship (and conditions like breaks, motorway driving) may change outside the observed range.

? If we add an intercept $b$ (ŷ = wx + b), what would $b$ mean here?
+ Fuel used for a trip of zero distance — physically it should be about 0, so b is questionable
- The fuel consumption per 100 km
> The slope w is the rate; b is the value at x = 0. Project 1 explores this.
:::

:::exam title="Exit ticket (definitions you must know)"
In one sentence each: **feature** (input given to the model), **target** (value to predict), **parameter** (value learned by training), **prediction** (model output), **loss** (number measuring prediction mistakes), **derivative** (slope of the loss w.r.t. a parameter), **learning rate** (step size of each update), **epoch** (one pass through all training data), **test set** (data held out to evaluate generalisation).

And: fitting a model to **one** observation fails to minimise MSE over **all** observations — a good parameter balances the errors of every observation.
:::
