“It worked last week!” — “It works on my machine!” Every programmer has said this. This lesson explains **why** the same code can behave differently, and which tools make results reproducible.

## Code never runs alone

Your Python notebook sits on top of a whole **stack** of layers. Each one can differ between two machines:

<div class="diagram">
<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg">
  <rect x="120" y="10" width="400" height="36" rx="7" class="dg-hl"/><text x="320" y="33" text-anchor="middle" class="dg-t" style="font-weight:700">Your code / notebook</text>
  <rect x="120" y="52" width="400" height="36" rx="7" class="dg-bx"/><text x="320" y="75" text-anchor="middle" class="dg-t">Python packages (numpy 2.2, pandas 2.3, scikit-learn 1.7 …)</text>
  <rect x="120" y="94" width="400" height="36" rx="7" class="dg-bx"/><text x="320" y="117" text-anchor="middle" class="dg-t">Python interpreter (3.10? 3.12?)</text>
  <rect x="120" y="136" width="400" height="36" rx="7" class="dg-bx"/><text x="320" y="159" text-anchor="middle" class="dg-t">System libraries (C libraries, drivers, CUDA …)</text>
  <rect x="120" y="178" width="400" height="36" rx="7" class="dg-bx"/><text x="320" y="201" text-anchor="middle" class="dg-t">Operating system (Windows, macOS, Linux)</text>
  <rect x="120" y="220" width="400" height="36" rx="7" class="dg-bx"/><text x="320" y="243" text-anchor="middle" class="dg-t">Hardware (CPU, GPU, RAM)</text>
  <rect x="120" y="262" width="400" height="32" rx="7" class="dg-warn"/><text x="320" y="283" text-anchor="middle" class="dg-t">+ external things: working directory, files, network services, data</text>
  <text x="20" y="70" class="dg-s dg-soft">venv / Conda</text><path d="M100 54 L100 128" style="stroke:var(--c3);stroke-width:4"/>
  <text x="535" y="160" class="dg-s dg-soft">Docker</text><path d="M528 54 L528 210" style="stroke:var(--c2);stroke-width:4"/>
  <text x="575" y="245" class="dg-s dg-soft">VM</text><path d="M568 54 L568 252" style="stroke:var(--c4);stroke-width:4"/>
</svg>
</div>

How can *exactly* the same code give different results? A different Python version, a different package version (functions get renamed or change defaults), a different **working directory** (relative file paths break), a missing OS library, a different operating system… Same code + different environment = potentially different result.

## The dependency problem

Project A needs `pandas 1.5`, project B needs `pandas 2.3`. If both use the same global Python installation, one of them breaks. The fix is **isolation**.

## Level 1: Python environments (venv, Conda)

A **virtual environment** is a separate folder with its own Python and its own packages. Each project gets one:

```bash
python -m venv .venv            # create
source .venv/bin/activate       # activate (Windows: .venv\Scripts\activate)
pip install pandas==2.3.1       # installs only into this environment
pip freeze > requirements.txt   # write down exact versions
```

But a Python environment only isolates the **top layers** (interpreter + packages). It does not capture system libraries, the OS or the hardware.

## Level 2: Virtual machines (VMs)

A **virtual machine** is a software computer with its **own operating system**, running on top of a physical machine. The hosts can differ, the environment inside stays the same.

Setting up a VM by hand is slow and error-prone. Two tools automate it:

- **Packer** *builds* reusable machine **images** automatically.
- **Vagrant** *creates, starts, stops and manages* development VMs from those images (`vagrant up`).

## Level 3: Containers (Docker) and orchestration (Kubernetes)

A **container** packages an **application together with the software it needs** (runtime, libraries, config) — but shares the host's OS kernel, so it is much lighter than a VM.

> **VMs reproduce a machine. Containers package an application environment.**

A `Dockerfile` *describes* the environment; anyone can rebuild it identically. (This very website runs in a Docker container described by a 15-line Dockerfile!)

When one container is not enough — you have 50 containers on several machines — **Kubernetes** manages them: **deploy, scale, connect, recover** (restart crashed containers automatically).

## Different tools, different problems

| Problem | Tool |
|---|---|
| Two projects need different package versions | **venv / Conda** |
| Every developer should start the same development VM | **Vagrant** |
| A reusable VM image should be built automatically | **Packer** |
| An application and its runtime should be packaged together | **Docker** |
| Many containers must be deployed and recovered across machines | **Kubernetes** |

They are not alternatives to each other — they work at **different levels** and are often combined.

:::key title="Reproducibility"
Reproducibility comes from **describing** environments (requirements.txt, Dockerfile, Vagrantfile), not from manually recreating them. Test: *could someone else recreate your environment without knowing how your laptop is configured?*
:::

## For this course: BFH JupyterHub

| | BFH JupyterHub | Local Jupyter | VS Code / PyCharm | Google Colab |
|---|---|---|---|---|
| Setup | none | required | required | none |
| Runs on | BFH server | your computer | your computer | Google cloud |
| Control | low | high | high | medium |

The course uses **BFH JupyterHub**: same environment for everybody, datasets pre-installed (`~/bfh-datasets/bti1041-mlf1/`), no installation problems. You may work locally, but then your package versions may differ.

:::note title="And this website?"
The Python here runs in your browser (Pyodide). Course datasets are available under `data/` — and also under the JupyterHub path `bfh-datasets/bti1041-mlf1/`, so you can paste code from the course notebooks. Package versions may differ slightly from JupyterHub.
:::

:::quiz
? Two projects on your laptop need different versions of pandas. What is the simplest fix?
+ A separate virtual environment (venv/Conda) per project
- A Kubernetes cluster
- Reinstalling the operating system
> Python environments isolate the interpreter and packages per project — exactly this problem.

? What does a Python virtual environment NOT isolate?
- The installed packages
- The Python version
+ The operating system and system libraries
> It isolates only the upper layers of the stack.

? Which sentence is correct?
+ A VM reproduces a whole machine with its own OS; a container packages an application with its dependencies and shares the host kernel
- A container contains a full operating system; a VM only contains Python
- VMs and containers are the same thing
> Containers are lighter because they share the host's OS kernel.

? Fifty containers must be deployed across several servers and restarted automatically when they crash. Which tool?
- Packer
- Vagrant
+ Kubernetes
> Kubernetes orchestrates containers: deploy, scale, connect, recover.

? Which tool builds reusable VM images automatically?
+ Packer
- Vagrant
- venv
> Packer builds images; Vagrant manages VMs created from them.
:::

:::exercise id=envreport title="Collect an environment report"
--- task
When a notebook behaves differently somewhere else, the first step is to **collect evidence** about the environment. Run this diagnostic code (it is the one from the course notebook). Then set `python_version` to the version string it prints (e.g. `"3.13.2"`) — get it from `sys.version.split()[0]`, do not type it by hand.
--- starter
import os, platform, sys
print("Python executable:", sys.executable)
print("Python version:   ", sys.version.split()[0])
print("Working directory:", os.getcwd())
print("Operating system: ", platform.system(), platform.release())

python_version = None
--- check
import sys
assert python_version == sys.version.split()[0], f"python_version is {python_version!r}; use sys.version.split()[0]."
--- hint
`python_version = sys.version.split()[0]`
--- solution
import os, platform, sys
print("Python executable:", sys.executable)
print("Python version:   ", sys.version.split()[0])
print("Working directory:", os.getcwd())
print("Operating system: ", platform.system(), platform.release())

python_version = sys.version.split()[0]
:::

Notice the operating system shows `Emscripten` — this Python runs inside your browser, not on BFH's server. Same code, different environment!
