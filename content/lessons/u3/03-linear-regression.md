Time for our first real model. **Linear regression** predicts a number with the simplest possible formula: a straight line.

## One feature: a line

$$
\hat y = w \cdot x + b
$$

| Symbol | Meaning | Apartment example |
|---|---|---|
| $x$ | the feature | living area (m²) |
| $w$ | the learned **weight** (slope) | price per m² |
| $b$ | the learned **intercept** | base rent when area = 0 |
| $\hat y$ | the predicted target | predicted monthly rent |

Example: with $w = 20$ and $b = 300$, a 70 m² apartment gets $\hat y = 20 \cdot 70 + 300 = 1700$ CHF.

Play with the weight and intercept. Try to make the red dashed lines (the errors) as short as possible:

:::viz name=linreg
Each orange dot is one apartment (observation). The blue line is the model. The readouts (MSE, RMSE …) measure how wrong the line is overall — Unit 4 explains them. “Find best fit” jumps to the line with the lowest MSE.
:::

## Data vs parameters — know the difference

This distinction confuses many students, so look carefully:

| Element | Where does it come from? | Example |
|---|---|---|
| **Features** $x$ | provided by the dataset | 70 m² |
| **Target** $y$ | provided by the dataset (during training) | CHF 1'750 |
| **Parameters** $w, b$ | **adjusted by the training algorithm** | $w = 20, b = 300$ |
| **Prediction** $\hat y$ | **calculated** from $x$, $w$, $b$ | CHF 1'700 |

The data stays fixed; training searches for good parameter values. Once trained, the parameters stay fixed and we feed in new $x$ to get predictions.

:::exercise id=predict title="Implement the model"
--- task
Write `predict(x, w, b)` returning $w \cdot x + b$. It should work for a single number **and** for a NumPy array of areas.

Then compute `pred_70`: the prediction for 70 m² with $w = 20$, $b = 300$.
--- starter
import numpy as np

def predict(x, w, b):
    return None

pred_70 = None
print(pred_70)
print(predict(np.array([45, 70, 105]), 20, 300))
--- check
import numpy as np
assert pred_70 == 1700, f"pred_70 = {pred_70}, expected 20*70 + 300 = 1700."
assert np.allclose(predict(np.array([45, 70, 105]), 20, 300), [1200, 1700, 2400]), "predict should work element-wise on arrays."
--- hint
`return w * x + b` — with a NumPy array this automatically applies to every element.
--- solution
import numpy as np

def predict(x, w, b):
    return w * x + b

pred_70 = predict(70, 20, 300)
print(pred_70)
print(predict(np.array([45, 70, 105]), 20, 300))
:::

## Several features: multiple linear regression

With features $x_1$ (area), $x_2$ (rooms), $x_3$ (distance to station):

$$
\hat y = w_1 x_1 + w_2 x_2 + w_3 x_3 + b
$$

Each feature has **its own weight**. Interpretation: $w_j$ says how much the prediction changes when feature $j$ increases by **one unit**, *while all other features stay the same*.

:::reveal title="Question: would you expect the weight for distance to the station to be positive or negative?"
**Negative** (most likely): the further from the station, the lower the rent — each extra metre reduces the predicted rent by $|w_3|$ CHF, with area and rooms held constant. Of course, the data decides; that is the point of learning.
:::

In NumPy, multiple linear regression for all apartments at once is a matrix product: `X @ w + b`, where `X` has shape `(n, 3)` and `w` has shape `(3,)`.

:::exercise id=multi title="Predict with three features"
--- task
Given the feature table `X` (area, rooms, distance in m) and the weights `w = [18, 60, -0.2]`, `b = 250`:

compute `predictions` for all apartments — either with a loop or with `X @ w + b`.
--- setup
import numpy as np
X = np.array([[45, 2.0, 300], [65, 3.0, 900], [80, 3.5, 500], [105, 4.5, 1200]])
w = np.array([18, 60, -0.2])
b = 250
--- starter
predictions = None
print(predictions)
--- check
import numpy as np
assert predictions is not None and np.allclose(predictions, X @ w + b), f"predictions = {predictions}"
--- hint
For the first apartment: 18·45 + 60·2 − 0.2·300 + 250 = 1120.
--- solution
predictions = X @ w + b
print(predictions)
:::

## Why learn and not just program the rules?

You could write `IF area > 70 AND location = Biel AND renovated THEN rent = …`. But many factors interact, the relationships are not exactly known, the market changes, exceptions are common. Letting the computer **learn the relationship from examples** scales to all of this — as long as we can measure how good a model is. That is the topic of the next unit.

:::quiz
? In $\hat y = w x + b$, which values are learned during training?
- $x$ and $y$
+ $w$ and $b$
- $\hat y$
> Features and targets come from data; the parameters are learned; the prediction is computed.

? With $w = 15$ and $b = 400$, what is the predicted rent for 60 m²?
= 1300
> 15 · 60 + 400 = 1300.

? In a multiple regression, $w_{\text{rooms}} = 60$. What does it mean?
+ With all other features unchanged, one extra room increases the predicted rent by 60 CHF
- Every apartment costs 60 CHF per room in total
- Rooms are 60 % of the price
> A weight is a change in prediction per unit of its feature, holding the others constant.

? What is the difference between a feature and a parameter?
+ A feature is input data describing an observation; a parameter is a value the model learns
- They are the same
- A parameter is a column of the dataset
> Features are given; parameters are learned.
:::

:::key title="Summary"
- Linear regression: $\hat y = w_1x_1 + \dots + w_nx_n + b$ — one weight per feature plus an intercept.
- Features & targets = data; weights & intercept = learned parameters; $\hat y$ = computed.
:::
