In this lesson you get the **map of the territory**: why machine learning (ML) is everywhere now, how it differs from normal programming, and what a data engineer does with it. No maths yet.

## Why now? Three drivers

Smart, data-driven applications exploded because three things came together:

1. **Data availability** — the amount of data grows extremely fast: web activity (searches, clicks, scrolling), sensors (weather, traffic, wearables, factories), digitalised companies (patient records, Industry 4.0), public open data and APIs.
2. **Abundant, connected computing** — cloud computing (AWS, Azure, Google Cloud), cheap storage, smartphones and IoT devices everywhere.
3. **Advances in ML** — better algorithms (deep learning, embeddings, large language models) and free, mature frameworks (scikit-learn, PyTorch, TensorFlow), plus skilled people.

:::note title="A word about units"
A **bit** is a 0 or 1, a **byte** is 8 bits. Careful: *KB* (kilobyte, 1000 bytes), *Kb* (kilobit) and *KiB* (kibibyte, 1024 bytes) are three different things. Data volumes today are measured in zettabytes (10²¹ bytes).
:::

## Hype vs. reality

AI is in a hype cycle: record investment, huge adoption, new laws (the **EU AI Act** entered into force in 2024). At the same time: the productivity gains are uneven (the *jagged frontier*: AI helps on some tasks and hurts on others), models still **hallucinate**, and energy use is rising. Earlier hypes (the dot-com bubble, “big data”) also produced many failed projects — but also lasting infrastructure. A good engineer stays **enthusiastic but sceptical**: measure, don't believe.

## Data as a business asset

> “The world's most valuable resource is no longer oil, but data.” — *The Economist, 2017*

Companies build **data moats**: data that competitors cannot easily copy. Examples: Amazon reviews, Google Maps contributions (local guides, gamification), old CAPTCHAs that made users label house numbers and books, Tesla collecting driving data. Other businesses sell **storage and processing** (databases, search engines) or **data enhancement** through AI services (DeepL translation, cloud vision and language APIs).

## Machine learning: a new way of programming

This is the single most important idea of the lesson.

