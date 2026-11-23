Welcome! This site turns the **Machine Learning Foundations 1** course into a step-by-step path. Instead of reading slides, you **learn by doing**: every idea comes with a short explanation, often an interactive graphic, and a small task you solve yourself.

## How a unit is built

Each unit matches one or two course weeks (see the purple *Week* badge) and always has the same rhythm:

| Step | What you do | Why |
|---|---|---|
| 📘 **Lessons** | Read short explanations, play with graphics, answer quick quiz questions, solve Python exercises | Understand one idea at a time |
| 🎯 **Exam** | 8–15 questions, pass mark 70 % | Proves you are ready — it **unlocks the next unit** |
| 🛠️ **Project** | A bigger practical task with several steps | Turns knowledge into skill (optional, but strongly recommended) |

:::key
Units build on each other. If you were lost in the course since week 2, **do not skip** — the problem is usually one missing building block (often Python itself, or what a “kernel” is). This path fills those gaps in order.
:::

## Python runs right here in your browser

You do not need to install anything. Code cells on this site run a real Python (with NumPy, pandas, matplotlib and scikit-learn) **inside your browser**. The first time, it needs ~10–20 seconds to download.

Try it: press **▶ Run** (or `Shift+Enter` inside the editor).

:::code
print("Hello, machine learning!")
2 + 3
:::

Two things to notice — they are exactly like a Jupyter notebook:

1. `print(...)` writes text to the output.
2. If the **last line** of a cell is a value (here `2 + 3`), the cell shows that value automatically.

Now change the code (for example, `print("Hello", 2 * 21)`) and run it again. You cannot break anything: **↺ Original** restores the code.

## Exercises check your answer

An **exercise** has a task, an editor with some starter code and a **✓ Check answer** button. A hidden checker tests your result and tells you what is wrong. If you are stuck, use **💡 Hint**; as a last resort, **Show solution**.

:::exercise id=first title="Your very first exercise"
--- task
Create a variable called `answer` that contains the number **42**.
--- starter
# Replace None with the number 42
answer = None
--- check
assert answer is not None, "`answer` is still `None` — replace `None` with `42`."
assert answer == 42, f"`answer` is {answer!r}, but it should be 42."
--- hint
In Python, `=` stores a value in a variable: `name = value`.
--- solution
answer = 42
:::

## The kernel bar

At the top of pages with code you see the **Python kernel** bar. Just like in Jupyter (you will learn this properly in Unit 2):

- All code cells **on the same page share their variables** — a variable created in one cell exists in the next.
- **⟲ Restart kernel** forgets all variables of the page.
- **■ Stop** force-stops Python if your code runs forever (e.g. an endless loop).

:::code title="Run this after the exercise above — the variable still exists"
print("answer is", answer)
:::

## Your progress is saved

Everything is stored on your server: completed lessons, exam scores, even the code you typed in exercises. You can continue on another device by logging in.

At the bottom of each lesson you find **Mark as complete**. In strict mode (the default), the next step unlocks only once the previous one is done. If you need to jump to the current course week, turn on **free navigation** in ⚙ settings.

:::quiz
? What unlocks the next unit?
- Completing the project
+ Passing the unit exam (and finishing its lessons)
- Reading all the slides of the course
> Each unit ends with a short exam. Passing it (70 %) completes the unit and unlocks the next one. Projects are optional but highly recommended.

? A cell contains two lines: `x = 5` and then `x * 2`. What does the cell display?
- Nothing, because there is no `print`
+ `10`
- `x * 2`
> When the last line of a cell is an expression, the notebook displays its value — here `10`.
:::

:::tip title="How to use this site well"
- Do the exercises **before** looking at hints. Struggling for a few minutes is where learning happens.
- Use the **Glossary** (top menu) whenever a word sounds unfamiliar.
- After each course week, come back: new material is added here.
:::
