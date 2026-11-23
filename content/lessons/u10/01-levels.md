Users don't interact with models — they interact with **applications**. A slightly worse model inside a much better application can be the better solution. This lesson gives you the levels at which a data engineer evaluates an AI solution.

## Is the best model always part of the best solution?

| Criterion | Application A | Application B |
|---|---|---|
| model accuracy | **97 %** | 93 % |
| average processing time | 4 min | **2 min** |
| task completion rate | 82 % | **98 %** |
| user satisfaction | low | **high** |

Most organisations would choose **B**: users finish more tasks, twice as fast, and like it — even though its model is less accurate.

## Decisions you will face as a data engineer

- **Build vs buy** — develop in-house or purchase an existing product?
- **Compare providers** — which of several competing solutions fits best?
- **Evaluate improvements** — is the new version really better?
- **Automate processes** — is an AI solution better than the current manual workflow?

Technical performance alone is not enough to make any of these decisions.

### Example: automating invoice processing

Option A manual entry · Option B in-house AI tool · Option C commercial product. What to compare for **build vs buy**:

| Criterion | Build in-house | Buy |
|---|---|---|
| initial investment | development costs | setup and licensing |
| customisation | highly customisable | depends on provider |
| maintenance | internal responsibility | often provider-managed |
| integration | can be tailored | depends on available APIs |
| data & security | greater architectural control | depends on hosting and agreements |
| long-term costs | staff and infrastructure | licensing, usage and support |

For confidential financial documents, **data & security** and **compliance** may outweigh everything else.

## Five levels of evaluation

<div class="diagram">
<svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="10" width="600" height="240" rx="14" class="dg-bx"/><text x="40" y="34" class="dg-h">Business / organisational: is it worth it? (TCO, ROI, compliance)</text>
  <rect x="50" y="46" width="540" height="194" rx="12" style="fill:var(--bg-elev);stroke:var(--border)"/><text x="70" y="70" class="dg-h">Business process: does the workflow improve?</text>
  <rect x="80" y="82" width="480" height="148" rx="10" class="dg-warn"/><text x="100" y="106" class="dg-h">User: can people do their tasks well?</text>
  <rect x="110" y="118" width="420" height="102" rx="9" class="dg-ok"/><text x="130" y="142" class="dg-h">Application / technical: fast, reliable, secure?</text>
  <rect x="140" y="154" width="360" height="56" rx="8" class="dg-hl"/><text x="320" y="187" text-anchor="middle" class="dg-h">Model: accurate on unseen data?</text>
</svg>
</div>

| Level | Question | Example measures |
|---|---|---|
| **Model** | accurate, reliable predictions on unseen data? | accuracy, precision, recall, F1 (quantitative); inspecting predictions (qualitative) |
| **Application / technical** | works reliably, efficiently, securely? | response time / **latency**, error rate, **uptime %**, CPU/RAM/GPU usage, successful API requests, security tests |
| **User** | can users complete tasks effectively, efficiently, comfortably? | task success rate, completion time, number of errors, time to proficiency (learnability), **questionnaires (SUS)** |
| **Business process** | does the overall workflow improve? | total time per invoice, minutes of manual work, end-to-end error rate, % processed without intervention, % escalations |
| **Business / organisation** | enough value for the organisation? | **TCO** (total cost of ownership), **ROI** (return on investment), cost per extra invoice (scalability), compliance, strategic fit (provider dependency), employee impact |

:::quiz
? “Average response time of the API is 320 ms” belongs to which level?
- model
+ application / technical
- business
> Performance and reliability of the system.

? “40 % of invoices still need manual correction” belongs to which level?
+ business process
- model
- user
> End-to-end workflow measure (automation rate).

? “Total cost over 5 years including licences and staff” is…
+ TCO, at the business/organisational level
- an application metric
> Total cost of ownership.

? Can an application be fast but still difficult to use?
+ Yes — speed is a technical property; usability is measured at the user level
- No, fast always means easy
:::

:::key title="Summary"
Evaluate on five levels: model → application → user → process → organisation. The best model is not necessarily the best solution; decisions (build vs buy, provider choice, automation) need all levels.
:::
