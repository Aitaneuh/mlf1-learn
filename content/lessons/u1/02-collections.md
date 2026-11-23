Machine learning is about *many* observations, so we need containers that hold many values. Python's four workhorses: **list**, **tuple**, **dict** and the helper **zip**.

## Lists

A list is an ordered collection in square brackets:

:::code
distances = [13.593, 5.350, 8.247]
print(len(distances))        # how many items
print(distances[0])          # first item  (Python counts from 0!)
print(distances[-1])         # last item
distances.append(4.2)        # add at the end
distances
:::

**Indexing starts at 0.** A list of 3 items has positions 0, 1, 2. `distances[3]` would raise an `IndexError`.

### Slicing: taking a part

`list[start:stop]` takes items from `start` **up to but not including** `stop`:

:::code
nums = [10, 20, 30, 40, 50, 60]
print(nums[0:2])    # [10, 20]
print(nums[:3])     # first three
print(nums[3:])     # from position 3 to the end
print(nums[-2:])    # last two
print(nums[::2])    # every second item
:::

You will see exactly this in the course: `X_train[:20]` = first 20 images, `df[:10]` = first 10 rows, `iris.iloc[:, :4]` = all rows, first 4 columns.

:::exercise id=slice title="Slice a list"
--- task
From `scores`, create:

- `first_three` — the first three scores
- `last_two` — the last two scores
- `middle` — everything except the first and the last score
--- starter
scores = [72, 85, 90, 64, 77, 98, 81]
first_three = None
last_two = None
middle = None
print(first_three, last_two, middle)
--- check
assert first_three == [72, 85, 90], f"first_three = {first_three}"
assert last_two == [98, 81], f"last_two = {last_two}"
assert middle == [85, 90, 64, 77, 98], f"middle = {middle}"
--- hint
Negative positions count from the end: `scores[-2:]` are the last two. `scores[1:-1]` drops the first and the last.
--- solution
scores = [72, 85, 90, 64, 77, 98, 81]
first_three = scores[:3]
last_two = scores[-2:]
middle = scores[1:-1]
print(first_three, last_two, middle)
:::

## Tuples

A tuple is like a list but **cannot be changed** and uses round brackets. Very often a tuple groups the values of *one observation*:

:::code
trip = (13593, 99641)          # (distance in 1/10 km, fuel in ml)
distance, fuel = trip          # "unpacking" into two variables
print(distance, fuel)
raw_train = [(13593, 99641), (5350, 44522), (8247, 65802)]   # a list of tuples
raw_train[1]
:::

Unpacking (`a, b = pair`) is everywhere: `X_train, X_test, y_train, y_test = train_test_split(...)` unpacks **four** results at once.

## Dictionaries

A **dict** maps *keys* to *values* — like a phone book:

:::code
iris_flower = {"sepal_length": 5.1, "sepal_width": 3.5, "species": "setosa"}
print(iris_flower["species"])
iris_flower["petal_length"] = 1.4      # add a key
print(iris_flower.keys())
print("species" in iris_flower)
:::

Asking for a key that does not exist raises a `KeyError` — the same error you get from a pandas DataFrame with a wrong column name (a DataFrame behaves a lot like a dict of columns).

## zip: walking through lists in parallel

You often have features in one list and targets in another, aligned by position. `zip` pairs them up:

:::code
x_train = [13.593, 5.35, 8.247]
y_train = [99.641, 44.522, 65.802]
for x, y in zip(x_train, y_train):
    print(f"{x:.3f} × 100 km → {y:.3f} L")
:::

That is literally the first code cell of the fuel notebook. `enumerate` is a cousin that gives you the position too:

:::code
for i, x in enumerate(x_train):
    print(i, x)
:::

:::exercise id=dict title="Count species with a dict"
--- task
Count how many times each species appears in `labels`. Store the result in a dictionary `counts` like `{"setosa": 2, ...}`.

Use a `for` loop: if the species is not yet a key, start at 0, then add 1.
--- starter
labels = ["setosa", "virginica", "setosa", "versicolor", "virginica", "virginica"]
counts = {}
for label in labels:
    # TODO
    pass
print(counts)
--- check
assert counts == {"setosa": 2, "virginica": 3, "versicolor": 1}, f"counts = {counts}"
--- hint
```python
if label not in counts:
    counts[label] = 0
counts[label] += 1
```
--- solution
labels = ["setosa", "virginica", "setosa", "versicolor", "virginica", "virginica"]
counts = {}
for label in labels:
    if label not in counts:
        counts[label] = 0
    counts[label] += 1
print(counts)
:::

:::tip
This “count per class” operation is so common that pandas does it in one call: `y.value_counts()`. You will use that from Unit 5 on.
:::

:::quiz
? `a = [5, 6, 7, 8]`. What is `a[1:3]`?
- `[5, 6, 7]`
+ `[6, 7]`
- `[6, 7, 8]`
> Start at position 1 (the second item), stop *before* position 3.

? What does `x, y = (3, 9)` do?
+ Stores 3 in x and 9 in y
- Stores the tuple in both x and y
- Raises an error
> This is tuple unpacking.

? Which container would you use to look up a flower's measurement by its name, e.g. `"petal_length"`?
- list
- tuple
+ dict
> A dict maps keys (names) to values.

? `list(zip([1, 2], ["a", "b"]))` gives…
+ `[(1, 'a'), (2, 'b')]`
- `[1, 2, 'a', 'b']`
- `[(1, 2), ('a', 'b')]`
> zip pairs the items at the same position.
:::

:::key title="Summary"
- Lists `[...]` are ordered and changeable; positions start at **0**; slicing `[start:stop]` excludes `stop`.
- Tuples `(...)` group values; unpack them with `a, b = pair`.
- Dicts `{key: value}`; a missing key → `KeyError`.
- `zip` walks through aligned lists together; `enumerate` adds the position.
:::
