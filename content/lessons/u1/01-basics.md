The course notebooks assume you can *read* Python fluently. If lines like `y_train = [fuel / 1000 for distance, fuel in raw_train]` look like noise, this unit is for you. We go slowly and you type everything yourself.

## Variables: names for values

A **variable** is a name that points to a value. The `=` sign means *“store the value on the right under the name on the left”* — it is **not** the mathematical equality.

:::code
distance_km = 535
fuel_litres = 44.5
car = "VW Golf"
print(distance_km, fuel_litres, car)
:::

Rules for names: letters, digits and `_`, not starting with a digit, case-sensitive (`Fuel` ≠ `fuel`). By convention Python uses `snake_case`.

Because `=` is an *assignment*, this is perfectly valid and very common:

:::code
counter = 10
counter = counter + 1   # take the old value, add 1, store it again
counter += 1            # short form of the same thing
counter
:::

## Numbers and arithmetic

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+ - *` | add, subtract, multiply | `3 * 4` | `12` |
| `/` | division (always gives a float) | `7 / 2` | `3.5` |
| `//` | integer division | `7 // 2` | `3` |
| `%` | remainder (modulo) | `7 % 2` | `1` |
| `**` | power | `3 ** 2` | `9` |

Python has two number types you will meet constantly: `int` (whole numbers, `42`) and `float` (decimals, `4.2`). `type(x)` tells you the type.

:::exercise id=consumption title="Fuel consumption per 100 km"
--- task
A trip of **535 km** used **44.5 litres**. Compute the consumption in **litres per 100 km** and store it in `per_100km`.

Formula: litres ÷ (km ÷ 100).
--- starter
km = 535
litres = 44.5
per_100km = None
print(per_100km)
--- check
assert per_100km is not None, "Replace `None` with the calculation."
assert abs(per_100km - 44.5 / 5.35) < 1e-9, f"Got {per_100km}. Expected 44.5 / (535 / 100) ≈ 8.318."
--- hint
Use brackets so the division by 100 happens first: `litres / (km / 100)`.
--- solution
km = 535
litres = 44.5
per_100km = litres / (km / 100)
print(per_100km)
:::

## Strings and f-strings

Text is a **string** (`str`), written in quotes: `"Biel"` or `'Biel'`. The course notebooks print results with **f-strings** — a string with `f` in front, where `{...}` gets replaced by a value:

:::code
name = "Biel"
rent = 1712.456
print(f"Average rent in {name}: CHF {rent}")
print(f"Rounded: CHF {rent:.2f}")       # :.2f  → 2 decimals
print(f"{0.8:.1%} of trips")            # :.1%  → as percent
print(f"{'x':>6}|")                     # :>6   → right-align in 6 characters
:::

The part after `:` is a *format specifier*. You saw `{x:.3f}` and `{error:+7.3f}` (`+` forces a sign) in the fuel notebook — now you can read them.

## Booleans and comparisons

Comparisons give `True` or `False` (type `bool`):

:::code
age = 31
print(age >= 30, age == 30, age != 30)
print(age > 18 and age < 65)
print(not True)
:::

`==` compares, `=` assigns. Mixing them up is the most common beginner bug.

## Type conversion — and a trap

`int("42")` → `42`, `float("4.2")` → `4.2`, `str(42)` → `"42"`. And `bool(...)`: **every non-empty string is `True`**, even `"no"` and `"False"`. This exact trap appears in the week 2 “broken notebook”:

:::code
print(bool("yes"), bool("no"), bool("False"), bool(""))
:::

:::exercise id=fstring title="Format a result line"
--- task
Using the variables given, create a string `line` that reads **exactly**:

`Trip 3: 8.32 L/100 km`

(the consumption rounded to 2 decimals using an f-string).
--- starter
trip = 3
consumption = 8.317757
line = None
print(line)
--- check
assert line == "Trip 3: 8.32 L/100 km", f"Your line is {line!r}. Expected 'Trip 3: 8.32 L/100 km'."
--- hint
`f"Trip {trip}: ..."` — and inside the braces use the format `:.2f` for the consumption.
--- solution
trip = 3
consumption = 8.317757
line = f"Trip {trip}: {consumption:.2f} L/100 km"
print(line)
:::

:::quiz
? What does `x = x + 1` do?
- It is an error, because x cannot equal x + 1
+ It computes the old value of x plus 1 and stores the result back in x
- It compares x with x + 1
> `=` is assignment. The right side is computed first, then stored under the name on the left.

? What is `7 // 2`?
= 3
> `//` is integer (floor) division.

? What is `bool("no")`?
+ `True`
- `False`
- An error
> Any non-empty string is truthy. To test for the word "no", compare: `value == "no"`.

? Which line prints `CHF 12.50`?
- `print("CHF {price:.2f}")`
+ `print(f"CHF {price:.2f}")` with `price = 12.5`
- `print(f"CHF {price:2}")` with `price = 12.5`
> Without the `f` prefix the braces are printed literally. `:.2f` means 2 decimals.
:::

:::key title="Summary"
- `=` assigns, `==` compares.
- `int`, `float`, `str`, `bool` are the basic types; `type(x)` shows which one you have.
- f-strings: `f"{value:.2f}"`. Non-empty strings are always `True`.
:::
