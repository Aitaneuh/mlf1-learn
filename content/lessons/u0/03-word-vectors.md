In the first course notebook you trained a **Word2Vec** model on hotel reviews and asked it which words are similar. It felt like magic. This lesson shows the idea behind it, using tiny vectors you can compute by hand.

## The idea: meaning from neighbours

> “You shall know a word by the company it keeps.” — J. R. Firth (1957)

Word2Vec reads millions of sentences and learns, for every word, a list of numbers — a **vector**, for example 100 numbers long. It is trained so that words appearing in **similar contexts** (surrounded by similar words) get **similar vectors**. “Hotel” and “motel” appear next to words like *room, stay, night, staff* — so their vectors end up close together.

Nobody told the model what words mean. There are no labels: the training signal comes from the text itself (predicting surrounding words). That makes it an example of learning **without** human labels — remember this for Unit 3 (supervised vs unsupervised).

The collection of all word vectors is called a **semantic space**: a space where *distance means difference in meaning*.

## Vectors you can picture

Real word vectors have ~100 dimensions, which nobody can draw. Let's invent 2-dimensional ones where dimension 1 ≈ “is about lodging” and dimension 2 ≈ “is about food”:

<div class="diagram">
<svg viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="wv-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-soft)"/></marker></defs>
  <line x1="50" y1="260" x2="500" y2="260" class="dg-ar" marker-end="url(#wv-a)"/><line x1="50" y1="260" x2="50" y2="20" class="dg-ar" marker-end="url(#wv-a)"/>
  <text x="400" y="285" class="dg-s">lodging →</text><text x="58" y="30" class="dg-s">food ↑</text>
  <line x1="50" y1="260" x2="430" y2="215" style="stroke:var(--c1);stroke-width:3"/><text x="436" y="214" class="dg-t" style="font-weight:700">hotel</text>
  <line x1="50" y1="260" x2="395" y2="190" style="stroke:var(--c1);stroke-width:3"/><text x="400" y="186" class="dg-t" style="font-weight:700">motel</text>
  <line x1="50" y1="260" x2="140" y2="45" style="stroke:var(--c2);stroke-width:3"/><text x="146" y="44" class="dg-t" style="font-weight:700">pizza</text>
  <line x1="50" y1="260" x2="260" y2="80" style="stroke:var(--c3);stroke-width:3"/><text x="266" y="78" class="dg-t" style="font-weight:700">restaurant</text>
</svg>
</div>

“hotel” and “motel” point in almost the **same direction**; “pizza” points elsewhere; “restaurant” is in between (it is about food *and* a place you go to).

## Measuring similarity: cosine similarity

To compare two vectors we look at the **angle** between them. The **cosine similarity** is

$$
\cos(\mathbf a, \mathbf b) = \frac{\mathbf a \cdot \mathbf b}{\lVert \mathbf a \rVert \, \lVert \mathbf b \rVert}
$$

where the **dot product** is $\mathbf a \cdot \mathbf b = a_1 b_1 + a_2 b_2 + \dots$ and the **length** is $\lVert \mathbf a \rVert = \sqrt{a_1^2 + a_2^2 + \dots}$.

| Value | Meaning |
|---|---|
| close to **1** | same direction → very similar |
| around **0** | unrelated (perpendicular) |
| close to **−1** | opposite direction |

When the course notebook calls `model.wv.similarity("hotel", "motel")`, it computes exactly this number.

:::exercise id=dot title="Compute a dot product and a length"
--- task
With `a = [3, 1]` and `b = [2, 2]`:

1. compute the dot product $a_1 b_1 + a_2 b_2$ and store it in `dot`
2. compute the length of `a`, $\sqrt{a_1^2 + a_2^2}$, and store it in `len_a`

`a[0]` is the first number, `a[1]` the second (Python counts from 0). Square root: `math.sqrt(...)`.
--- starter
import math
a = [3, 1]
b = [2, 2]
dot = None
len_a = None
print(dot, len_a)
--- check
assert dot is not None and len_a is not None, "Fill in both `dot` and `len_a`."
assert dot == 8, f"dot is {dot}, expected 3*2 + 1*2 = 8."
assert abs(len_a - math.sqrt(10)) < 1e-9, f"len_a is {len_a}, expected sqrt(3² + 1²) = sqrt(10) ≈ 3.162."
--- hint
`dot = a[0] * b[0] + a[1] * b[1]`
--- hint
`len_a = math.sqrt(a[0] ** 2 + a[1] ** 2)` — `**` means “to the power of”.
--- solution
import math
a = [3, 1]
b = [2, 2]
dot = a[0] * b[0] + a[1] * b[1]
len_a = math.sqrt(a[0] ** 2 + a[1] ** 2)
print(dot, len_a)
:::