<div class="diagram">
<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg">
  <style>.dg-bx{fill:var(--bg-soft);stroke:var(--border);stroke-width:1.5}.dg-hl{fill:var(--primary-soft);stroke:var(--primary);stroke-width:2}.dg-ar{stroke:var(--text-soft);stroke-width:2;fill:none;marker-end:url(#a)}.dg-t{font-size:14px}.dg-h{font-size:15px;font-weight:700}</style>
  <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-soft)"/></marker></defs>
  <text x="20" y="22" class="dg-h">Traditional programming</text>
  <rect x="20" y="36" width="110" height="34" rx="6" class="dg-bx"/><text x="75" y="58" text-anchor="middle" class="dg-t">Data</text>
  <rect x="20" y="80" width="110" height="34" rx="6" class="dg-bx"/><text x="75" y="102" text-anchor="middle" class="dg-t">Rules (you write)</text>
  <path d="M132 53 L190 70" class="dg-ar"/><path d="M132 97 L190 80" class="dg-ar"/>
  <rect x="195" y="55" width="110" height="40" rx="8" class="dg-hl"/><text x="250" y="80" text-anchor="middle" class="dg-t">Program</text>
  <path d="M307 75 L345 75" class="dg-ar"/>
  <rect x="350" y="58" width="100" height="34" rx="6" class="dg-bx"/><text x="400" y="80" text-anchor="middle" class="dg-t">Answers</text>
  <text x="20" y="146" class="dg-h">Machine learning</text>
  <rect x="20" y="160" width="110" height="34" rx="6" class="dg-bx"/><text x="75" y="182" text-anchor="middle" class="dg-t">Data (examples)</text>
  <rect x="20" y="198" width="110" height="28" rx="6" class="dg-bx"/><text x="75" y="217" text-anchor="middle" class="dg-t">Answers (labels)</text>
  <path d="M132 177 L190 190" class="dg-ar"/><path d="M132 212 L190 200" class="dg-ar"/>
  <rect x="195" y="175" width="110" height="40" rx="8" class="dg-hl"/><text x="250" y="200" text-anchor="middle" class="dg-t">Training</text>
  <path d="M307 195 L345 195" class="dg-ar"/>
  <rect x="350" y="178" width="110" height="34" rx="6" class="dg-hl"/><text x="405" y="200" text-anchor="middle" class="dg-t">Learned model</text>
  <path d="M462 195 L520 195" class="dg-ar"/><text x="490" y="186" text-anchor="middle" class="dg-t" style="font-size:12px">+ new data</text>
  <rect x="525" y="178" width="120" height="34" rx="6" class="dg-bx"/><text x="585" y="200" text-anchor="middle" class="dg-t">Predictions</text>
</svg>
</div>

- **Traditional programming:** you write explicit rules (`IF area > 70 AND city = Biel THEN rent = ...`). Works when you *know* the rules.
- **Machine learning:** you give **examples** with the correct answers, and a training algorithm **learns** the rules (a *model*). The model is then reused on new data to make predictions.

ML wins when there are too many interacting factors, the rules are unknown, the world changes, or exceptions are common — think spam filters, translation, image recognition. A striking consequence (François Chollet): user behaviour and feedback become a kind of programming, because new data changes how the system behaves.

ML systems also **create data**: predictions, classifications and models become inputs to other systems. Data no longer flows one-way from system A to B.

:::quiz
? Which situation is the best fit for machine learning rather than hand-written rules?
- Computing VAT (8.1 %) on an invoice
+ Recognising whether a photo shows a cat or a dog
- Sorting a list of names alphabetically
> VAT and sorting have exact, known rules. Recognising cats in photos involves countless interacting pixel patterns nobody can write down — a classic ML problem.

? In machine learning, what does the training algorithm produce?
- The data
- The labels
+ A model that can make predictions on new data
> Data + known answers go in; a learned model comes out. That model is then applied to new examples.
:::

## What is a data engineer?

Three roles often get mixed up:

| Role | Focus |
|---|---|
| **Data engineer** | Builds the pipelines and systems that collect, store, move and serve data — and integrates ML into real applications |
| **Data scientist** | Analyses data, builds and evaluates models, communicates insights |
| **ML engineer** | Brings models into production: training pipelines, deployment, monitoring |

Demand for data engineers is very high (in job postings it clearly exceeds demand for data scientists). Their typical work: building smart applications and data pipelines, **evaluating and integrating third-party solutions** (e.g. a cloud AI API), and managing these projects. The novelty is the tight integration of ML into classic software stacks — so a data engineer must understand **how ML works and how to evaluate it**. That is exactly what this course teaches.

The building blocks of the field:

- **Distributed & connected computing** — processing data across hundreds of machines (scalability).
- **Data management** — integrating data from many sources; ETL (*Extract, Transform, Load*) can take ~80 % of the effort. Challenges: error handling, reliability, security, flexibility.
- **Data storage** — choosing data structures for access patterns (inverted indices for search, nearest-neighbour structures for recommendations). **Latency** (time to answer one request) ≠ **throughput** (requests handled per second).
- **Machine learning** — training, testing, evaluating, defining requirements, understanding where the data comes from.

## Why ML in production is hard

Building a demo is easy; building a reliable product is not (Facebook's assistant “M” was shut down; demos of cloud APIs look perfect on their own examples). Peter Norvig listed what ML still lacks compared with normal software engineering:

- **Debuggability** — finding why the system behaves differently
- **Interpretability** — understanding what it does and why
- **Maintainability** — changing it without breaking something unexpectedly
- **Robustness** — sensible behaviour outside the common cases
- **Testability** — checking expected behaviour and regressions

:::warn title="Evaluate, don't trust"
In the week 1 exercise, you test a cloud language API on your own texts and compute **precision** = correct results ÷ all results returned. On the vendor's demo text it looks perfect; on texts from other domains it may not. You will meet precision again in Unit 7 — it is one of the most important ideas in the course.
:::

:::exercise id=precision title="Compute a precision"
--- task
You sent 4 short texts to an entity-recognition API. It returned **12 entities** in total; you checked them by hand and **9 were correct**.

Store the precision (a number between 0 and 1) in a variable `precision`.
--- starter
returned = 12
correct = 9
precision = None
--- check
assert precision is not None, "Replace `None` with a calculation."
assert abs(precision - 0.75) < 1e-9, f"precision is {precision}, expected 9 / 12 = 0.75. Precision = correct results / all results returned."
--- hint
Precision = correct results ÷ total results returned. Division in Python is `/`.
--- solution
returned = 12
correct = 9
precision = correct / returned
:::

:::key title="Summary"
- Three drivers: **data**, **computing power**, **better algorithms/frameworks**.
- ML = learn rules from **examples + answers**, instead of writing rules by hand.
- Data engineers build data systems **and integrate and evaluate ML** — evaluation is a core skill.
:::
