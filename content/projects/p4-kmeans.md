**Goal:** implement **K-means** and **KNN** yourself with NumPy, run them on the MNIST sample, compare with scikit-learn and build an *elbow plot* to discuss the choice of K.

You will practise: vectorised distance computations (broadcasting), iterative algorithms with stopping criteria, and careful evaluation with and without labels.

:::exercise id=p4s1 kind=project title="Step 1 — Data"
--- task
Load `data/mnist_small.npz`, scale to 0–1 (`float32`). To keep things fast, use only the first **1500** training images: `Xtr, ytr`, and all 600 test images: `Xte, yte`.
--- starter
import numpy as np
d = np.load("data/mnist_small.npz")
Xtr, ytr = None, None
Xte, yte = None, None
--- check
assert Xtr.shape == (1500, 784) and Xte.shape == (600, 784) and len(ytr) == 1500
assert Xtr.max() <= 1.0
--- solution
import numpy as np
d = np.load("data/mnist_small.npz")
Xtr, ytr = d["X_train"][:1500].astype(np.float32) / 255, d["y_train"][:1500]
Xte, yte = d["X_test"].astype(np.float32) / 255, d["y_test"]
:::

## Fast squared distances

The squared distance between every row of A `(n, p)` and every row of B `(m, p)` can be computed without loops:

$$
\lVert a - b \rVert^2 = \lVert a\rVert^2 - 2\,a\cdot b + \lVert b\rVert^2
$$

:::exercise id=p4s2 kind=project title="Step 2 — Pairwise squared distances"
--- task
Write `sq_dists(A, B)` returning an `(n, m)` array of squared Euclidean distances using the identity above: `(A**2).sum(1)[:, None] - 2 * A @ B.T + (B**2).sum(1)[None, :]`. Clip tiny negative values (rounding) to 0 with `np.maximum(..., 0)`.
--- starter
def sq_dists(A, B):
    return None

print(sq_dists(np.array([[0., 0.], [1., 1.]]), np.array([[1., 0.]])))
--- check
import numpy as np
r = sq_dists(np.array([[0., 0.], [1., 1.]]), np.array([[1., 0.], [3., 4.]]))
assert r.shape == (2, 2) and np.allclose(r, [[1, 25], [1, 13]]), f"got {r}"
--- solution
def sq_dists(A, B):
    return np.maximum((A ** 2).sum(1)[:, None] - 2 * A @ B.T + (B ** 2).sum(1)[None, :], 0)

print(sq_dists(np.array([[0., 0.], [1., 1.]]), np.array([[1., 0.]])))
:::

:::exercise id=p4s3 kind=project title="Step 3 — K-means from scratch"
--- task
Write `kmeans(X, k, n_iter=50, seed=0)` returning `(centroids, labels, inertia)`:

1. init: `k` distinct random rows of X (`np.random.default_rng(seed).choice(len(X), k, replace=False)`)
2. loop: assign (argmin of `sq_dists`), update (mean per cluster; keep the old centroid if a cluster is empty), stop early when the labels do not change
3. inertia = sum of squared distances to the assigned centroid
--- starter
def kmeans(X, k, n_iter=50, seed=0):
    rng = np.random.default_rng(seed)
    centroids = X[rng.choice(len(X), k, replace=False)].copy()
    labels = None
    for it in range(n_iter):
        pass  # TODO: assign, check for convergence, update
    inertia = None
    return centroids, labels, inertia

cents, labs, inert = kmeans(Xtr, 10)
print("inertia:", inert)
--- check
import numpy as np
toy = np.array([[0, 0], [0, 1], [10, 10], [10, 11]], dtype=float)
c, l, i = kmeans(toy, 2, seed=1)
assert len(set(l[:2])) == 1 and len(set(l[2:])) == 1 and l[0] != l[2], f"toy labels {l}"
assert abs(i - 1.0) < 1e-9, f"toy inertia should be 1.0 (each pair 0.5 from its centre twice 0.25 → 4 × 0.25), got {i}"
cents_, labs_, inert_ = kmeans(Xtr, 10)
assert cents_.shape == (10, 784) and len(labs_) == 1500
--- hint
```python
new = sq_dists(X, centroids).argmin(axis=1)
if labels is not None and (new == labels).all():
    break
labels = new
for j in range(k):
    if (labels == j).any():
        centroids[j] = X[labels == j].mean(axis=0)
```
--- hint
Inertia: `((X - centroids[labels]) ** 2).sum()` — make sure `labels` matches the **final** centroids (re-assign once after the loop).
--- solution
def kmeans(X, k, n_iter=50, seed=0):
    rng = np.random.default_rng(seed)
    centroids = X[rng.choice(len(X), k, replace=False)].copy()
    labels = None
    for it in range(n_iter):
        new = sq_dists(X, centroids).argmin(axis=1)
        if labels is not None and (new == labels).all():
            break
        labels = new
        for j in range(k):
            if (labels == j).any():
                centroids[j] = X[labels == j].mean(axis=0)
    labels = sq_dists(X, centroids).argmin(axis=1)
    inertia = ((X - centroids[labels]) ** 2).sum()
    return centroids, labels, inertia

