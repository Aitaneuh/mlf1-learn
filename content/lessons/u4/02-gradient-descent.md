We know *what* to minimise (MSE). Now: *how* does the computer find the best weight? It **walks downhill**. This is **gradient descent**, the engine behind almost all of modern ML — including huge neural networks.

## Every parameter value has a loss

Simplify the model to one parameter: $\hat y = w \cdot x$ (no intercept). For each candidate $w$ we can compute the MSE:

| $w$ | result |
|---|---|
| 10 | predictions mostly too low |
| 20 | close to the observations |
| 30 | mostly too high |

Plot the loss for *every* possible $w$ and you get the **loss landscape** — a curve with a valley. Training = finding the bottom of the valley.

## One learning step, by hand

One observation: $x = 3$, $y = 9$. Start with $w = 2$.

- prediction: $\hat y = 2 \cdot 3 = 6$
- squared error: $L = (9 - 6)^2 = 9$

Should $w$ go **up** or **down**? We need the **slope** of the loss at $w = 2$.

## The derivative = the slope

The derivative $\frac{dL}{dw}$ tells how the loss changes when $w$ changes a tiny bit.

| derivative | meaning | to reduce the loss… |
|---|---|---|
| $< 0$ | loss **decreases** as $w$ increases | **increase** $w$ |
| $> 0$ | loss **increases** as $w$ increases | **decrease** $w$ |
| $= 0$ | the curve is flat | possibly at the minimum |

For one observation, $L = (y - wx)^2$, and calculus (chain rule) gives:

$$
\frac{dL}{dw} = -2x\,(y - wx) \;=\; 2x\,(wx - y)
$$

At $x = 3, y = 9, w = 2$: $\frac{dL}{dw} = -2 \cdot 3 \cdot (9 - 6) = -18$. **Negative → increase $w$.**

:::note title="Do I need to do calculus?"
For this course: understand what the derivative *means* (slope, sign tells the direction), and be able to plug numbers into the formula above. You will not need to derive new formulas.
:::

## Gradient descent update

$$
w_{\text{new}} = w_{\text{old}} - \eta \cdot \frac{dL}{dw}
$$

$\eta$ (eta) is the **learning rate**: how big a step to take. Why *minus*? Because the derivative points **uphill**; subtracting it moves **downhill**:

- positive derivative → $w$ decreases
- negative derivative → $w$ increases

Our example with $\eta = 0.05$: $w_{\text{new}} = 2 - 0.05 \cdot (-18) = 2.9$.

Did it help? Before: $\hat y = 6$, $L = 9$. After: $\hat y = 2.9 \cdot 3 = 8.7$, $L = (9 - 8.7)^2 = 0.09$. **The loss went from 9 to 0.09.**

:::viz name=gd1d preset=slide
This is exactly the example above (x = 3, y = 9, start w = 2, learning rate 0.05). Press **Step** once and compare with the numbers in the text. Then try learning rate 0.1, 0.11 and 0.15.
:::

:::exercise id=onestep title="Code one gradient-descent step"
--- task
For one observation `x = 3`, `y = 9`, starting at `w = 2` with `lr = 0.05`, compute:

- `grad` — the derivative $2x(wx - y)$
- `w_new` — the updated weight
- `loss_before`, `loss_after` — the squared error $(y - wx)^2$ before and after
--- starter
x, y = 3, 9
w = 2
lr = 0.05
grad = None
w_new = None
loss_before = None
loss_after = None
print(grad, w_new, loss_before, loss_after)
--- check
assert grad == -18, f"grad = {grad}, expected 2*3*(2*3 - 9) = -18"
assert abs(w_new - 2.9) < 1e-9, f"w_new = {w_new}, expected 2 - 0.05*(-18) = 2.9"
assert loss_before == 9, f"loss_before = {loss_before}"
assert abs(loss_after - 0.09) < 1e-9, f"loss_after = {loss_after}, expected (9 - 8.7)^2 = 0.09"
--- hint
`grad = 2 * x * (w * x - y)` and `w_new = w - lr * grad`.
--- hint
`loss_after = (y - w_new * x) ** 2` — use the *new* weight.
--- solution
x, y = 3, 9
w = 2
lr = 0.05
grad = 2 * x * (w * x - y)
w_new = w - lr * grad
loss_before = (y - w * x) ** 2
loss_after = (y - w_new * x) ** 2
print(grad, w_new, loss_before, loss_after)
:::

