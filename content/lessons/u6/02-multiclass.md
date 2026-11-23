Iris has **three** species. A single sigmoid gives one probability — not enough. This lesson covers **softmax**, **cross-entropy** and **regularisation**.

## Iris: a flower becomes four numbers

150 flowers, 3 species (setosa, versicolor, virginica), 4 features per flower: sepal length, sepal width, petal length, petal width (cm). One observation: `X = [5.1, 3.5, 1.4, 0.2]`, target `y = setosa`. The classifier receives **measurements**, not photos. (And: keep the species out of X!)

## One score per class, then softmax

For each species $k$ the model computes its own score with its own weights:

$$
z_k = \mathbf w_k \cdot \mathbf x + b_k \qquad (4 \text{ weights} + 1 \text{ intercept per class})
$$

**Softmax** turns the scores into probabilities that are positive and sum to 1:

$$
p_k = \frac{e^{z_k}}{\sum_j e^{z_j}}
$$

Worked example:

| species | score $z$ | $e^z$ | probability |
|---|---|---|---|
| setosa | 2 | 7.389 | 7.389 / 11.107 = **0.665** |
| versicolor | 1 | 2.718 | 0.245 |
| virginica | 0 | 1.000 | 0.090 |

Prediction: the class with the **largest probability** (setosa) — even when every probability is below 0.5!

:::viz name=softmax
Make two scores equal, make all three equal, add the same amount to all three. What happens?
:::

:::warn
Do **not** apply three separate 0.5 thresholds for Iris. In multiclass classification you pick the **largest** probability. The order of the probability columns is given by `model.classes_` in scikit-learn.
:::

:::exercise id=softmax title="Implement softmax"
--- task
Write `softmax(z)` for a 1-D NumPy array of scores. Then compute `probs` for `z = [2, 1, 0]` and `winner` = the **index** of the predicted class.
--- starter
import numpy as np

def softmax(z):
    return None

probs = softmax(np.array([2.0, 1.0, 0.0]))
winner = None
print(probs, probs.sum(), winner)
--- check
import numpy as np
pr = softmax(np.array([2.0, 1.0, 0.0]))
assert np.allclose(pr, [0.66524, 0.24473, 0.09003], atol=1e-4), f"softmax([2,1,0]) = {pr}"
assert abs(pr.sum() - 1) < 1e-9, "probabilities must sum to 1"
assert winner == 0, "winner = np.argmax(probs)"
--- hint
`e = np.exp(z)` then `e / e.sum()`. The winner: `probs.argmax()`.
--- solution
import numpy as np

def softmax(z):
    e = np.exp(z)
    return e / e.sum()

probs = softmax(np.array([2.0, 1.0, 0.0]))
winner = probs.argmax()
print(probs, probs.sum(), winner)
:::

## Cross-entropy: the multiclass log loss

For one observation, the loss is simply **−log(probability given to the true class)**:

$$
L = -\sum_k y_k \log p_k = -\log p_{\text{true class}}
$$

(with $y$ one-hot encoded). If the flower is versicolor and the model gave it 0.245: $L = -\log 0.245 \approx 1.41$.

| | binary | multiclass |
|---|---|---|
| scores | one $z$ | one $z_k$ per class |
| probabilities | $p = \text{sigmoid}(z)$ | $p = \text{softmax}(\mathbf z)$ |
| loss | binary cross-entropy $-[y\log p + (1-y)\log(1-p)]$ | cross-entropy $-\log p_{\text{true}}$ |

:::note title="Sigmoid = 2-class softmax"
With two classes, softmax gives $P(y{=}1) = \frac{e^{z_1}}{e^{z_0}+e^{z_1}}$. Divide top and bottom by $e^{z_1}$: $= \frac{1}{1+e^{-(z_1-z_0)}} = \sigma(z_1 - z_0)$. So the sigmoid is just softmax with one score used as reference. Remember: **softmax converts scores into probabilities; cross-entropy is the loss.**
:::

## Regularisation: discourage huge weights

Minimising log loss alone rewards being very confident on the training data — the weights can grow very large, making the model extremely confident based on small differences in x. That fits the training set beautifully and **generalises poorly** (overfitting). Fix: add a penalty for large weights (**L2 regularisation**):

$$
\text{objective} = \text{mean log loss} + \lambda \sum_j w_j^2
$$

| candidate | mean log loss | $\sum w^2$ | loss + 0.1 · $\sum w^2$ |
|---|---|---|---|
| A: w = (3, 4) | 0.20 | 25 | 2.70 |
| B: w = (0.6, 0.8) | 0.30 | 1 | **0.40** ← preferred |

A fits the training labels better, but B has the lower total objective.

- λ too small → risk of **overfitting**; too large → risk of **underfitting**. Choose it with **validation** data.
- In scikit-learn, `LogisticRegression(C=...)`: **C is the inverse** — *smaller C = stronger regularisation*. Default C = 1.
- Regularisation controls coefficient size; it does **not** add training data. Scale features (using statistics from the training data only) so the penalty treats them fairly.

:::exercise id=reg title="Compute the regularised objective"
--- task
For each candidate weight vector compute `objective = log_loss + lam * sum(w**2)` with `lam = 0.1`. Store the two values in `obj_a`, `obj_b`, and set `preferred` to `"A"` or `"B"`.
--- starter
import numpy as np
lam = 0.1
w_a, loss_a = np.array([3, 4]), 0.20
w_b, loss_b = np.array([0.6, 0.8]), 0.30
obj_a = None
obj_b = None
preferred = None
print(obj_a, obj_b, preferred)
--- check
assert abs(obj_a - 2.7) < 1e-9 and abs(obj_b - 0.4) < 1e-9, f"obj_a = {obj_a}, obj_b = {obj_b}"
assert preferred == "B", "The candidate with the lower total objective is preferred."
--- solution
import numpy as np
lam = 0.1
w_a, loss_a = np.array([3, 4]), 0.20
w_b, loss_b = np.array([0.6, 0.8]), 0.30
obj_a = loss_a + lam * np.sum(w_a ** 2)
obj_b = loss_b + lam * np.sum(w_b ** 2)
preferred = "A" if obj_a < obj_b else "B"
print(obj_a, obj_b, preferred)
:::

:::quiz
? Softmax probabilities are (0.40, 0.35, 0.25). Which class is predicted?
+ the first one (0.40), even though it is below 0.5
- none, because no probability reaches 0.5
- all three
> Multiclass picks the largest probability.

? Scores are (1, 1, 1). What does softmax output?
+ (1/3, 1/3, 1/3)
- (1, 1, 1)
- (0.5, 0.5, 0.5)
> Equal scores → equal probabilities summing to 1.

? A flower is virginica; the model gave virginica probability 0.5. Cross-entropy loss?
= 0.693
> −log(0.5) ≈ 0.693.

? In scikit-learn's LogisticRegression, how do you make regularisation **stronger**?
+ decrease C
- increase C
- increase max_iter
> C is the inverse of the regularisation strength.

? What is the purpose of L2 regularisation?
+ Discourage very large weights to reduce overfitting
- Add more training data
- Speed up prediction
> It penalises the size of the coefficients.
:::

:::key title="Summary"
One score per class → **softmax** → probabilities summing to 1 → pick the largest. Loss: **cross-entropy** = −log(prob. of true class). **Regularisation** (L2, `C` in sklearn) keeps weights small to generalise better.
:::