cents, labs, inert = kmeans(Xtr, 10)
print("inertia:", inert)
:::

:::exercise id=p4s4 kind=project title="Step 4 — Compare with scikit-learn and check with labels"
--- task
1. `sk` = `KMeans(n_clusters=10, n_init=1, random_state=0).fit(Xtr)`; compare `sk.inertia_` with yours (similar order of magnitude; different starts give different local optima).
2. `ari_mine` — ARI between `ytr` and your `labs`.
3. Show your 10 centroids as images.
--- starter
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
import matplotlib.pyplot as plt
sk = None
ari_mine = None
print(inert, sk.inertia_, ari_mine)
--- check
assert sk is not None and hasattr(sk, "inertia_")
assert 0.15 < ari_mine < 0.7, f"ari_mine = {ari_mine}"
--- solution
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
import matplotlib.pyplot as plt
sk = KMeans(n_clusters=10, n_init=1, random_state=0).fit(Xtr)
ari_mine = adjusted_rand_score(ytr, labs)
print(inert, sk.inertia_, ari_mine)
fig, axes = plt.subplots(1, 10, figsize=(12, 1.6))
for c, ax in zip(cents, axes):
    ax.imshow(c.reshape(28, 28), cmap="gray"); ax.axis("off")
plt.show()
:::

:::exercise id=p4s5 kind=project title="Step 5 — Elbow plot"
--- task
Run your `kmeans` for `k` in `[2, 4, 6, 8, 10, 12, 15]` (use `n_iter=20` to stay fast) and store the inertias in `inertias` (a list in the same order). Plot inertia vs k.

Is there a clear “elbow” (where adding clusters stops helping much)?
--- starter
ks = [2, 4, 6, 8, 10, 12, 15]
inertias = []
# TODO
--- check
assert len(inertias) == 7, "one inertia per k"
assert inertias[0] > inertias[-1], "inertia should go down as k grows"
--- solution
ks = [2, 4, 6, 8, 10, 12, 15]
inertias = [kmeans(Xtr, k, n_iter=20)[2] for k in ks]
plt.plot(ks, inertias, "o-"); plt.xlabel("k"); plt.ylabel("inertia"); plt.title("Elbow plot"); plt.show()
:::

On MNIST pixels there is usually **no sharp elbow** — a reminder that K is a modelling choice, not something the data hands you.

:::exercise id=p4s6 kind=project title="Step 6 — KNN from scratch, vectorised"
--- task
Write `knn_predict_all(Xtr, ytr, Xq, k)` predicting labels for **all** query rows at once: compute `sq_dists(Xq, Xtr)`, take the `k` smallest per row (`np.argsort(D, axis=1)[:, :k]`), and vote with `np.bincount(..., minlength=10).argmax()` per row.

Store `acc_mine` (k = 5) on the test set and compare with `KNeighborsClassifier(5)` → `acc_sk`.
--- starter
from sklearn.neighbors import KNeighborsClassifier
def knn_predict_all(Xtr, ytr, Xq, k):
    return None

acc_mine = None
acc_sk = None
print(acc_mine, acc_sk)
--- check
assert acc_mine > 0.8 and abs(acc_mine - acc_sk) < 0.02, f"mine {acc_mine} vs sklearn {acc_sk}"
--- hint
```python
D = sq_dists(Xq, Xtr)
nn = np.argsort(D, axis=1)[:, :k]
votes = ytr[nn]                       # shape (n_queries, k)
return np.array([np.bincount(v, minlength=10).argmax() for v in votes])
```
--- solution
from sklearn.neighbors import KNeighborsClassifier
def knn_predict_all(Xtr, ytr, Xq, k):
    D = sq_dists(Xq, Xtr)
    nn = np.argsort(D, axis=1)[:, :k]
    votes = ytr[nn]
    return np.array([np.bincount(v, minlength=10).argmax() for v in votes])

acc_mine = (knn_predict_all(Xtr, ytr, Xte, 5) == yte).mean()
acc_sk = KNeighborsClassifier(5).fit(Xtr, ytr).score(Xte, yte)
print(acc_mine, acc_sk)
:::

## Reflection

:::reveal title="Why might your inertia differ from scikit-learn's?"
K-means finds a **local** optimum that depends on the starting centroids. scikit-learn uses the smarter *k-means++* initialisation (spread-out starts) and can run several starts (`n_init`) keeping the best. Your random-rows initialisation can get stuck in a worse solution.
:::

:::reveal title="Could you choose K for KNN on the test set?"
No — that would make the test score optimistic. Use cross-validation on the training images to choose K, then evaluate once on the test images.
:::
