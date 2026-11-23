Naive Bayes, next lesson's classifier, is built entirely from probability. This lesson gives you the four rules you need — with balls in a bag, because you can check everything by counting.

## The setup

A bag holds **2 red and 2 black** balls. We draw two balls **without replacement**.

- $A$ = “the first ball is red”
- $B$ = “the second ball is red”

$P(A) = 2/4 = 1/2$.

## Rule 1 — conditional probability

$P(B \mid A)$ reads “probability of B **given** A”: we *know* A happened. If the first ball was red, the bag now holds 1 red and 2 black, so

$$
P(B \mid A) = 1/3
$$

## Rule 2 — complement

An event and its **complement** $\bar A$ (“not A”) cover every outcome: one of them must happen, never both.

$$
P(A) + P(\bar A) = 1 \quad\Rightarrow\quad P(\bar A) = 1 - P(A)
$$

Here $\bar A$ = first ball black, $P(\bar A) = 1/2$. And given A: $P(B\mid A) + P(\bar B \mid A) = 1/3 + 2/3 = 1$.

## Rule 3 — multiply along branches

$$
P(A \cap B) = P(A)\cdot P(B \mid A) = \tfrac12 \cdot \tfrac13 = \tfrac16
$$

($\cap$ means “and”.) Draw it as a tree:

<div class="diagram">
<svg viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="115" r="8" style="fill:var(--text-soft)"/>
  <line x1="48" y1="110" x2="200" y2="55" class="dg-ar"/><text x="100" y="70" class="dg-s">P(A) = 1/2</text>
  <line x1="48" y1="120" x2="200" y2="175" class="dg-ar"/><text x="100" y="170" class="dg-s">P(Ā) = 1/2</text>
  <circle cx="210" cy="55" r="10" style="fill:var(--c4)"/><text x="210" y="35" text-anchor="middle" class="dg-s">1st red</text>
  <circle cx="210" cy="175" r="10" style="fill:var(--text)"/><text x="210" y="205" text-anchor="middle" class="dg-s">1st black</text>
  <line x1="222" y1="50" x2="380" y2="25" class="dg-ar"/><text x="270" y="28" class="dg-s">1/3</text>
  <line x1="222" y1="60" x2="380" y2="85" class="dg-ar"/><text x="270" y="88" class="dg-s">2/3</text>
  <line x1="222" y1="170" x2="380" y2="145" class="dg-ar"/><text x="270" y="148" class="dg-s">2/3</text>
  <line x1="222" y1="180" x2="380" y2="205" class="dg-ar"/><text x="270" y="210" class="dg-s">1/3</text>
  <text x="390" y="30" class="dg-t">red, red → 1/2 · 1/3 = <tspan style="font-weight:700">1/6</tspan></text>
  <text x="390" y="90" class="dg-t">red, black → 1/2 · 2/3 = 1/3</text>
  <text x="390" y="150" class="dg-t">black, red → 1/2 · 2/3 = <tspan style="font-weight:700">1/3</tspan></text>
  <text x="390" y="210" class="dg-t">black, black → 1/2 · 1/3 = 1/6</text>
</svg>
</div>

The four paths are mutually exclusive, and their probabilities sum to 1 (1/6 + 1/3 + 1/3 + 1/6).

## Rule 4 — add separate routes (total probability)

What is $P(B)$, the probability that the **second** ball is red, without knowing the first? There are two routes to a red second ball: red-red and black-red. Add them (they never overlap):

$$
P(B) = P(B\mid A)P(A) + P(B \mid \bar A)P(\bar A) = \tfrac16 + \tfrac13 = \tfrac12
$$

## Bayes' theorem: reversing the condition

We know the **second** ball was red. What is the probability the **first** was red too? We know $P(B \mid A)$, but we want $P(A \mid B)$.

The joint event can be written two ways: $P(A\cap B) = P(A)P(B\mid A) = P(B)P(A\mid B)$. Divide by $P(B)$:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)} = \frac{\tfrac13 \cdot \tfrac12}{\tfrac12} = \tfrac13
$$

:::note
“Given” means *information*, not time order or causation. We can reason backwards from the second draw to the first.
:::

:::exercise id=balls title="Compute with the rules"
--- task
A bag has **3 red and 1 black** ball; draw two without replacement. Compute as fractions/decimals:

