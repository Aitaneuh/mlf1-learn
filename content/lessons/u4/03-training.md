One gradient step improves the parameters a little. **Training** repeats it many times. This lesson covers the vocabulary of the training loop and the most important idea in all of ML: evaluating on **unseen** data.

## The training loop

Each training step:

1. makes predictions
2. calculates the loss
3. calculates the derivative(s)
4. updates the parameters

…and repeats until the loss barely changes, the parameters barely change, or a chosen number of steps is reached.

## Step, batch, epoch

| Term | Meaning |
|---|---|
| **Step / update** | the parameters are updated once |
| **Batch** | the observations used to compute **one** update |
| **Epoch** | the model has processed the **complete** training set once |

Example: 1000 observations, batch size 100 → **10 steps per epoch**. Training for 5 epochs → **50 updates**.

- **Full-batch** (as in the fuel notebook): batch = all data → 1 step per epoch.
- **Mini-batch**: small batches → several steps per epoch (standard for big data).
- Batch size 1 → one update per observation.

**Why several epochs?** After one epoch the parameters improved, but are usually not yet near the best values. Over several epochs, the training loss decreases and the updates get smaller. Between epochs the data is usually **shuffled** (the learned weights are kept) so batches are representative and the order of examples does not bias the updates.

:::quiz
? A dataset has 2000 observations and the batch size is 50. How many parameter updates happen in 3 epochs?
= 120
> 2000 / 50 = 40 steps per epoch, × 3 epochs = 120.

? In the fuel notebook, each epoch uses all three trips to compute one mean gradient. How many updates per epoch?
= 1
> Full-batch: one step per epoch.

? Why shuffle the data between epochs?
+ To make batches representative and reduce effects of the data order
- To make the model forget what it learned
- To increase the dataset size
> Shuffling keeps the weights; it only changes the order/batches.
:::

:::exercise id=loop title="Write the training loop"
--- task
Complete `train` for the model $\hat y = w x$ using **full-batch** gradient descent. Each epoch: compute the mean gradient over all observations, update `w`, and append the new MSE to `history`.

Helper functions `mse(xs, ys, w)` and `gradient(xs, ys, w)` are already defined (they are the ones from the notebook).
--- setup
def mse(xs, ys, w):
    return sum((y - w * x) ** 2 for x, y in zip(xs, ys)) / len(xs)

def gradient(xs, ys, w):
    return sum(2 * x * (w * x - y) for x, y in zip(xs, ys)) / len(xs)

x_train = [13.593, 5.35, 8.247]
y_train = [99.641, 44.522, 65.802]
--- starter
def train(xs, ys, start_w=6.0, learning_rate=0.003, epochs=40):
    w = start_w
    history = [mse(xs, ys, w)]
    for epoch in range(epochs):
        # TODO: compute the slope, update w, append the new loss
        pass
    return w, history

w_fitted, history = train(x_train, y_train)
print(f"learned w = {w_fitted:.3f} L/100 km, MSE {history[0]:.2f} → {history[-1]:.2f}")
--- check
w_, h_ = train(x_train, y_train)
assert len(h_) == 41, f"history should have 41 entries (initial + 40 epochs), got {len(h_)}."
assert abs(w_ - 7.578) < 0.01, f"learned w = {w_:.4f}, expected ≈ 7.578"
assert h_[-1] < h_[0], "The loss should decrease."
--- hint
Inside the loop:
```python
slope = gradient(xs, ys, w)
w = w - learning_rate * slope
history.append(mse(xs, ys, w))
```
--- solution
def train(xs, ys, start_w=6.0, learning_rate=0.003, epochs=40):
    w = start_w
    history = [mse(xs, ys, w)]
    for epoch in range(epochs):
        slope = gradient(xs, ys, w)
        w = w - learning_rate * slope
        history.append(mse(xs, ys, w))
    return w, history

w_fitted, history = train(x_train, y_train)
print(f"learned w = {w_fitted:.3f} L/100 km, MSE {history[0]:.2f} → {history[-1]:.2f}")
:::

:::code title="Plot the learning curve"
import matplotlib.pyplot as plt
plt.figure(figsize=(6, 3))
plt.plot(history, marker="o", markersize=3)
plt.xlabel("epoch (one update per epoch)")
plt.ylabel("training MSE (L²)")
plt.title("The loss goes down, fast at first, then slowly")
plt.grid(alpha=0.3)
plt.show()
:::

## Training vs prediction

| | Training | Prediction (inference) |
|---|---|---|
| uses | features **and** targets | features only |
| does | adjusts the parameters | applies fixed parameters |
| when | once (or periodically) | every time new data arrives |

## Did the model learn or memorise?

A model can fit its training data perfectly and still fail on new data — like a student who memorised the answers of last year's exam. **The real objective is not to fit the training data, but to make useful predictions for new observations.**

So we split the data:

- **Training data** — used to learn the parameters.
- **Test data** — kept **separate**, never used for training, used to evaluate the trained model.

:::viz name=split
A split must be random (shuffled) and, for classification, usually **stratified** — more in Unit 6.
:::

## What can go wrong?

A model only learns from the data it was given. Possible problems:

- important features are missing (fuel use depends on speed, terrain, temperature — not only distance)
- targets contain errors
- training examples are not representative
- historical data contains **bias**
- the world changes (*drift*)
- the model is used **outside its training range** (*extrapolation*)

:::reveal title="What could go wrong if a rent model trained only on apartments in central Zürich is used for apartments elsewhere?"
The training data is not representative: rent levels, the effect of area, and the effect of distance to the station differ by region. The model will systematically over-predict elsewhere — and nothing in its training loss will warn you. Only evaluation on representative unseen data reveals it.
:::

:::quiz
? What is the difference between training and prediction?
+ Training uses targets to adjust parameters; prediction applies the fixed parameters to new features
- Prediction updates the weights with each new observation
- There is no difference
> At prediction time the target is not known.

? Why do we evaluate the model on test data that was not used for training?
+ To estimate how well it predicts new, unseen observations
- Because the training data is too large to evaluate
- To make the training loss smaller
> Training performance can be overly optimistic (memorisation).

? A fuel model trained on trips of 50–150 km is used for a 3000 km trip. What is the risk called?
- shuffling
+ extrapolation outside the training range
- underflow
> The model has never seen such distances; the relationship might not hold.
:::

:::key title="Summary"
- Loop: predict → loss → derivative → update. Step / batch / epoch.
- Training uses targets; prediction does not.
- Always evaluate on **unseen test data**. Watch out for missing features, bias, drift, extrapolation.
:::
