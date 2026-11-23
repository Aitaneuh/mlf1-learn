The **week 6 notebook**: on the same MNIST images, fit **K-means without labels** and **KNN with labels**, and compare them *fairly*. (To run fast in the browser we use a fixed sample: 3000 training and 600 evaluation images, instead of the notebook's 6000/1000.)

## The data

MNIST: 70 000 grayscale images of handwritten digits, 28 × 28 pixels → **784 features**, each 0 (black) to 255 (white). Original split: 60 000 training / 10 000 test. Our file `data/mnist_small.npz` keeps that boundary: training images come from the original training part, evaluation images from the original test part.

:::exercise id=m_load title="Load and scale"
--- task
Load the arrays and scale the pixels to 0–1 by dividing by 255 (as `float32`). Then print the shapes.

Why is scaling by 255 safe to do before splitting? 255 is a **known** maximum, not a statistic computed from the data — no information leaks from test to training.
--- starter
import numpy as np
d = np.load("data/mnist_small.npz")
X_train = None
X_test = None
y_train, y_test = d["y_train"], d["y_test"]
print(X_train.shape, X_test.shape, X_train.min(), X_train.max())
--- check
assert X_train.shape == (3000, 784) and X_test.shape == (600, 784)
assert abs(float(X_train.max()) - 1.0) < 1e-6 and float(X_train.min()) == 0.0, "divide by 255"
--- solution
import numpy as np
d = np.load("data/mnist_small.npz")
X_train = d["X_train"].astype(np.float32) / 255.0
X_test = d["X_test"].astype(np.float32) / 255.0
y_train, y_test = d["y_train"], d["y_test"]
print(X_train.shape, X_test.shape, X_train.min(), X_train.max())
:::

## Look before fitting

:::exercise id=m_show title="Show 20 images (without labels)"
--- task
Plot the first 20 training images in 2 rows of 10. Each row of `X_train` is flat (784 values): reshape it to 28 × 28 for `imshow`.
--- starter
import matplotlib.pyplot as plt
fig, axes = plt.subplots(2, 10, figsize=(12, 2.8))
for image, ax in zip(X_train[:20], axes.ravel()):
    image_2d = None  # TODO
    ax.imshow(image_2d, cmap="gray", vmin=0, vmax=1)
    ax.axis("off")
plt.show()
--- check
assert True
--- solution
import matplotlib.pyplot as plt
fig, axes = plt.subplots(2, 10, figsize=(12, 2.8))
for image, ax in zip(X_train[:20], axes.ravel()):
    image_2d = image.reshape(28, 28)
    ax.imshow(image_2d, cmap="gray", vmin=0, vmax=1)
    ax.axis("off")
plt.show()
:::

Compare size, position, slant and stroke thickness. Our models compare brightness **at matching pixel positions** — two images of the same digit can differ a lot numerically.

## Fit an unsupervised model

`MiniBatchKMeans` approximates K-means using small batches (faster). `fit(X_train)` — **never pass y**. Ten clusters is a teaching choice informed by knowing there are ten digits; it is not proof that ten semantic groups exist.

:::exercise id=m_km title="Fit K-means, inertia and silhouette"
--- task
Fit `clusterer = MiniBatchKMeans(n_clusters=10, n_init=10, batch_size=256, random_state=42)` on `X_train` **only**. Compute `train_clusters`, `test_clusters` (predict), and `sil` = silhouette score on a 500-row sample (`silhouette_score(X_train, train_clusters, sample_size=500, random_state=42)`).
--- starter
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics import silhouette_score
clusterer = MiniBatchKMeans(n_clusters=10, n_init=10, batch_size=256, random_state=42)
# TODO: fit (no labels!)
train_clusters = None
test_clusters = None
sil = None
print("inertia:", clusterer.inertia_, "silhouette:", sil)
--- check
assert hasattr(clusterer, "cluster_centers_") and clusterer.cluster_centers_.shape == (10, 784), "fit the clusterer on X_train"
assert len(train_clusters) == 3000 and len(test_clusters) == 600
assert -1 < sil < 1
--- solution
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics import silhouette_score
clusterer = MiniBatchKMeans(n_clusters=10, n_init=10, batch_size=256, random_state=42)
clusterer.fit(X_train)
train_clusters = clusterer.predict(X_train)
test_clusters = clusterer.predict(X_test)
sil = silhouette_score(X_train, train_clusters, sample_size=500, random_state=42)
print("inertia:", clusterer.inertia_, "silhouette:", sil)
:::

The silhouette is low (≈ 0.05–0.1): in 784-dimensional pixel space the groups overlap heavily.

## Inspect the centroids

:::code title="Each centroid is a mean image"
fig, axes = plt.subplots(2, 5, figsize=(9, 4))
for i, ax in enumerate(axes.ravel()):
    ax.imshow(clusterer.cluster_centers_[i].reshape(28, 28), cmap="gray", vmin=0, vmax=1)
    ax.set_title(f"Cluster {i}")
    ax.axis("off")
plt.show()
:::

A centroid is an *average* of many images — it looks blurred and is not necessarily an observed image. Cluster 7 is **not** digit 7. Some digits split into several styles (e.g. slanted vs upright 1s); some different digits merge (4 and 9 look alike).

## Reveal labels — only now

:::exercise id=m_ari title="Heatmap and ARI"
--- task
1. `table` — `pd.crosstab` of training clusters (rows) vs true digits (columns)
2. `ari` — `adjusted_rand_score(y_test, test_clusters)`
3. `purest` — the cluster ID whose most frequent digit makes up the **largest share** of that cluster
--- starter
import pandas as pd
from sklearn.metrics import adjusted_rand_score
table = None
ari = None
purest = None
display(table)
print("ARI:", ari, "purest cluster:", purest)
--- check
import numpy as np
assert table.shape == (10, 10), "crosstab of clusters x digits"
assert abs(ari - adjusted_rand_score(y_test, test_clusters)) < 1e-12
share = table.max(axis=1) / table.sum(axis=1)
assert purest == share.idxmax(), f"purest = {purest}, expected {share.idxmax()}"
--- hint
`table = pd.crosstab(pd.Series(train_clusters, name="cluster"), pd.Series(y_train, name="digit"))`
--- hint
Share of the most frequent digit per cluster: `table.max(axis=1) / table.sum(axis=1)`; then `.idxmax()`.
--- solution
import pandas as pd
from sklearn.metrics import adjusted_rand_score
table = pd.crosstab(pd.Series(train_clusters, name="cluster"), pd.Series(y_train, name="digit"))
ari = adjusted_rand_score(y_test, test_clusters)
purest = (table.max(axis=1) / table.sum(axis=1)).idxmax()
display(table)
print("ARI:", ari, "purest cluster:", purest)
plt.imshow(table.values, cmap="Blues"); plt.xlabel("true digit"); plt.ylabel("cluster"); plt.colorbar(); plt.show()
:::

Read your heatmap: one cluster dominated by one digit, a mixed cluster, a digit spread across several clusters. ARI (≈ 0.3–0.4) says “better than chance, far from the labels” — and it is **not** an accuracy.

## A supervised benchmark: KNN

:::exercise id=m_knn title="KNN with labels, timed"
--- task
Fit `KNeighborsClassifier(n_neighbors=5, weights="uniform")` on `X_train` **and** `y_train`. Time fit and predict with `perf_counter`. Store `knn_accuracy` on the test set and `dummy_accuracy` of a most-frequent dummy.
--- starter
from time import perf_counter
from sklearn.neighbors import KNeighborsClassifier
from sklearn.dummy import DummyClassifier
knn = KNeighborsClassifier(n_neighbors=5, weights="uniform")
start = perf_counter()
# TODO fit
fit_s = perf_counter() - start
start = perf_counter()
knn_predictions = None  # TODO predict
predict_s = perf_counter() - start
knn_accuracy = None
dummy_accuracy = None
print(f"KNN {knn_accuracy:.3f} vs dummy {dummy_accuracy:.3f} | fit {fit_s:.3f}s, predict {predict_s:.3f}s")
--- check
assert knn_accuracy > 0.85, f"knn_accuracy = {knn_accuracy}"
assert dummy_accuracy < 0.2, f"dummy_accuracy = {dummy_accuracy}"
--- solution
from time import perf_counter
from sklearn.neighbors import KNeighborsClassifier
from sklearn.dummy import DummyClassifier
knn = KNeighborsClassifier(n_neighbors=5, weights="uniform")
start = perf_counter()
knn.fit(X_train, y_train)
fit_s = perf_counter() - start
start = perf_counter()
knn_predictions = knn.predict(X_test)
predict_s = perf_counter() - start
knn_accuracy = (knn_predictions == y_test).mean()
dummy_accuracy = DummyClassifier(strategy="most_frequent").fit(X_train, y_train).score(X_test, y_test)
print(f"KNN {knn_accuracy:.3f} vs dummy {dummy_accuracy:.3f} | fit {fit_s:.3f}s, predict {predict_s:.3f}s")
:::

Fitting is nearly instant; predicting takes much longer — KNN does its work at prediction time.

## Optional: clusters → digit names (label-assisted)

Give each cluster the **majority training digit** of its members, then apply that fixed mapping to the evaluation clusters. This uses labels, so it is a **label-assisted cluster classifier**, not unsupervised accuracy. Never build the mapping from test labels!

:::code
majority = np.bincount(y_train, minlength=10).argmax()
cluster_to_digit = {c: (np.bincount(y_train[train_clusters == c], minlength=10).argmax() if (train_clusters == c).any() else majority) for c in range(10)}
mapped = np.array([cluster_to_digit[c] for c in test_clusters])
print("mapping:", cluster_to_digit)
print("label-assisted cluster classifier accuracy:", (mapped == y_test).mean())
:::

## Report two separate tables

| Clustering (no labels in fit) | value |
|---|---|
| training inertia | from `clusterer.inertia_` |
| training silhouette (500 sample) | `sil` |
| evaluation ARI | `ari` |

| Classification (labels in fit) | value |
|---|---|
| KNN accuracy | `knn_accuracy` |
| dummy accuracy | `dummy_accuracy` |
| fit / predict seconds | `fit_s`, `predict_s` |

**Never rank an ARI against an accuracy** as if they were the same metric. This comparison is about *learning settings* (with vs without labels), not two models solving the same objective.

:::quiz title="Exit ticket"
? When did K-means see the labels?
+ Never during fitting — only afterwards, for the external check
- During fitting
> Labels used after fitting do not make the fit supervised.

? Why might good clusters disagree with digits?
+ K-means groups by pixel similarity; styles of one digit can differ more than two different digits
- Because K-means has a bug
> Pixel similarity ≠ semantic class.

? Why is “cluster 3 contains mostly 3s” a lucky coincidence at best?
+ Cluster IDs are arbitrary names assigned by the algorithm
- Because K-means sorts clusters by digit
:::
