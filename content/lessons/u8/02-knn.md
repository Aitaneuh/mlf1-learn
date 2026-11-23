**K-nearest neighbours (KNN)** is the simplest supervised classifier imaginable: *to classify a new point, look at the K closest labelled points and let them vote.*

## How KNN works

- **Fit:** store the labelled training examples (possibly organised for faster search). That's it — **no iterative training loop**, no epochs, no weights.
- **Predict:** for a query point, find the **K nearest** training points (usually Euclidean distance) and take a **majority vote** of their labels (`predict_proba` = vote shares).

Example with K = 5: the neighbours' labels are `[3, 3, 8, 3, 5]` → predict **3** (probability 3/5).

:::viz name=knn
Click to move the “?” point. Try K = 1 and K = 25 with decision regions on.
:::

## Choosing K

| small K | large K |
|---|---|
| very local decisions | smoother decisions |
| sensitive to noise and single examples | can blur minority or local structure |

Select K fairly with **validation / cross-validation on the training data**; keep the final evaluation set out of the choice. (In the course notebook K = 5 is fixed in advance.)

:::reveal title="Should K be odd? Why or why not?"
For **two** classes, an odd K avoids ties. With more classes ties are still possible (e.g. 2–2–1 with K = 5), so an odd K is not a guarantee — implementations break ties by a rule (scikit-learn: the class that comes first in order, or distance weighting with `weights="distance"`).
:::

## K-means vs KNN

| | **K-means clustering** | **KNN classification** |
|---|---|---|
| purpose | discover groups of similar points | predict a label |
| uses training labels? | **no** (unsupervised) | **yes** (supervised) |
| meaning of K | number of **clusters** | number of **neighbours** that vote |
| training | iterative assign/update until convergence | just stores the labelled examples |
| prediction | nearest centroid → an arbitrary cluster ID | vote of K nearest examples → a class label |
| fitted representation | K centroids | the stored training set |

## What does “near” mean for images?

KNN on MNIST compares **brightness at matching pixel positions**. A 3 shifted two pixels to the right can be numerically *further* from another 3 than from an aligned 8. Size, position, slant and stroke thickness all change the pixel values. **Similarity depends on the representation**, not only on the digit's meaning.

:::exercise id=knn_scratch title="KNN prediction from scratch"
--- task
Write `knn_predict(X_train, y_train, x, k)` that returns the majority label among the `k` training points closest to `x` (Euclidean distance). Use `np.argsort` to find the nearest indices and `Counter(...).most_common(1)` for the vote.
--- setup
import numpy as np
from collections import Counter
X_train = np.array([[1, 1], [1, 2], [2, 1], [6, 6], [6, 7], [7, 6], [4, 4]])
y_train = np.array(["A", "A", "A", "B", "B", "B", "B"])
--- starter
def knn_predict(X_train, y_train, x, k):
    dists = None      # distance from x to every training point
    nearest = None    # indices of the k smallest distances
    return None

print(knn_predict(X_train, y_train, np.array([2, 2]), 3))
print(knn_predict(X_train, y_train, np.array([4, 3.5]), 1))
--- check
import numpy as np
assert knn_predict(X_train, y_train, np.array([2, 2]), 3) == "A"
assert knn_predict(X_train, y_train, np.array([4, 3.5]), 1) == "B", "with k=1 the nearest point (4,4) is B"
assert knn_predict(X_train, y_train, np.array([3, 3]), 5) == "A", "k=5 at (3,3): neighbours A,A,A,B(4,4),B → A"
--- hint
`dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))`; `nearest = np.argsort(dists)[:k]`
--- hint
`return Counter(y_train[nearest]).most_common(1)[0][0]`
--- solution
def knn_predict(X_train, y_train, x, k):
    dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))
    nearest = np.argsort(dists)[:k]
    return Counter(y_train[nearest]).most_common(1)[0][0]

print(knn_predict(X_train, y_train, np.array([2, 2]), 3))
print(knn_predict(X_train, y_train, np.array([4, 3.5]), 1))
:::

:::warn title="KNN is cheap to fit, expensive to predict"
Fitting just stores data, but each prediction compares the query with **every** training point. With 60 000 MNIST images × 784 pixels, predicting is slow — you will measure it in the next lesson. Feature **scaling** matters too, because distances mix all features.
:::

:::quiz
? What happens during `fit` of a KNN classifier?
+ It stores the labelled training examples
- It runs gradient descent for several epochs
- It computes K centroids
> No iterative training.

? K = 5, the neighbours' labels are [7, 1, 7, 1, 7]. Prediction?
= 7
> 3 votes to 2.

? Which uses labels during fitting?
- K-means
+ KNN
> KNN is supervised; K-means is not.

? Increasing K in KNN generally makes the decision boundary…
+ smoother
- more jagged
- unchanged
> More voters average out local noise.
:::

:::key title="Summary"
KNN: store examples; predict by majority vote of the K nearest. Small K = local/noisy, large K = smooth/blurry. K-means ≠ KNN: different purpose, label use and meaning of K.
:::
