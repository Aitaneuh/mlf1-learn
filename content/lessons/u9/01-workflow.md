You now know several models. Week 7 zooms out: **how does an ML project actually run**, and why is a good model not enough?

## Five core process steps

<div class="diagram">
<svg viewBox="0 0 700 170" xmlns="http://www.w3.org/2000/svg">
  <defs><marker id="w-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--text-soft)"/></marker></defs>
  <rect x="5" y="40" width="120" height="56" rx="9" class="dg-hl"/><text x="65" y="63" text-anchor="middle" class="dg-t">1 · Create</text><text x="65" y="82" text-anchor="middle" class="dg-s">training material</text>
  <rect x="145" y="40" width="120" height="56" rx="9" class="dg-hl"/><text x="205" y="63" text-anchor="middle" class="dg-t">2 · Provision</text><text x="205" y="82" text-anchor="middle" class="dg-s">training set</text>
  <rect x="285" y="40" width="120" height="56" rx="9" class="dg-hl"/><text x="345" y="63" text-anchor="middle" class="dg-t">3 · Train</text><text x="345" y="82" text-anchor="middle" class="dg-s">model</text>
  <rect x="425" y="40" width="120" height="56" rx="9" class="dg-hl"/><text x="485" y="63" text-anchor="middle" class="dg-t">4 · Evaluate</text><text x="485" y="82" text-anchor="middle" class="dg-s">model</text>
  <rect x="565" y="40" width="130" height="56" rx="9" class="dg-warn"/><text x="630" y="63" text-anchor="middle" class="dg-t">5 · Adjust</text><text x="630" y="82" text-anchor="middle" class="dg-s">and optimise</text>
  <path d="M125 68 L143 68" class="dg-ar" marker-end="url(#w-a)"/><path d="M265 68 L283 68" class="dg-ar" marker-end="url(#w-a)"/><path d="M405 68 L423 68" class="dg-ar" marker-end="url(#w-a)"/><path d="M545 68 L563 68" class="dg-ar" marker-end="url(#w-a)"/>
  <path d="M630 98 C630 150, 65 150, 65 100" class="dg-ar" marker-end="url(#w-a)" style="stroke-dasharray:5 4"/>
  <text x="350" y="148" text-anchor="middle" class="dg-s dg-soft">iterate: investigate mistakes, improve data, features or model</text>
</svg>
</div>

| Step | Typical work (digit recognition example) |
|---|---|
| **1 Create training material** | collect handwritten digits; **annotate** them with labels (Unit 11) |
| **2 Provision the training set** | resize/normalise images (e.g. 28×28), check labels and data quality, split into **training / validation / test** |
| **3 Train the model** | logistic regression, decision tree, k-NN, … |
| **4 Evaluate the model** | accuracy, precision, recall, F1, confusion matrix |
| **5 Adjust and optimise** | investigate common mistakes, improve the solution — then loop back |

Look back: the fuel notebook covered 2–4, Iris 2–4, Pendigits added proper model selection in 4–5, MNIST compared settings in 3–4.

## The workflow in context

The model is only one piece. The **trained model** lives inside an **application** (user space) that people use, and the application serves a **business process**. Data flows from the business process into training material, and the model's outputs flow back into the process.

## Is a good model enough?

Your digit recogniser reaches **98 % accuracy**. Is the application ready for a logistics company that wants to read handwritten parcel codes?

| Level | Question |
|---|---|
| **Model** | Will it correctly recognise *this company's* handwriting? (98 % on MNIST ≠ 98 % on their parcels) |
| **Application** | Can employees efficiently verify and correct the mistakes? |
| **Business** | Does it actually save time and reduce costs? |

98 % of 10 000 parcels a day is still **200 errors a day**. Who catches them? How long does each correction take? These questions are the subject of the next lessons and of Unit 10.

:::quiz
? Splitting data into training, validation and test sets belongs to which workflow step?
- Create training material
+ Provision the training set
- Train model
> Provisioning: preprocessing, quality checks, splits.

? Investigating the model's most common mistakes and improving the data belongs to…
- Train model
+ Adjust and optimise
> And then the loop starts again.

? A model has 98 % accuracy on the benchmark. Which question is NOT answered by that number?
+ Whether the whole application saves the company time and money
- How often the model was correct on the benchmark data
> Business value needs evaluation beyond the model.

? Labelling handwritten digits by hand is part of…
+ Create training material
- Evaluate model
:::

:::key title="Summary"
Create material → provision the set → train → evaluate → adjust, in a loop. A model sits in an application which sits in a business process — and each level must be evaluated.
:::
