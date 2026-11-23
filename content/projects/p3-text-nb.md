**Goal:** build a **Multinomial Naive Bayes text classifier from scratch** — tokenizer, vocabulary, counting, smoothing, log-scores — and check it against scikit-learn.

**Data:** 1040 training and 360 test messages from four 20-Newsgroups forums: `comp.graphics`, `rec.sport.hockey`, `sci.med`, `sci.space` (headers, signatures and quotes removed). Task: given a message, predict its forum.

:::exercise id=p3s1 kind=project title="Step 1 — Load the data"
--- task
Load `data/newsgroups4.json` with the `json` module. Create `train_text`, `train_y`, `test_text`, `test_y` (lists; labels as NumPy arrays) and `names` (the 4 forum names). Print one example message and its forum.
--- starter
import json
import numpy as np
with open("data/newsgroups4.json") as f:
    data = json.load(f)
names = None
train_text, train_y = None, None
test_text, test_y = None, None
--- check
assert len(train_text) == 1040 and len(test_text) == 360, f"{len(train_text)} train, {len(test_text)} test"
assert len(names) == 4 and train_y.shape == (1040,), "train_y should be a NumPy array of labels 0–3"
--- hint
`data["train"]["text"]`, `np.array(data["train"]["label"])`, `data["target_names"]`.
--- solution
import json
import numpy as np
with open("data/newsgroups4.json") as f:
    data = json.load(f)
names = data["target_names"]
train_text, train_y = data["train"]["text"], np.array(data["train"]["label"])
test_text, test_y = data["test"]["text"], np.array(data["test"]["label"])
print(names)
print(names[train_y[0]], "→", train_text[0][:300])
:::

:::exercise id=p3s2 kind=project title="Step 2 — Tokenizer and vocabulary"
--- task
1. `tokenize(text)` → list of lowercase words: use `re.findall(r"[a-z]{3,}", text.lower())` (words of ≥ 3 letters).
2. Count how many **training documents** contain each word, and build `vocab`: a dict word → column index, for words appearing in **at least 3** training documents, excluding the words in `STOP`.
--- starter
import re
from collections import Counter
STOP = set("the and for that this with you are not have was but they from what can there all any about would will one just more has your like out some which their them been when also how than other only its into who".split())

def tokenize(text):
    return None

doc_freq = Counter()
for t in train_text:
    pass  # TODO: update doc_freq with the SET of words of t

vocab = None
print(len(vocab))
--- check
assert tokenize("Hello, NHL fans! 3D is ok") == ["hello", "nhl", "fans"], f"tokenize gave {tokenize('Hello, NHL fans! 3D is ok')}"
assert isinstance(vocab, dict) and 2500 < len(vocab) < 9000, f"vocab size {len(vocab) if vocab else None}"
assert "the" not in vocab and all(doc_freq[w] >= 3 for w in vocab), "apply both filters"
assert sorted(vocab.values()) == list(range(len(vocab))), "indices must be 0..V-1"
--- hint
`doc_freq.update(set(tokenize(t)))`
--- hint
`words = sorted(w for w, c in doc_freq.items() if c >= 3 and w not in STOP)` then `vocab = {w: i for i, w in enumerate(words)}`.
--- solution
import re
from collections import Counter
STOP = set("the and for that this with you are not have was but they from what can there all any about would will one just more has your like out some which their them been when also how than other only its into who".split())

def tokenize(text):
    return re.findall(r"[a-z]{3,}", text.lower())

doc_freq = Counter()
for t in train_text:
    doc_freq.update(set(tokenize(t)))

words = sorted(w for w, c in doc_freq.items() if c >= 3 and w not in STOP)
vocab = {w: i for i, w in enumerate(words)}
print(len(vocab))
:::

:::exercise id=p3s3 kind=project title="Step 3 — Count matrix"
--- task
Write `to_counts(texts)` returning a NumPy array of shape `(len(texts), V)` with word counts (words not in `vocab` are ignored). Create `Xtr = to_counts(train_text)` and `Xte = to_counts(test_text)`.
--- starter
def to_counts(texts):
    M = np.zeros((len(texts), len(vocab)))
    # TODO
    return M

Xtr = to_counts(train_text)
Xte = to_counts(test_text)
print(Xtr.shape, Xte.shape, Xtr.sum())
--- check
assert Xtr.shape == (1040, len(vocab)) and Xte.shape == (360, len(vocab))
row = to_counts(["hockey hockey goal unknownwordxyz"])
assert row.sum() == sum(1 for w in ["hockey", "hockey", "goal"] if w in vocab), "count every in-vocabulary token"
--- hint
```python
for i, t in enumerate(texts):
    for w in tokenize(t):
        j = vocab.get(w)
        if j is not None:
            M[i, j] += 1
```
--- solution
def to_counts(texts):
    M = np.zeros((len(texts), len(vocab)))
    for i, t in enumerate(texts):
        for w in tokenize(t):
            j = vocab.get(w)
            if j is not None:
                M[i, j] += 1
    return M

Xtr = to_counts(train_text)
Xte = to_counts(test_text)
print(Xtr.shape, Xte.shape, Xtr.sum())
:::

:::exercise id=p3s4 kind=project title="Step 4 — Fit: priors and smoothed log-probabilities"
--- task
Write `fit_nb(X, y, alpha=1.0)` returning `(log_prior, log_lik)`:

