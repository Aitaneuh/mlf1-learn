Loops over Python lists work, but they are slow and verbose. **NumPy** lets you do maths on whole arrays at once. Every ML library (pandas, scikit-learn) is built on it.

## Arrays and vectorised maths

:::code
import numpy as np

x = np.array([13.593, 5.35, 8.247])
y = np.array([99.641, 44.522, 65.802])

predictions = 6.0 * x            # multiplies EVERY element
errors = y - predictions         # element by element
print(predictions)
print(errors)
print((errors ** 2).mean())      # MSE in one line!
:::

Compare with the list version from the last lesson: no loop, no comprehension. Operations between two arrays of the same length work **element by element**. This is called *vectorisation*.

Useful methods: `.sum()`, `.mean()`, `.std()` (standard deviation), `.min()`, `.max()`, `.argmax()` (**position** of the maximum), `.argsort()` (positions that would sort the array), and `np.sqrt`, `np.exp`, `np.log`, `np.abs`.

:::exercise id=np_metrics title="Metrics in one line each"
--- task
With the arrays `y` (targets) and `p` (predictions), compute using NumPy (no loops):

- `mae` — mean absolute error: mean of `|y − p|`
- `rmse` — root mean squared error: square root of the mean of `(y − p)²`
--- setup
import numpy as np
y = np.array([1200, 1600, 2000])
p = np.array([1100, 1450, 1800])
--- starter
mae = None
rmse = None
print(mae, rmse)
--- check
import numpy as np
assert mae is not None and abs(float(mae) - 150.0) < 1e-6, f"mae = {mae}, expected (100 + 150 + 200)/3 = 150."
assert rmse is not None and abs(float(rmse) - np.sqrt((100**2 + 150**2 + 200**2) / 3)) < 1e-6, f"rmse = {rmse}, expected ≈ 155.46."
--- hint
`np.abs(y - p).mean()` and `np.sqrt(((y - p) ** 2).mean())`
--- solution
mae = np.abs(y - p).mean()
rmse = np.sqrt(((y - p) ** 2).mean())
print(mae, rmse)
:::

## Shape: the most important attribute

Data in ML is a **table**: one row per observation, one column per feature. In NumPy that is a 2-D array, and `.shape` tells you `(rows, columns)`:

:::code
X = np.array([[45, 2.0, 300],
              [65, 3.0, 900],
              [80, 3.5, 500],
              [105, 4.5, 1200]])
print(X.shape)      # 4 apartments, 3 features
print(X[0])         # first row  = first apartment
print(X[:, 0])      # first column = all areas
print(X[1, 2])      # row 1, column 2
:::

`X[rows, columns]` — the `:` means “all”. Remember this pattern; pandas' `.iloc[:, :4]` works the same way.

:::warn title="Shapes must match"
Most errors with NumPy and scikit-learn are shape errors. When something fails, print `.shape` first. A feature table should be 2-D `(n_samples, n_features)`; a target is 1-D `(n_samples,)`.
:::

### reshape

`reshape` reorders the same numbers into a different shape. In week 6, each MNIST image is stored as a flat row of 784 pixels, and `image.reshape(28, 28)` turns it back into a 28×28 picture:

:::code
flat = np.arange(12)          # 0, 1, ..., 11
print(flat.shape)
grid = flat.reshape(3, 4)     # 3 rows, 4 columns (3*4 must equal 12)
print(grid)
print(grid.reshape(-1))       # -1 = "work it out yourself" → back to flat
:::

:::exercise id=reshape title="Reshape and select"
--- task
`pixels` contains 16 numbers (a tiny 4×4 “image”, stored flat).

