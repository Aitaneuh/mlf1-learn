# MLF1 Learn — maintenance guide

Self-hosted learning site for the BFH course *BTI1041 Machine Learning Foundations 1*. The learner (repo owner)
found the course hard to follow from week 2 on; the site teaches it progressively: explanation → interactive
graphic → quiz → auto-checked Python exercise → unit exam → optional project.

## Layout

- `server/server.js` — zero-dependency Node server (node:http + node:sqlite): static files, auth (scrypt,
  session cookie), `/api/progress`. Data dir `/data` in Docker.
- `public/` — SPA (vanilla ES modules, no build). `js/app.js` router/views, `js/blocks.js` exercise/quiz/code
  blocks, `js/viz.js` interactive SVG visualisations, `js/pyworker.js` Pyodide in a Web Worker, `css/style.css`.
- `content/course.json` — units/items. Item ids are stable (progress is keyed by them) — never rename an existing id.
- `content/lessons|exams|projects/*.md` — content with `:::` blocks (format in README.md).
- `public/data/` — datasets for exercises, built by `scripts/prepare_data.py` from the course repo `../f26_27/datasets`.
- `scripts/validate-content.mjs` — runs every exercise in real Pyodide (needs `npm i --no-save pyodide@0.29.4`).

## Weekly update procedure (when the user has pulled new course material into ../f26_27)

1. `git -C ../f26_27 log --stat -5` — find the new slides/notebooks (slides: `pdftotext -layout`; notebooks:
   read the cells with a short Python script). Read them fully.
2. Decide: new unit (new topic/week) or new lessons in an existing unit. Keep the progression easy → hard and
   update `weeks` labels. Add the item(s) to `content/course.json` and an entry to `updates` (date + text).
3. Write lessons in your own words (do not copy slide text; no student names). Each lesson: goals, intuition,
   formulas with worked numbers, an interactive viz if useful (add one to `viz.js` if needed), a quiz, 1–4
   exercises with `check` + `hint` + `solution`, a summary callout. Add an exam (8–15 questions, pass 70) and,
   when the topic allows, a project (`optional: true`). Add new terms to `content/glossary.json`, formulas/code
   to `content/cheatsheet.md`, and update `lessons/u12/01-review.md` + `exams/final.md`.
4. New datasets: extend `scripts/prepare_data.py` (keep files small, < 1–2 MB) and re-run it.
5. `node scripts/validate-content.mjs` must report **all good**. Then run the server and look at the new pages.
6. Commit and push to `main`; Portainer redeploys via GitOps.

## Conventions

- Exercise checks: plain `assert cond, "helpful message with the expected value"`; messages are shown as plain
  text with `backtick` code spans. Check against computed values, not hand-typed arithmetic (validator catches it).
- Python in exercises shares one namespace per page (like a notebook kernel); order exercises accordingly.
- The site is English; the user is a beginner — prefer concrete numbers and short sentences.
