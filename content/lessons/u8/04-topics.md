Unsupervised learning on **text**: can a model find recurring themes in thousands of forum messages without being told the forums? This is **topic modelling** (week 6, 20 Newsgroups demo).

## The dataset

**20 Newsgroups**: ~18 800 messages from 20 early-internet discussion forums (computers, cars, sport, science, religion, politics…), split 11 314 train / 7 532 test. One observation = one message. The existing label = the forum (e.g. `sci.space`). Our task: find recurring word patterns **without** using those labels.

“20 Newsgroups” names the dataset — not the number of topics to learn. A learned topic may span several groups, and one message can mix several topics.

## Clean → vectorise → factorise → interpret

1. **Clean**: remove headers, signatures and quoted replies (they reveal the source or repeat other people's text). Cleaning is imperfect.
2. **Vectorise** with **TF-IDF**: a document–term table, rows = messages, columns = vocabulary terms. Each value = how important a term is in a message: frequent in *this* message (**TF**, term frequency) but rare across the collection (**IDF**, inverse document frequency). Words in nearly every document get little weight.
3. **Factorise** with **NMF** to find a few reusable word patterns.
4. **Interpret** the patterns by reading top words **and** example documents.

## TF-IDF by hand

$$
\text{tfidf}(t, d) = \text{tf}(t, d) \times \text{idf}(t), \qquad \text{idf}(t) = \ln\frac{1 + n}{1 + \text{df}(t)} + 1
$$

($n$ = number of documents, df = number of documents containing $t$ — this is scikit-learn's smoothed formula; afterwards each row is scaled to length 1.)

:::code
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd
docs = ["the rocket launch was delayed",
        "the hockey game was great",
        "rocket engines and launch pads",
        "great save by the goalie in the hockey game"]
vec = TfidfVectorizer()
X = vec.fit_transform(docs)
pd.DataFrame(X.toarray(), columns=vec.get_feature_names_out()).round(2)
:::

Notice “the” gets a low weight everywhere (it is in 3 of 4 documents), while “rocket” and “hockey” are strong where they appear. Most entries are 0 — the matrix is **sparse**.

Settings used in the demo: `stop_words="english"` (remove a list of common words), `min_df=2` (keep terms in ≥ 2 documents), `max_df=0.95` (drop terms in > 95 % of documents), `max_features=3000`. These are **modelling choices**, not neutral preprocessing.

## NMF: documents as mixtures of topics

**Non-negative Matrix Factorisation** approximates the big table by the product of two small non-negative tables:

$$
X_{\text{text}} \approx W\,H
$$

| table | meaning | shape (demo) |
|---|---|---|
| $X_{\text{text}}$ | term weights per document | 2000 × 3000 |
| $W$ | how strongly each document uses each topic | 2000 × 5 |
| $H$ | which terms are strong in each topic | 5 × 3000 |

A message about encryption policy can combine a *computing* pattern and a *politics* pattern — NMF is **not** limited to one topic per document. It repeatedly updates W and H to reduce the reconstruction error (`max_iter` is a limit, not a guarantee). **NMF does not name topics; we do**, after reading words and documents. NMF weights are **not** probabilities.

:::exercise id=nmf title="Discover topics in forum messages"
--- task
Use the 1040 training messages of `data/newsgroups4.json` (4 forums — but don't use the labels!).

1. `X_text` — TF-IDF with `max_df=0.95, min_df=2, max_features=2000, stop_words="english"`
2. `nmf = NMF(n_components=4, init="nndsvda", random_state=42, max_iter=400)`; `W = nmf.fit_transform(X_text)`, `H = nmf.components_`
3. `top_terms` — a list with, for each topic, the 8 terms with the highest weight in `H`
--- starter
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
with open("data/newsgroups4.json") as f:
    documents = json.load(f)["train"]["text"]

X_text = None
W, H = None, None
terms = None   # vectorizer.get_feature_names_out()
top_terms = None
for i, t in enumerate(top_terms):
    print(f"Topic {i}:", ", ".join(t))
--- check
assert W.shape == (1040, 4) and H.shape[0] == 4, f"W {None if W is None else W.shape}, H {None if H is None else H.shape}"
assert len(top_terms) == 4 and all(len(t) == 8 for t in top_terms), "8 terms per topic"
--- hint
`vectorizer = TfidfVectorizer(max_df=0.95, min_df=2, max_features=2000, stop_words="english")` then `X_text = vectorizer.fit_transform(documents)`.
--- hint
`top_terms = [list(terms[row.argsort()[-8:][::-1]]) for row in H]`
--- solution
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
with open("data/newsgroups4.json") as f:
    documents = json.load(f)["train"]["text"]

vectorizer = TfidfVectorizer(max_df=0.95, min_df=2, max_features=2000, stop_words="english")
X_text = vectorizer.fit_transform(documents)
nmf = NMF(n_components=4, init="nndsvda", random_state=42, max_iter=400)
W = nmf.fit_transform(X_text)
H = nmf.components_
terms = vectorizer.get_feature_names_out()
top_terms = [list(terms[row.argsort()[-8:][::-1]]) for row in H]
for i, t in enumerate(top_terms):
    print(f"Topic {i}:", ", ".join(t))
:::

:::code title="Read representative documents before naming a topic"
for k in range(4):
    best = np.argsort(W[:, k])[-2:][::-1]
    print(f"=== Topic {k}: {', '.join(top_terms[k][:5])}")
    for d in best:
        print("  -", documents[d][:220], "…")
:::

## A topic is a pattern, not a guaranteed meaning

| plausible theme | weak theme | leftover artefact |
|---|---|---|
| windows, files, program → computing | just, think, like, know → conversational style | edu, com, email → signatures/domains that survived cleaning |

Questions to ask: do the top words support a coherent interpretation (check real documents!)? Are two topics redundant? Would more or fewer topics change the story? How do preprocessing, rare words or quoted text shape the result? And: **five topics are not five predicted newsgroup labels** — NMF reconstructs a table; it was never trained to predict the forums.

## LDA intuition

**LDA (Latent Dirichlet Allocation)** — not Linear Discriminant Analysis — is a *probabilistic* topic model. Imagine every document is a mixture of themes, and each theme favours certain words (technology: software, key; politics: government, law). LDA works **backwards** from the observed words to estimate the themes and each document's theme proportions. No labels needed.

| | NMF | LDA |
|---|---|---|
| input | TF-IDF | word **counts** (`CountVectorizer`) |
| output per document | non-negative topic **weights** (rows need not sum to 1) | topic **probabilities** (rows sum to 1) |
| approach | matrix factorisation | probabilistic generative model |

:::quiz
? What does IDF do?
+ Down-weights terms that appear in many documents
- Counts how often a term appears in one document
- Removes stop words
> Inverse *document* frequency: common-everywhere words are less distinctive.

? In NMF, X ≈ W·H. What does W contain?
+ how strongly each document uses each topic
- the top words of each topic
- the original forum labels
> H holds topic–term weights.

? A topic's top words are “edu, com, email, university”. Best interpretation?
+ Probably leftover signature/address residue, not a subject
- A clear “education” topic
> Always check documents; metadata can survive cleaning.

? Why are 5 NMF topics not 5 predicted newsgroup labels?
+ NMF was fitted to reconstruct word weights without labels; topics can span forums and documents can mix topics
- Because there are 20 newsgroups
> It is unsupervised with a different objective.

? Which input does LDA normally use?
+ word counts
- TF-IDF weights
- forum labels
:::

:::key title="Summary"
Text → TF-IDF table → NMF: documents ≈ mixtures of topics (W) built from word patterns (H). Humans name topics after reading words and documents. LDA = probabilistic cousin on word counts.
:::