1. `img` — reshape it to 4 rows × 4 columns
2. `top_row` — the first row of `img`
3. `col_means` — the mean of each **column** of `img` (hint: `img.mean(axis=0)` averages *down* the rows)
--- setup
import numpy as np
pixels = np.arange(16) * 10
--- starter
img = None
top_row = None
col_means = None
print(img)
print(top_row, col_means)
--- check
import numpy as np
assert img is not None and img.shape == (4, 4), f"img should have shape (4, 4), got {None if img is None else img.shape}."
assert np.array_equal(top_row, [0, 10, 20, 30]), f"top_row = {top_row}"
assert np.allclose(col_means, [60, 70, 80, 90]), f"col_means = {col_means}; use img.mean(axis=0)."
--- hint
`img = pixels.reshape(4, 4)`, then `img[0]`.
--- solution
img = pixels.reshape(4, 4)
top_row = img[0]
col_means = img.mean(axis=0)
print(img)
print(top_row, col_means)
:::

## Boolean masks: filtering without loops

Comparing an array gives an array of `True/False` — a **mask**. Using a mask inside `[...]` keeps only the `True` positions:

:::code
ages = np.array([24, 35, 31, 42, 29])
mask = ages >= 30
print(mask)
print(ages[mask])                 # only ages ≥ 30
print(mask.sum())                 # True counts as 1 → how many
labels = np.array([3, 3, 8, 3, 5])
predicted = np.array([3, 8, 8, 3, 3])
print("accuracy:", (labels == predicted).mean())
:::

That last line is how accuracy is computed: the fraction of positions where prediction equals label. Masks are also how pandas filters rows: `df[df["age"] >= 30]`.

:::exercise id=mask title="Accuracy with a mask"
--- task
Compute:

- `accuracy` — fraction of positions where `y_pred` equals `y_true`
- `n_threes_missed` — how many actual 3s were predicted as something else (true is 3 **and** prediction is not 3). Combine masks with `&`.
--- setup
import numpy as np
y_true = np.array([3, 3, 8, 3, 5, 3, 8, 1])
y_pred = np.array([3, 8, 8, 3, 3, 1, 8, 1])
--- starter
accuracy = None
n_threes_missed = None
print(accuracy, n_threes_missed)
--- check
assert accuracy is not None and abs(float(accuracy) - 5/8) < 1e-9, f"accuracy = {accuracy}, expected 5/8 = 0.625."
assert n_threes_missed is not None and int(n_threes_missed) == 2, f"n_threes_missed = {n_threes_missed}, expected 2."
--- hint
`(y_true == y_pred).mean()`
--- hint
`((y_true == 3) & (y_pred != 3)).sum()` — brackets around each comparison are required.
--- solution
accuracy = (y_true == y_pred).mean()
n_threes_missed = ((y_true == 3) & (y_pred != 3)).sum()
print(accuracy, n_threes_missed)
:::

:::note title="Random numbers and seeds"
`np.random.default_rng(42)` creates a random generator with **seed** 42. Same seed → same “random” numbers every run. That is why course code uses `random_state=42`: results become **reproducible**.
:::

:::quiz
? `X.shape` is `(150, 4)`. What does that mean?
+ 150 rows (observations) and 4 columns (features)
- 150 features and 4 observations
- 600 numbers in a single row
> Shape is (rows, columns).

? `a = np.array([1, 2, 3])`. What is `a * 2`?
- `[1, 2, 3, 1, 2, 3]`
+ `array([2, 4, 6])`
- an error
> NumPy multiplies element-wise. (For a *list*, `* 2` would repeat it!)

? What does `X[:, 0]` select?
- the first row
+ the first column (all rows)
- the first element only
> `:` = all rows, `0` = column 0.

? An array of 784 pixels should become a 28×28 image. Which call?
- `img.shape(28, 28)`
+ `img.reshape(28, 28)`
- `img[28, 28]`
> reshape rearranges the same values; 28 × 28 = 784.
:::

:::key title="Summary"
- NumPy arrays do element-wise maths: `y - w * x` works on whole columns.
- `.shape` = (rows, columns). `X[rows, cols]`, `:` means all.
- Masks `arr[arr > 3]` filter; `(a == b).mean()` is accuracy.
:::
