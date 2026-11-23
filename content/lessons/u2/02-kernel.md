This is the lesson that unblocks most people. Once you understand the **kernel**, notebooks stop being mysterious.

## Two separate things: the notebook and the kernel

When you open a `.ipynb` file in Jupyter, two different programs are involved:

<div class="diagram">
<svg viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="k-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-soft)"/></marker></defs>
  <rect x="10" y="20" width="230" height="160" rx="10" class="dg-bx"/>
  <text x="125" y="45" text-anchor="middle" class="dg-h">Notebook (frontend)</text>
  <text x="125" y="72" text-anchor="middle" class="dg-s">the .ipynb file in your browser</text>
  <text x="125" y="96" text-anchor="middle" class="dg-s">• text cells + code cells</text>
  <text x="125" y="116" text-anchor="middle" class="dg-s">• saved outputs (can be stale!)</text>
  <text x="125" y="136" text-anchor="middle" class="dg-s">• NO variables in memory</text>
  <rect x="420" y="20" width="230" height="160" rx="10" class="dg-hl"/>
  <text x="535" y="45" text-anchor="middle" class="dg-h">Kernel</text>
  <text x="535" y="72" text-anchor="middle" class="dg-s">a running Python process</text>
  <text x="535" y="96" text-anchor="middle" class="dg-s">• executes your code</text>
  <text x="535" y="116" text-anchor="middle" class="dg-s">• keeps variables in memory</text>
  <text x="535" y="136" text-anchor="middle" class="dg-s">• imports libraries</text>
  <text x="535" y="156" text-anchor="middle" class="dg-s">• runs inside one Python environment</text>
  <path d="M245 80 L415 80" class="dg-ar" marker-end="url(#k-a)"/><text x="330" y="72" text-anchor="middle" class="dg-s">“run this code”</text>
  <path d="M415 125 L245 125" class="dg-ar" marker-end="url(#k-a)"/><text x="330" y="145" text-anchor="middle" class="dg-s">results / output</text>
</svg>
</div>

When you press *Run* on a cell, the frontend sends the code to the kernel; the kernel executes it, keeps any variables in its memory, and sends the output back. The number in `[5]:` next to a cell is the **execution counter**: this cell was the 5th thing the kernel ran.

## The kernel has state

The kernel remembers everything that was run — **in the order it was run, not in the order the cells appear on the page**. Play with this simulated notebook: run the cells in different orders and watch the kernel memory.

:::viz name=kernel preset=state
Try: run cell 1, then cell 2 three times, then cell 3. The code did not change, but the result did. Then try **Restart & Run All**.
:::

So the result of a notebook depends **not only on the cells, but on which cells have already been executed**, how often, and in which order.

## The file is not the kernel

Deleting a cell removes the **code** from the file, but not the **variable** from the kernel's memory:

:::viz name=kernel preset=secret
Run cell 1, then delete it, then run the print cell: it still works! Now **Restart kernel** and run it again → `NameError`.
:::

This is how notebooks “work” for the author and fail for everybody else: the author's kernel still remembers a variable whose defining cell was deleted or edited long ago.

## Restart & Run All: the reproducibility test

:::viz name=kernel preset=order
Click the cells in the order 1 → 3 → 2: it works. Now press **Restart & Run All**: it fails, because `discount` is used (cell 2) before it is defined (cell 3).
:::

:::key title="The golden rule"
A notebook is reproducible when it runs **from a fresh kernel, top to bottom** without errors: *Kernel → Restart & Run All*. “It worked when I clicked the cells” is weak evidence.
:::

Now do it for real. The cells below run in **this page's actual kernel** (see the python status line at the top).

:::exercise id=order title="Fix the cell order"
--- task
This cell will fail with a `NameError` when run on a fresh kernel, because the code is in the wrong order. Rearrange the lines so the code works top to bottom and prints `Final price: CHF 80.00`.
--- starter
final_price = price * discount
print(f"Final price: CHF {final_price:.2f}")
price = 100
discount = 0.80
--- check
assert "Final price: CHF 80.00" in __stdout__, "The output should contain 'Final price: CHF 80.00'."
--- hint
A variable must be assigned before the line that uses it. Move `price = ...` and `discount = ...` to the top.
--- solution
price = 100
discount = 0.80
final_price = price * discount
print(f"Final price: CHF {final_price:.2f}")
:::

:::code title="Experiment: the kernel remembers"
print(final_price)
:::

That cell has no definition of `final_price` — it works only because the exercise above ran earlier **in the same kernel**. Press **restart** in the python status line at the top, then run this cell again: `NameError`.

## Where packages fit in

The kernel runs **inside one Python environment**. The packages it can import are those installed in *that* environment.

- **Installing** (`pip install pandas`) puts a package into an environment (once).
- **Importing** (`import pandas as pd`) loads an installed package into the current kernel session (every session).

“But I installed it yesterday!” → you probably installed it into a **different environment** than the one your kernel uses. Inside a notebook, prefer `%pip install ...`: this magic command installs into the kernel's own environment. Then restart the kernel.

To check which Python runs your notebook and where it looks for files:

```python
import sys, os
print(sys.executable)   # which Python (→ which environment)
print(os.getcwd())      # working directory: relative paths start here
```

:::quiz
? You saved a notebook. What is stored in the `.ipynb` file?
+ The cells' code, text and their last displayed outputs — but not the variables in memory
- All variables currently in the kernel's memory
- Only the outputs
> Saving writes code, markdown and outputs. Memory state lives only in the running kernel.

? Does restarting the kernel delete the `.ipynb` file?
- Yes
+ No — it only clears the kernel's memory
> The file and the kernel are separate.

? The cell shows `[7]` next to it. What does that mean?
- It is the 7th cell on the page
+ It was the 7th execution in this kernel session
- It ran 7 times
> The execution counter counts runs in the kernel, in time order.

? A notebook works now. Will it necessarily work after *Restart & Run All*?
- Yes, if it works now it will always work
+ No — it may depend on hidden state from cells run out of order or since deleted
> Only Restart & Run All proves it works from a clean state.

? You ran `pip install seaborn` in a terminal, but `import seaborn` fails in the notebook. Most likely cause?
+ The package was installed into a different environment than the one the kernel uses
- seaborn cannot be imported in notebooks
- You need to save the notebook first
> Check `sys.executable` in the notebook and install with `%pip install seaborn` so it goes into the kernel's environment.
:::

:::key title="Summary"
- Notebook = frontend (file). Kernel = running Python process with **memory**.
- Execution **order** matters, not page order. Deleted cells can leave ghosts in memory.
- Reproducible = works with **Restart & Run All**.
- Packages come from the kernel's environment; install ≠ import.
:::