## Why not jump straight to the answer?

With only $x = 3, y = 9$ we could simply pick $w = 3$: perfect. But another observation might be $x = 5, y = 13$ — for that one, $w = 3$ predicts 15. A model must perform well **across all observations**, not just one. So we use the **mean** of the derivatives over all observations:

$$
\frac{d\,\text{MSE}}{dw} = \frac{1}{n}\sum_{i=1}^n 2x_i\,(w x_i - y_i)
$$

## The learning rate

| learning rate | behaviour |
|---|---|
| too small | progress is very slow |
| suitable | the loss decreases steadily |
| too large | steps **overshoot** the minimum, zig-zag, or even **diverge** (the loss explodes) |

Experiment on the real fuel data from the week 3 notebook:

:::viz name=gd1d preset=fuel
Try 0.0001 (slow), 0.003 (good — the value used in the notebook), 0.0105 (zig-zag across the valley) and 0.012 (diverges). Change the start w too.
:::

:::quiz
? At the current weight the derivative of the loss is +12. What should gradient descent do?
- increase w
+ decrease w
- stop, w is optimal
> A positive slope means the loss grows when w grows, so we move w down: w − η·12.

? w = 4, derivative = −10, learning rate = 0.1. What is the new w?
= 5
> 4 − 0.1 · (−10) = 5.

? Training with a very large learning rate makes the loss grow every step. Why?
+ Each step overshoots the minimum by more than the previous error
- The data is wrong
- The derivative is always zero
> Too-large steps jump across the valley further and further: divergence.

? What does a derivative of 0 indicate?
+ The loss curve is flat there — possibly a minimum
- The loss is zero
- The learning rate is zero
> Flat slope ≠ zero loss; it means no local direction improves the loss.
:::

## Two weights: a loss *surface*

With $\hat y = x_1 w_1 + x_2 w_2$, each **pair** $(w_1, w_2)$ has a loss. Two horizontal axes plus height = a 3-D bowl. Looked at from above, we draw it as a **contour map**: each ring joins weight pairs with equal loss, the inner rings are lower.

Gradient descent computes **both** partial derivatives and updates both weights **simultaneously**:

$$
w_1 \leftarrow w_1 - \eta\,\frac{\partial L}{\partial w_1}, \qquad w_2 \leftarrow w_2 - \eta\,\frac{\partial L}{\partial w_2}
$$

The vector $\left[\frac{\partial L}{\partial w_1}, \frac{\partial L}{\partial w_2}\right]$ is the **gradient**: it points uphill; subtracting it goes downhill.

:::viz name=gd2d
Three observations with features (1,0), (0,1), (1,1) and targets 2, 3, 5 → the best weights are (2, 3). Switch the data to “one feature 3× larger”: the bowl becomes a **narrow valley** and gradient descent **zig-zags**. Compare with **coordinate descent** (one weight at a time). Click on the map to choose a starting point.
:::

Things to remember from the slides:

- For linear regression + MSE the surface is a **smooth convex bowl with one global minimum**. More complex models (neural networks) can have **several minima**: the result may depend on the starting point.
- Gradient descent can **oscillate** across narrow valleys. Feature **scaling** (similar ranges for all features) helps a lot.
- **Adaptive learning rates** (AdaGrad, RMSProp, Adam) adjust the effective step size during training, so updates become more controlled near the minimum.

:::key title="Summary"
- Derivative = slope of the loss; its **sign** gives the direction.
- Update: $w \leftarrow w - \eta \cdot \frac{dL}{dw}$ (minus = downhill).
- Learning rate too small → slow; too large → overshoot / diverge.
- Several weights → gradient (all partial derivatives), updated simultaneously.
:::