- `log_prior[c]` = log(fraction of training docs in class c) — shape `(4,)`
- `log_lik[c, j]` = log((count of word j in class c + α) / (total words in class c + α·V)) — shape `(4, V)`
--- starter
def fit_nb(X, y, alpha=1.0):
    classes = np.unique(y)
    log_prior = np.zeros(len(classes))
    log_lik = np.zeros((len(classes), X.shape[1]))
    for c in classes:
        Xc = X[y == c]
        # TODO
    return log_prior, log_lik

log_prior, log_lik = fit_nb(Xtr, train_y)
print(np.exp(log_prior), np.exp(log_lik).sum(axis=1))
--- check
lp, ll = fit_nb(Xtr, train_y)
assert np.allclose(np.exp(lp).sum(), 1), "priors must sum to 1"
assert np.allclose(np.exp(ll).sum(axis=1), 1), "each class's word probabilities must sum to 1 (did you add alpha*V?)"
assert np.isfinite(ll).all(), "no -inf: smoothing should prevent zeros"
--- hint
```python
log_prior[c] = np.log(len(Xc) / len(X))
counts = Xc.sum(axis=0)
log_lik[c] = np.log((counts + alpha) / (counts.sum() + alpha * X.shape[1]))
```
--- solution
def fit_nb(X, y, alpha=1.0):
    classes = np.unique(y)
    log_prior = np.zeros(len(classes))
    log_lik = np.zeros((len(classes), X.shape[1]))
    for c in classes:
        Xc = X[y == c]
        log_prior[c] = np.log(len(Xc) / len(X))
        counts = Xc.sum(axis=0)
        log_lik[c] = np.log((counts + alpha) / (counts.sum() + alpha * X.shape[1]))
    return log_prior, log_lik

log_prior, log_lik = fit_nb(Xtr, train_y)
print(np.exp(log_prior), np.exp(log_lik).sum(axis=1))
:::

## Predicting with log-scores

$\log \text{score}(c) = \log P(c) + \sum_j x_j \log P(w_j \mid c)$ — counts multiply the log-probabilities. For the whole matrix at once: `X @ log_lik.T + log_prior` gives a `(n_docs, 4)` score table.

:::exercise id=p3s5 kind=project title="Step 5 — Predict and evaluate"
--- task
1. `predict_nb(X, log_prior, log_lik)` → array of predicted classes (argmax of the log-scores)
2. `my_acc` — accuracy on the test set
3. Compare with scikit-learn: `MultinomialNB(alpha=1.0).fit(Xtr, train_y)` → `sk_acc`. They should be (almost) identical!
--- starter
from sklearn.naive_bayes import MultinomialNB
def predict_nb(X, log_prior, log_lik):
    return None

my_acc = None
sk_acc = None
print(my_acc, sk_acc)
--- check
assert my_acc > 0.75, f"my_acc = {my_acc}"
assert abs(my_acc - sk_acc) < 0.01, f"yours {my_acc} vs sklearn {sk_acc} — they should match"
--- hint
`(X @ log_lik.T + log_prior).argmax(axis=1)`
--- solution
from sklearn.naive_bayes import MultinomialNB
def predict_nb(X, log_prior, log_lik):
    return (X @ log_lik.T + log_prior).argmax(axis=1)

my_acc = (predict_nb(Xte, log_prior, log_lik) == test_y).mean()
sk_acc = MultinomialNB(alpha=1.0).fit(Xtr, train_y).score(Xte, test_y)
print(my_acc, sk_acc)
:::

:::exercise id=p3s6 kind=project title="Step 6 — What did it learn? Plus a tiny demo"
--- task
1. `top_words` — a dict forum name → list of the 8 words with the highest `log_lik` **relative to the other classes**: use `log_lik[c] - log_lik.mean(axis=0)` and `argsort`.
2. Classify your own sentence with `predict_nb(to_counts([...]), ...)` — e.g. “the goalie made an amazing save in the third period”.
--- starter
inv = {i: w for w, i in vocab.items()}
top_words = {}
# TODO
top_words
--- check
assert set(top_words) == set(names) and all(len(v) == 8 for v in top_words.values()), "8 words for each of the 4 forums"
assert any(w in top_words["rec.sport.hockey"] for w in ["hockey", "team", "game", "season", "nhl", "players", "play", "goal", "period", "playoffs", "games", "teams", "leafs", "cup"]), "hockey words should appear for rec.sport.hockey"
--- solution
inv = {i: w for w, i in vocab.items()}
top_words = {}
for c, name in enumerate(names):
    rel = log_lik[c] - log_lik.mean(axis=0)
    top_words[name] = [inv[j] for j in rel.argsort()[::-1][:8]]
s = "the goalie made an amazing save in the third period"
print(s, "→", names[predict_nb(to_counts([s]), log_prior, log_lik)[0]])
top_words
:::

## Reflection

:::reveal title="Try alpha = 0.01 and alpha = 10 — what happens and why?"
Small α trusts the raw counts: rare words get very strong evidence (risk of overfitting to quirks). Large α pulls all word probabilities towards uniform, washing out the evidence — accuracy drops. α is a hyperparameter: choose it with cross-validation on the **training** data, not on the test set.
:::

:::reveal title="Which naive assumption is clearly violated in text?"
Word occurrences are not independent given the class: “space” and “shuttle”, or “ice” and “hockey” co-occur. Naive Bayes multiplies their evidence as if independent, which makes its probabilities over-confident — yet the *ranking* of classes is often right, which is why it is such a strong text baseline.
:::
