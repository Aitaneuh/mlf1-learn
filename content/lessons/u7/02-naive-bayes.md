Naive Bayes turns Bayes' theorem into a fast classifier that learns by **counting and averaging** — no gradient descent at all.

## The naive assumption

A Pendigits example has 16 features (8 pen positions, x and y). We need the likelihood $P(\mathbf x \mid c)$ of **all 16 together** within a class — hard to estimate. The “naive” simplification: model each feature **separately within each class**:

$$
\text{score}(c) = P(c) \times P(x_1 \mid c) \times P(x_2 \mid c) \times \dots \times P(x_{16} \mid c)
$$

This assumes the features are **conditionally independent given the class** (not independent overall). It is clearly false for pen traces — consecutive coordinates along a stroke are related. Yet the classifier often works well; its *probabilities* may just be badly calibrated (over-confident).

## How Naive Bayes learns

| Linear/logistic regression | Naive Bayes |
|---|---|
| start with guessed weights | group training examples by class |
| measure the loss | count classes; summarise each feature per class |
| update with gradient descent, repeat | compute the parameters **directly with formulas** |

The objective is **maximum likelihood** (make the training data as plausible as possible); the equivalent loss is the negative log likelihood. And note: fitting does not optimise accuracy — we *evaluate* accuracy afterwards.

## Three flavours — choose the one that matches your features

| | **Gaussian NB** | **Multinomial NB** | **Bernoulli NB** |
|---|---|---|---|
| feature meaning | continuous measurement | occurrence **counts** | binary presence (0/1) |
| example | petal length = 4.7 cm | “goal” occurs 3 times | “goal” occurs: 1 |
| learns per class | mean & variance of each feature | smoothed word proportions | presence probabilities |

## Gaussian NB: means and variances

For each class: how common is it, and where do its feature values lie? Suppose 30 of 100 training labels are “5” → prior 0.30. The first coordinate of the three “5”s in training is [2, 4, 6]: mean 4, variance ((2−4)² + 0 + (4−6)²)/3 ≈ 2.67.

To score a new value, Gaussian NB reads the **height of each class's bell curve** at that value (a density, not a probability), multiplies the heights of all features with the prior, and picks the class with the largest result.

:::viz name=gaussnb
A new first coordinate of 5: which curve is higher there? Change the prior or the spreads and watch the posterior move.
:::

:::exercise id=gauss title="Gaussian NB by hand (one feature)"
--- task
One feature, two classes. Training values: class “5”: `[2, 4, 6]`, class “9”: `[7, 8, 9]`. Equal priors.

1. Compute each class's `mean` and `var` (population variance: `np.var`)
2. Write `density(x, mean, var)` = $\frac{1}{\sqrt{2\pi\,\text{var}}}\exp\!\left(-\frac{(x-\text{mean})^2}{2\,\text{var}}\right)$
3. For the new value `x_new = 5.5`, compute `post_5` = P(5 | x) using prior × density, normalised
--- starter
import numpy as np
c5 = np.array([2, 4, 6]); c9 = np.array([7, 8, 9])
mean5, var5 = None, None
mean9, var9 = None, None

def density(x, mean, var):
    return None

x_new = 5.5
post_5 = None
print(mean5, var5, mean9, var9, post_5)
--- check
import numpy as np
assert abs(mean5 - 4) < 1e-9 and abs(var5 - 8/3) < 1e-9, f"class 5: mean {mean5}, var {var5}"
assert abs(mean9 - 8) < 1e-9 and abs(var9 - 2/3) < 1e-9, f"class 9: mean {mean9}, var {var9}"
assert abs(density(4, 4, 1) - 1/np.sqrt(2*np.pi)) < 1e-9, "density is wrong"
d5 = 1/np.sqrt(2*np.pi*8/3)*np.exp(-(1.5)**2/(2*8/3)); d9 = 1/np.sqrt(2*np.pi*2/3)*np.exp(-(2.5)**2/(2*2/3))
assert abs(post_5 - d5/(d5+d9)) < 1e-6, f"post_5 = {post_5}, expected {d5/(d5+d9):.4f}"
--- hint
`c5.mean()`, `np.var(c5)`; density: `np.exp(-(x - mean)**2 / (2*var)) / np.sqrt(2*np.pi*var)`.
--- hint
`s5 = 0.5 * density(x_new, mean5, var5)`, same for 9, then `post_5 = s5 / (s5 + s9)`.
--- solution
import numpy as np
c5 = np.array([2, 4, 6]); c9 = np.array([7, 8, 9])
mean5, var5 = c5.mean(), np.var(c5)
mean9, var9 = c9.mean(), np.var(c9)

def density(x, mean, var):
    return np.exp(-(x - mean) ** 2 / (2 * var)) / np.sqrt(2 * np.pi * var)

x_new = 5.5
s5 = 0.5 * density(x_new, mean5, var5)
s9 = 0.5 * density(x_new, mean9, var9)
post_5 = s5 / (s5 + s9)
print(mean5, var5, mean9, var9, post_5)
:::

5.5 is 1.5 away from class 5's mean and 2.5 away from class 9's mean — but distance alone is not the story: class 9's curve is **narrow** (small variance), so a value 2.5 away is *very* unusual for a 9. Spread matters, not just distance.

## Multinomial NB: counting words, with smoothing