With NumPy (Unit 1 explains it properly) this becomes one line for vectors of any length. Run this cell:

:::code
import numpy as np

vectors = {
    "hotel":      np.array([0.90, 0.10, 0.30]),
    "motel":      np.array([0.85, 0.15, 0.20]),
    "restaurant": np.array([0.40, 0.80, 0.30]),
    "pizza":      np.array([0.05, 0.95, 0.10]),
    "breakfast":  np.array([0.35, 0.85, 0.05]),
}

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

for w in ["motel", "restaurant", "pizza"]:
    print(f"similarity(hotel, {w:10s}) = {cosine(vectors['hotel'], vectors[w]):.3f}")
:::

:::exercise id=oddone title="Find the odd one out"
--- task
The notebook had a function `doesnt_match(["breakfast", "pizza", "hotel"])`. Let's build it ourselves.

The odd word is the one with the **lowest average similarity** to the other words. Complete the function `odd_one_out(words)` using the `cosine` function and the `vectors` dictionary from the cell above (run it first!). It must **return** the odd word.
--- starter
def odd_one_out(words):
    best_word = None
    lowest = 2  # cosine is never above 1
    for w in words:
        others = [o for o in words if o != w]
        avg = None  # TODO: average cosine similarity between w and the others
        if avg < lowest:
            lowest = avg
            best_word = w
    return best_word

print(odd_one_out(["breakfast", "pizza", "hotel"]))
--- check
assert 'cosine' in globals() and 'vectors' in globals(), "Run the code cell above first (it defines `vectors` and `cosine`)."
assert odd_one_out(["breakfast", "pizza", "hotel"]) == "hotel", "For breakfast/pizza/hotel the odd one should be 'hotel'."
assert odd_one_out(["hotel", "motel", "pizza"]) == "pizza", "For hotel/motel/pizza the odd one should be 'pizza'."
--- hint
For each other word `o`, compute `cosine(vectors[w], vectors[o])`. Put them in a list and divide the `sum` by the `len`.
--- hint
`avg = sum(cosine(vectors[w], vectors[o]) for o in others) / len(others)`
--- solution
def odd_one_out(words):
    best_word = None
    lowest = 2
    for w in words:
        others = [o for o in words if o != w]
        avg = sum(cosine(vectors[w], vectors[o]) for o in others) / len(others)
        if avg < lowest:
            lowest = avg
            best_word = w
    return best_word

print(odd_one_out(["breakfast", "pizza", "hotel"]))
:::

## The hyperparameters from the notebook

When you trained Word2Vec you passed settings. These are **hyperparameters**: choices *you* make before training (the vectors themselves are learned).

| Setting | Meaning | Effect |
|---|---|---|
| `vector_size` (older: `size`) | How many numbers per word | Larger can capture more nuance but needs more data and memory |
| `window` | How many words left/right count as “context” | Small window → words that can replace each other; large → topically related words |
| `min_count` | Ignore words rarer than this | Removes typos and noise, shrinks the vocabulary |
| `workers` | Number of CPU threads | Only speed, not the result quality |

:::quiz
? Word2Vec gives “hotel” and “motel” similar vectors because…
- someone labelled them as synonyms
+ they appear in similar contexts in the training text
- they have similar spellings
> The model never sees labels or spellings as meaning; it learns from which words appear around each word.

? Two word vectors have cosine similarity 0.98. What does that mean?
+ They point in almost the same direction — the model considers them very similar
- They are 98 % identical letters
- The words appear 98 % of the time together
> Cosine similarity measures the angle between vectors: close to 1 means nearly the same direction.

? Which Word2Vec setting changes only the training **speed**, not what is learned?
- `window`
- `min_count`
+ `workers`
> `workers` sets how many CPU threads are used.

? Is `vector_size` a parameter learned by the model or a hyperparameter you choose?
- Learned by the model
+ Chosen by you before training (hyperparameter)
> The vector *values* are learned; their *length* is your choice beforehand.
:::

:::key title="Summary"
- A model can turn words into **vectors** so that similar meanings are close together.
- **Cosine similarity** = dot product ÷ (lengths) — 1 means same direction.
- **Hyperparameters** are settings you choose; **parameters** (here, the vector values) are learned from data.
:::
