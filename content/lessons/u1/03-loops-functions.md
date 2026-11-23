Training a model is a loop: predict, measure the error, update, repeat. This lesson gives you the tools to write such loops yourself.

## for loops

A `for` loop repeats the **indented** block for each item:

:::code
total = 0
for value in [3, 5, 2]:
    total = total + value
    print("added", value, "→ total is now", total)
print("done:", total)
:::

**Indentation is the syntax.** The 4 spaces tell Python which lines belong to the loop. The last `print` is not indented, so it runs once after the loop.

`range(n)` produces the numbers 0, 1, …, n−1 — perfect to repeat something n times (for example, *for each epoch*):

:::code
for epoch in range(3):
    print("epoch", epoch)
print(list(range(2, 10, 3)))   # start, stop, step
:::

## if / elif / else

:::code
consumption = 8.3
if consumption < 5:
    print("very efficient")
elif consumption < 8:
    print("normal")
else:
    print("thirsty")
:::

## List comprehensions — read them out loud

The course uses this compact form constantly:

```python
predictions = [w * x for x in x_train]
```

Read it as: *“a list of `w * x`, for every `x` in `x_train`”*. It is exactly the same as:

```python
predictions = []
for x in x_train:
    predictions.append(w * x)
```

You can add a filter at the end, and unpack tuples:

:::code
raw_train = [(13593, 99641), (5350, 44522), (8247, 65802)]
x_train = [distance / 1000 for distance, fuel in raw_train]
y_train = [fuel / 1000 for distance, fuel in raw_train]
long_trips = [x for x in x_train if x > 8]
print(x_train, y_train, long_trips)
:::

:::exercise id=errors title="Errors with a comprehension"
--- task
With the fuel data and `w = 6.0`:

1. `predictions` — a list with `w * x` for every `x` in `x_train`
2. `errors` — a list with `target - prediction` for each pair (use `zip(y_train, predictions)`)
--- setup
x_train = [13.593, 5.35, 8.247]
y_train = [99.641, 44.522, 65.802]
--- starter
w = 6.0
predictions = None
errors = None
print(predictions)
print(errors)
--- check
exp_p = [6.0 * x for x in [13.593, 5.35, 8.247]]
assert isinstance(predictions, list) and len(predictions) == 3, "predictions should be a list of 3 numbers."
assert all(abs(a - b) < 1e-9 for a, b in zip(predictions, exp_p)), f"predictions = {predictions}"
exp_e = [t - p for t, p in zip([99.641, 44.522, 65.802], exp_p)]
assert isinstance(errors, list) and all(abs(a - b) < 1e-9 for a, b in zip(errors, exp_e)), f"errors = {errors}; expected target − prediction."
--- hint
`predictions = [w * x for x in x_train]`
--- hint
`errors = [target - prediction for target, prediction in zip(y_train, predictions)]`
--- solution
w = 6.0
predictions = [w * x for x in x_train]
errors = [target - prediction for target, prediction in zip(y_train, predictions)]
print(predictions)
print(errors)
:::

## Built-in helpers you will see

`sum(list)`, `len(list)`, `min`, `max`, `round(x, 2)`, `abs(x)`, `sorted(list)`. Combined with comprehensions:

:::code
errors = [17.0, 12.4, 16.3]
mean_error = sum(errors) / len(errors)
squared = [e ** 2 for e in errors]
print(mean_error, max(squared), round(sum(squared) / len(squared), 2))
:::

## Functions: reusable recipes

A function packages code under a name. `def` defines it, the **parameters** in brackets are its inputs, and `return` gives back the result:

:::code
def predict(xs, w):
    return [w * x for x in xs]

print(predict([1, 2, 3], 10))
print(predict([13.593], 8))
:::

Important: a function only runs when it is **called** (`predict(...)`). Variables created inside it disappear afterwards; only the returned value comes out. A function without `return` returns `None` — a classic source of bugs.

:::exercise id=mse_func title="Write your first ML function: MSE"
--- task
Write a function `mse(xs, ys, w)` that returns the **mean squared error** of the model `prediction = w * x`:

1. compute the predictions (`w * x` for each x)
2. compute the squared errors `(target − prediction)²`
3. return their average (sum ÷ count)

This is the exact function from the fuel notebook.
--- starter
def mse(xs, ys, w):
    # TODO: predictions, squared errors, average
    return None

print(mse([1, 2], [2, 5], 2))   # should print 0.5
--- check
assert mse([1, 2], [2, 5], 2) == 0.5, f"mse([1,2],[2,5],2) returned {mse([1, 2], [2, 5], 2)}, expected 0.5 (errors 0 and 1 → squares 0 and 1 → mean 0.5)."
v = mse([13.593, 5.35, 8.247], [99.641, 44.522, 65.802], 6)
assert abs(v - 249.21446) < 0.01, f"On the fuel data with w=6 you get {v}; expected ≈ 249.21."
--- hint
```python
predictions = [w * x for x in xs]
squared_errors = [(y - p) ** 2 for y, p in zip(ys, predictions)]
```
--- hint
Then `return sum(squared_errors) / len(squared_errors)`.
--- solution
def mse(xs, ys, w):
    predictions = [w * x for x in xs]
    squared_errors = [(y - p) ** 2 for y, p in zip(ys, predictions)]
    return sum(squared_errors) / len(squared_errors)

print(mse([1, 2], [2, 5], 2))
:::

:::exercise id=loop_best title="Try many candidates with a loop"
--- task
Use your `mse` function to try every `w` in `candidates` on the fuel data. Store the candidate with the **lowest** MSE in `best_w`.
--- setup
x_train = [13.593, 5.35, 8.247]
y_train = [99.641, 44.522, 65.802]
--- starter
candidates = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5]
best_w = None
best_loss = float("inf")   # "infinitely large" so anything is better
for w in candidates:
    loss = None  # TODO
    # TODO: if loss is smaller than best_loss, remember w and loss
print(best_w, best_loss)
--- check
assert 'mse' in globals(), "Solve the previous exercise first (it defines `mse`)."
assert best_w == 7.5, f"best_w = {best_w}. Compute mse(x_train, y_train, w) for each candidate and keep the smallest."
--- hint
`loss = mse(x_train, y_train, w)`
--- hint
```python
if loss < best_loss:
    best_loss = loss
    best_w = w
```
--- solution
candidates = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5]
best_w = None
best_loss = float("inf")
for w in candidates:
    loss = mse(x_train, y_train, w)
    if loss < best_loss:
        best_loss = loss
        best_w = w
print(best_w, best_loss)
:::

You just did a (very crude) form of **training**: searching for the parameter with the lowest loss. Unit 4 shows a much smarter search: gradient descent.

:::quiz
? How many times does the body of `for i in range(5):` run?
= 5
> range(5) yields 0, 1, 2, 3, 4.

? What does `[x * 2 for x in [1, 2, 3] if x > 1]` produce?
- `[2, 4, 6]`
+ `[4, 6]`
- `[1, 4, 6]`
> Only x = 2 and x = 3 pass the filter; they are doubled.

? A function has no `return` statement. What does calling it give back?
- 0
+ `None`
- The last computed value
> Without return, a Python function returns None.

? In Python, what marks which lines belong to a loop body?
- Curly braces `{ }`
- The keyword `end`
+ The indentation
> Indentation is part of Python's syntax.
:::

:::key title="Summary"
- `for item in collection:` + an indented block; `range(n)` for counting.
- Comprehension `[expr for x in xs if cond]` = loop that builds a list.
- `def f(params): ... return result` — call it with `f(...)`.
:::
