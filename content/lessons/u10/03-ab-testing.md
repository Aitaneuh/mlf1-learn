How do we compare two applications **fairly**? In week 8 the class took part in an A/B test of two diagramming tools (Excalidraw and diagrams.net). This lesson explains the design behind it.

## A tempting but unfair comparison

| | Application A | Application B |
|---|---|---|
| participants | experienced users | beginners |
| tasks | simple invoices | complex invoices |
| avg. completion time | **3 min** | 6 min |

Is A faster? We cannot tell! Experience and task difficulty differ between the groups — either could explain the gap.

## A/B testing

An **A/B test** is a **controlled experiment** comparing two alternatives on **predefined criteria**. Participants are assigned to conditions and their results compared.

## Between-subjects vs within-subjects

- **Between-subjects:** each participant uses **only one** application.
- **Within-subjects:** each participant uses **both** applications.

| Criterion | Between-subjects | Within-subjects |
|---|---|---|
| participants | different users test A or B | same users test both |
| individual differences | may affect results | better controlled |
| learning effects | avoided across applications | possible → **counterbalance the order** |
| participants needed | generally more | generally fewer |
| time per participant | shorter | longer |

The class experiment was **within-subjects with counterbalancing**: group 1 used Excalidraw then diagrams.net, group 2 the reverse — each doing Task A (exam registration flowchart) and Task B (discount eligibility flowchart) with each tool, under a 10-minute limit, with a feedback form after each task and a SUS questionnaire per tool.

## What we measure: variables

- **Independent variable** — what we deliberately vary and want to compare: *the application (A or B)*.
- **Dependent variable** — what we measure: *task completion time, success, SUS…*
- **Control variables** — what we keep comparable: *user experience, task difficulty, instructions, testing conditions*.

Measure both:

| Objective (observed) | Subjective (experienced) |
|---|---|
| completion time, success rate, number of errors / corrections, output accuracy | perceived usability (SUS), perceived difficulty, preference, confidence, satisfaction |

An application can be faster yet less preferred — that's why both are collected.

## Designing a fair experiment

| Potential bias | How to reduce it |
|---|---|
| participant experience | **randomly assign** participants to groups |
| task difficulty | same or equivalent tasks |
| learning effects | **counterbalance** the order of applications |
| different instructions | standardised instructions |
| unequal assistance or time | same rules and time limits for all |

Key principle: keep everything else comparable, so that observed differences can be attributed to the applications.

:::exercise id=assign title="Random, counterbalanced assignment"
--- task
Assign the 12 `participants` randomly to two order groups of equal size using `rng.permutation`: the first 6 of the shuffled list get order `("A", "B")`, the rest `("B", "A")`. Store a dict `orders = {name: order}`.

Then count `first_A` — how many participants use A first (should be 6).
--- setup
import numpy as np
participants = [f"P{i:02d}" for i in range(1, 13)]
rng = np.random.default_rng(7)
--- starter
shuffled = None
orders = {}
first_A = None
print(orders, first_A)
--- check
assert len(orders) == 12 and set(orders) == set(participants), "every participant needs an order"
assert sum(1 for o in orders.values() if o == ("A", "B")) == 6 and first_A == 6, "6 per order group"
--- hint
`shuffled = rng.permutation(participants)`; loop with `enumerate(shuffled)`: `orders[p] = ("A", "B") if i < 6 else ("B", "A")`.
--- solution
shuffled = rng.permutation(participants)
orders = {}
for i, p in enumerate(shuffled):
    orders[str(p)] = ("A", "B") if i < 6 else ("B", "A")
first_A = sum(1 for o in orders.values() if o[0] == "A")
print(orders, first_A)
:::

:::quiz
? In an A/B test comparing two apps by completion time, what is the dependent variable?
- the application
+ the completion time
- the participants' experience
> Dependent = measured outcome.

? Each participant uses both tools; half start with A, half with B. This is…
+ a within-subjects design with counterbalancing
- a between-subjects design
> Counterbalancing spreads the order/learning effect over both tools.

? Why randomly assign participants to groups?
+ So that differences between people (e.g. experience) are spread evenly and not confounded with the condition
- To make the experiment shorter
> Randomisation protects against systematic group differences.

? A major disadvantage of within-subjects designs?
+ Learning / order effects, since participants do similar tasks twice
- They need more participants
> Counterbalancing mitigates it.
:::

:::key title="Summary"
A/B test = controlled comparison. IV = what you vary, DV = what you measure, control variables = what you keep equal. Between vs within subjects; randomise; counterbalance; standardise instructions and time.
:::
