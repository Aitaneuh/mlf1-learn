Until now every model learned from **labels**. What if nobody has labelled the data? We can still discover **structure**. The classic tool: **K-means clustering**.

## Supervised vs unsupervised — again, precisely

| | Supervised | Unsupervised |
|---|---|---|
| training data | features **+ labels** | features only |
| goal | predict a known target | discover structure under a chosen model |
| examples | logistic regression, Naive Bayes, **KNN** | **K-means**, topic models (NMF, LDA) |

A method's use of labels matters more than whether its name contains a “K”: **K-means and KNN are completely different algorithms** (next lesson).

## The K-means algorithm

Only $X$ is given. Choose $K$, the number of clusters. Then alternate two steps:

1. **Initialise** — choose K starting centroids (e.g. K random data points). Different starts can give different results.
2. **Assign** — each observation joins its **nearest** centroid.
3. **Update** — each centroid moves to the **mean** of the points assigned to it.
4. Repeat 2–3 until assignments stop changing (or a maximum number of iterations).

The objective is a **small within-cluster squared distance**, called **inertia**:

$$
\text{inertia} = \sum_{i} \lVert \mathbf x_i - \boldsymbol\mu_{c(i)} \rVert^2
$$

(sum of squared distances from each point to its own centroid).

:::viz name=kmeans
Step through: Initialise → Assign → Update → Assign → … Watch the inertia fall. Then try K = 2 or K = 5 on data with 3 visible groups, and click “New data” to see different starts.
:::

:::exercise id=assign title="One K-means iteration by hand"
--- task
Six 2-D points and two starting centroids are given.

1. `labels` — for each point, the index (0 or 1) of the nearest centroid
2. `new_centroids` — the mean of the points in each cluster (shape `(2, 2)`)
3. `inertia` — the sum of squared distances of each point to its **new** centroid
--- setup
import numpy as np
X = np.array([[1, 1], [1.5, 2], [3, 4], [5, 7], [3.5, 5], [4.5, 5]])
centroids = np.array([[1, 1], [5, 7]])
--- starter
# distances: shape (6, 2) — distance of every point to every centroid
d = np.sqrt(((X[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2))
labels = None
new_centroids = None
inertia = None
print(labels, new_centroids, inertia)
--- check
import numpy as np
assert list(labels) == [0, 0, 0, 1, 1, 1], f"labels = {labels}"
assert np.allclose(new_centroids, [[11/6, 7/3], [13/3, 17/3]]), f"new_centroids = {new_centroids}"
exp = sum(((X[i] - np.array([[11/6, 7/3], [13/3, 17/3]])[[0,0,0,1,1,1][i]]) ** 2).sum() for i in range(6))
assert abs(inertia - exp) < 1e-6, f"inertia = {inertia}, expected {exp:.4f}"
--- hint
`labels = d.argmin(axis=1)`; `X[labels == k].mean(axis=0)` for each k.
--- hint
`inertia = ((X - new_centroids[labels]) ** 2).sum()`
--- solution
d = np.sqrt(((X[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2))
labels = d.argmin(axis=1)
new_centroids = np.array([X[labels == k].mean(axis=0) for k in range(2)])
inertia = ((X - new_centroids[labels]) ** 2).sum()
print(labels, new_centroids, inertia)
:::

## Clusters are a *model* of structure, not the truth

- **Geometry:** Euclidean distance favours compact, round groups. Feature **scale** affects similarity (a feature in thousands dominates one in decimals).
- **Representation:** pixels, pen coordinates and word vectors define *different* notions of similarity.
- **Choice of K:** K is *chosen*, not discovered. Ten clusters on MNIST do **not** guarantee one cluster per digit.
- **Cluster IDs are arbitrary names:** “cluster 0” does not mean digit 0.

## Evaluating clusters without labels

| Measure | Question | Reading |
|---|---|---|
| **Inertia** | how tightly do points sit around their centres? | lower = tighter; but **more clusters always reduce it** (K = n gives 0!) |
| **Silhouette** | does a point fit its own cluster better than the nearest other cluster? | near +1 well separated, near 0 between groups, < 0 maybe in the wrong group |
| **Human inspection** | do centroids, sizes and example members make sense? | is the structure *useful*? |

A compact grouping is not necessarily a *meaningful* grouping.

## Revealing labels afterwards (external check)

If labels exist (as for MNIST), we can — **after** fitting — compare clusters with them:

- a **cluster × label count table** (heatmap): rows = clusters, columns = true digits. Look for clusters dominated by one digit, mixed clusters, and digits split over several clusters.
- the **Adjusted Rand Index (ARI)**: agreement between two groupings, ignoring the arbitrary IDs. 1 = identical partition, ≈ 0 = chance-level agreement, negative possible. **ARI is not accuracy.**

Using labels to *assess* a frozen clustering does not make the clustering supervised. But if you then pick K to maximise ARI, the selection becomes label-informed.

:::quiz
? What does K mean in K-means?
+ the number of clusters
- the number of neighbours
- the number of iterations
> K is chosen before fitting.

? Which two steps does K-means alternate?
+ assign points to the nearest centroid; move each centroid to the mean of its points
- predict and update weights with gradients
- count words and smooth
> Assign / update until stable.

? Why can't you choose K by minimising inertia?
+ Inertia always decreases as K increases (K = n gives 0)
- Inertia cannot be computed
- Inertia increases with K
> A trade-off measure (e.g. silhouette, usefulness) is needed.

? A silhouette value near 0 for a point means…
+ it lies between two clusters
- it is perfectly clustered
- it is an error
> Near +1 = well inside its cluster; below 0 = probably closer to another.

? The ARI between clusters and digit labels is 0.4. What can you say?
+ The clustering agrees with the labels better than chance, but far from perfectly
- 40 % of images are correctly classified
> ARI is an agreement index, not an accuracy.
:::

:::key title="Summary"
K-means: choose K → init → (assign → update)* → minimises inertia. Clusters are model choices; IDs are arbitrary. Evaluate with inertia/silhouette/inspection; compare to labels afterwards with a heatmap or ARI — never call it accuracy.
:::