For text, features are **counts**. Within each class, sum the counts of each word over all training documents and divide by the total → word proportions. Problem: a word never seen in a class gets probability **0**, and one zero kills the whole product.

**Smoothing** with $\alpha$ (alpha) adds a small count to every word before dividing:

$$
P(\text{word } j \mid c) = \frac{N_{cj} + \alpha}{\sum_k N_{ck} + \alpha V}
$$

$N_{cj}$ = count of word j in class c, $V$ = vocabulary size. Example: counts `[4, 2, 0]`, no smoothing → `[4/6, 2/6, 0]`. With $\alpha = 1$ (**Laplace smoothing**): `[5, 3, 1] / 9`. Why $+\alpha V$ in the denominator? We added $\alpha$ to each of the $V$ counts, so the total grows by $\alpha V$ — the probabilities still sum to 1.

$\alpha$ is a **hyperparameter** (chosen before fitting). Larger $\alpha$ pulls the probabilities towards uniform.

:::exercise id=mnb title="Score a document with Multinomial NB"
--- task
Vocabulary `[goal, code]`. Training word counts: **sport** `[4, 1]`, **tech** `[1, 5]`. Equal priors 1/2, α = 1.

1. `p_sport`, `p_tech` — smoothed word probabilities (arrays of 2)
2. New document “goal goal code” → counts `x = [2, 1]`. Score of a class = prior × ∏ p_word^count. Compute `score_sport`, `score_tech`
3. `post_sport` — normalised posterior for sport
--- starter
import numpy as np
alpha = 1
sport = np.array([4, 1]); tech = np.array([1, 5])
p_sport = None
p_tech = None
x = np.array([2, 1])
score_sport = None
score_tech = None
post_sport = None
print(p_sport, p_tech, score_sport, score_tech, post_sport)
--- check
import numpy as np
assert np.allclose(p_sport, [5/7, 2/7]) and np.allclose(p_tech, [2/8, 6/8]), f"p_sport={p_sport}, p_tech={p_tech}"
assert abs(score_sport - 25/343) < 1e-9 and abs(score_tech - 3/128) < 1e-9, f"scores {score_sport}, {score_tech}"
assert abs(post_sport - 0.7567) < 0.001, f"post_sport = {post_sport}"
--- hint
`p_sport = (sport + alpha) / (sport.sum() + alpha * 2)`
--- hint
`score_sport = 0.5 * np.prod(p_sport ** x)` — counts become exponents.
--- solution
import numpy as np
alpha = 1
sport = np.array([4, 1]); tech = np.array([1, 5])
p_sport = (sport + alpha) / (sport.sum() + alpha * len(sport))
p_tech = (tech + alpha) / (tech.sum() + alpha * len(tech))
x = np.array([2, 1])
score_sport = 0.5 * np.prod(p_sport ** x)
score_tech = 0.5 * np.prod(p_tech ** x)
post_sport = score_sport / (score_sport + score_tech)
print(p_sport, p_tech, score_sport, score_tech, post_sport)
:::

### Why implementations use logs

Multiplying many small probabilities (0.01 × 0.01 × …) quickly gets so small the computer rounds it to 0 (**numerical underflow**). Since $\log(a\cdot b) = \log a + \log b$ and log preserves the order, implementations **add log-probabilities** instead — same winner. *Smoothing fixes zero estimates; logs fix underflow.*

### Bernoulli NB: absence is evidence too

Features are 1/0 (word present or not). “goal goal goal” → goal = 1, code = 0. The score multiplies P(present) for present words **and** P(absent) = 1 − P(present) for absent ones. With presence probabilities sport (goal 2/3, code 1/3), tech (1/3, 2/3): sport = ½·⅔·⅔ = 2/9, tech = ½·⅓·⅓ = 1/18 → P(sport) = 0.80.

## Does Multinomial NB make sense for pen coordinates?

The code accepts it (coordinates 0–100 are non-negative). But a coordinate of 20 means **a position**, not “20 occurrences”. Acceptable inputs do not prove the model's assumptions. Careful: mean-centering the features (subtracting means) would create negative values that Multinomial NB cannot accept. Gaussian NB's assumptions (bell curves, independence) are imperfect too. Conclusion: **compare empirically**, against a dummy, with the same folds — next two lessons.

:::quiz
? What is “naive” in Naive Bayes?
+ It treats the features as conditionally independent given the class
- It ignores the prior
- It uses only one feature
> Each feature's likelihood is modelled separately within a class.

? Counts [3, 0, 1] for a class, α = 1. Smoothed probability of the second word?
= 0.1429 tol=0.001
> (0 + 1) / (4 + 1·3) = 1/7.

? Why do implementations add log-probabilities instead of multiplying probabilities?
+ To avoid numerical underflow; the winning class stays the same
- Because logs make the model more accurate
- To remove zero probabilities
> Smoothing handles zeros; logs handle underflow.

? Which Naive Bayes variant suits continuous measurements like petal length?
+ Gaussian NB
- Multinomial NB
- Bernoulli NB
> It models each feature with a mean and variance per class.

? Does Naive Bayes need a gradient-descent loop to fit?
- yes, like logistic regression
+ no, it computes counts, means and variances directly
:::

:::key title="Summary"
score(c) = prior × ∏ feature likelihoods (naive: conditionally independent). Gaussian → means/variances; Multinomial → smoothed counts (α); Bernoulli → presence/absence. Fit = counting; use logs for stability.
:::