- `p_A` — first is red
- `p_B_given_A` — second red given first red
- `p_A_and_B` — both red
- `p_B` — second red (total probability)
- `p_A_given_B` — first red given second red (Bayes)
--- starter
p_A = None
p_B_given_A = None
p_A_and_B = None
p_B = None
p_A_given_B = None
print(p_A, p_B_given_A, p_A_and_B, p_B, p_A_given_B)
--- check
close = lambda a, b: a is not None and abs(a - b) < 1e-9
assert close(p_A, 3/4), f"p_A = {p_A}"
assert close(p_B_given_A, 2/3), f"p_B_given_A = {p_B_given_A}: after a red, 2 red of 3 remain"
assert close(p_A_and_B, 1/2), f"p_A_and_B = {p_A_and_B} = 3/4 · 2/3"
assert close(p_B, 3/4), f"p_B = {p_B} = P(B|A)P(A) + P(B|Ā)P(Ā) = 2/3·3/4 + 3/3·1/4"
assert close(p_A_given_B, 2/3), f"p_A_given_B = {p_A_given_B} = P(B|A)P(A)/P(B)"
--- hint
If the first ball is black (probability 1/4), all 3 remaining balls are red: P(B|Ā) = 1.
--- solution
p_A = 3 / 4
p_B_given_A = 2 / 3
p_A_and_B = p_A * p_B_given_A
p_B = p_B_given_A * p_A + 1.0 * (1 - p_A)
p_A_given_B = p_B_given_A * p_A / p_B
print(p_A, p_B_given_A, p_A_and_B, p_B, p_A_given_B)
:::

## From balls to classification

Now the trick that makes Bayes useful for ML. Choose bag **A** (3 red, 1 black) or bag **B** (1 red, 3 black) with equal probability, draw one ball. It is **red**. Which bag?

| | Bag A (class 1) | Bag B (class 2) |
|---|---|---|
| **prior** $P(\text{bag})$ | 1/2 | 1/2 |
| **likelihood** $P(\text{red} \mid \text{bag})$ | 3/4 | 1/4 |
| joint score prior × likelihood | 3/8 | 1/8 |
| **posterior** $P(\text{bag} \mid \text{red})$ = score / sum | **3/4** | 1/4 |

$P(\text{red}) = 3/8 + 1/8 = 1/2$ is the same denominator for both bags, so we can just compare the scores. Observe red → predict bag A: **more plausible, not certain**.

$$
P(\text{class } c \mid \mathbf x) = \frac{P(\mathbf x \mid c)\,P(c)}{P(\mathbf x)} \;\propto\; P(\mathbf x \mid c)\,P(c)
$$

| Term | Question | In ML |
|---|---|---|
| **Prior** $P(c)$ | how common is each class? | estimated from the training labels |
| **Likelihood** $P(\mathbf x\mid c)$ | how plausible are these features within class c? | learned from training examples of class c |
| **Posterior** $P(c\mid\mathbf x)$ | how likely is class c after seeing x? | prior × likelihood, normalised to sum to 1 |

:::note title="Probability vs likelihood"
*Probability:* fix the bag, consider the possible draws — they sum to 1. *Likelihood:* fix the observed draw (red), compare bags — likelihoods need **not** sum to 1 across bags. Same expression $P(\text{red}\mid\text{bag})$, different question.
:::

Bayes' theorem is famous for surprising people. Explore a medical test:

:::viz name=bayes prior=1 sens=90 fpr=9
With 1 % sick, a test that catches 90 % of the sick and gives 9 % false alarms: a positive result means only ~9 % chance of being sick! Increase the prior to 20 % and see how the posterior changes.
:::

:::quiz
? Prior P(spam) = 0.2; P("free" | spam) = 0.5; P("free" | not spam) = 0.05. What is the unnormalised score for spam?
= 0.1
> 0.2 · 0.5 = 0.1 (for "not spam": 0.8 · 0.05 = 0.04).

? Using the previous numbers, what is P(spam | "free")?
= 0.714 tol=0.005
> 0.1 / (0.1 + 0.04) ≈ 0.714.

? Which term is estimated by counting how often each class appears in the training labels?
+ the prior
- the likelihood
- the posterior
> The prior is the class frequency.

? P(A) = 0.3. What is P(not A)?
= 0.7
> Complement rule.
:::

:::key title="Summary"
Conditional $P(B\mid A)$; complement $1 - P(A)$; multiply along branches; add separate routes. **Bayes:** posterior ∝ likelihood × prior, then normalise.
:::
