"""Build the small data files used by the in-browser exercises.

Usage (from the repo root):
    python scripts/prepare_data.py "../f26_27/datasets"

Needs: numpy, pandas, scikit-learn (only for the 20 Newsgroups cache).
Output goes to public/data/. Re-running is safe and deterministic.
"""
import gzip
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "f26_27" / "datasets"
rng = np.random.default_rng(42)


def copy(name, new=None):
    src = SRC / name
    if src.exists():
        shutil.copy(src, OUT / (new or name))
        print("copied", name)
    else:
        print("MISSING", name)


# --- 1. straight copies of small public datasets --------------------------------
copy("iris.data")
copy("bikes.csv")
copy("pendigits.tra")

# --- 2. MNIST sample (uint8, compressed) ----------------------------------------
mnist_src = SRC / "mnist_784.arff.gz"
if mnist_src.exists():
    with gzip.open(mnist_src, "rt") as stream:
        for line in stream:
            if line.strip().lower() == "@data":
                break
        frame = pd.read_csv(stream, header=None, dtype=np.float32)
    X = frame.iloc[:, :784].to_numpy().astype(np.uint8)
    y = frame.iloc[:, 784].to_numpy().astype(np.int64)
    tr = rng.choice(60000, 3000, replace=False)
    te = 60000 + rng.choice(10000, 600, replace=False)
    np.savez_compressed(OUT / "mnist_small.npz", X_train=X[tr], y_train=y[tr], X_test=X[te], y_test=y[te])
    print("mnist_small.npz", (OUT / "mnist_small.npz").stat().st_size // 1024, "KB")

# --- 3. 20 Newsgroups subset -------------------------------------------------------
try:
    from sklearn.datasets import fetch_20newsgroups

    cats = ["comp.graphics", "rec.sport.hockey", "sci.med", "sci.space"]
    out = {"target_names": cats}
    for subset, n in [("train", 260), ("test", 90)]:
        d = fetch_20newsgroups(subset=subset, categories=cats, remove=("headers", "footers", "quotes"),
                               shuffle=True, random_state=42, data_home=str(SRC), download_if_missing=False)
        texts, labels = [], []
        per = {i: 0 for i in range(len(cats))}
        for t, lab in zip(d.data, d.target):
            t = " ".join(t.split())
            if len(t) < 80 or per[lab] >= n:
                continue
            per[lab] += 1
            texts.append(t[:1200])
            labels.append(int(lab))
        out[subset] = {"text": texts, "label": labels}
    (OUT / "newsgroups4.json").write_text(json.dumps(out), encoding="utf-8")
    print("newsgroups4.json", (OUT / "newsgroups4.json").stat().st_size // 1024, "KB")
except Exception as e:  # noqa: BLE001
    print("newsgroups skipped:", e)

# --- 4. synthetic: messy customer table (week 2 debugging) -------------------------
customers = pd.DataFrame({
    "customer_id": [f"K{i:03d}" for i in range(1, 11)],
    "name": ["Lena", "Marco", "Aylin", "Noah", "Sofia", "Luca", "Mia", "Jonas", "Elif", "Tim"],
    "age": [22, 41, 36, 28, 33, 52, 25, 30, 47, 19],
    "city": ["Biel", "Bern", "Thun", "Biel", "Bern", "Zurich", "Basel", "Biel", "Bern", "Thun"],
    "member": ["yes", "no", "yes", "no", "yes", "yes", "no", "yes", "no", "no"],
    "spend_chf": [820, 2410, 1730, 640, 1980, 3120, 510, 1560, 2290, 300],
})
customers.to_csv(OUT / "shop_customers.csv", index=False)

# --- 5. synthetic A/B usability study (weeks 8-9) ----------------------------------
rows = []
rid = 0
apps = ["Sketchy", "Blocks"]
for participant in range(1, 25):
    group = 1 if participant <= 13 else 2  # slightly unbalanced, on purpose
    order = apps if group == 1 else apps[::-1]
    experienced = rng.random() < 0.35
    for pos, app in enumerate(order):
        for task in ["A", "B"]:
            rid += 1
            base = 5.4 if app == "Sketchy" else 5.0
            base += 0.6 if task == "B" else 0
            base -= 0.9 * pos  # learning effect: second tool is faster
            base -= 1.6 if experienced else 0
            minutes = max(1.5, rng.normal(base, 1.3))
            completed = "yes" if minutes < 10 else "no"
            minutes = min(minutes, 10)
            m, s = int(minutes), int(round((minutes % 1) * 60)) % 60
            style = rng.random()
            if style < 0.55:
                raw = f"{m:02d}:{s:02d}"
            elif style < 0.75:
                raw = f"{round(minutes)}min"
            elif style < 0.85:
                raw = f"{round(minutes)}"
            elif style < 0.93:
                raw = f"{m}-{m + 1} min"
            else:
                raw = ""
            ease = int(np.clip(round(rng.normal(4.1 if app == "Sketchy" else 3.7, 0.8)), 1, 5))
            row = {"response_id": rid, "group": group, "position": "first" if pos == 0 else "second",
                   "application": app, "task": task, "completed": completed, "time_raw": raw, "ease": ease,
                   "prior_experience": "yes" if experienced else "no"}
            if task == "B":  # SUS after each application
                lean = 0.5 if app == "Sketchy" else 0.2
                for i in range(1, 11):
                    positive = i % 2 == 1
                    mu = 3.9 + lean if positive else 2.1 - lean
                    row[f"sus{i}"] = int(np.clip(round(rng.normal(mu, 0.8)), 1, 5))
            rows.append(row)
ab = pd.DataFrame(rows)
ab.to_csv(OUT / "ab_study.csv", index=False)
print("ab_study.csv", len(ab), "rows")

# --- 6. synthetic annotation agreement (week 10) -----------------------------------
labels = ["positive", "negative", "neutral"]
truth = rng.choice(labels, 60, p=[0.4, 0.35, 0.25])
def annotate(noise):
    return [t if rng.random() > noise else rng.choice(labels) for t in truth]
ann = pd.DataFrame({"item_id": range(1, 61), "annotator_A": annotate(0.2), "annotator_B": annotate(0.3)})
ann.to_csv(OUT / "annotations.csv", index=False)

# --- 7. synthetic spam predictions for error analysis (week 8) --------------------
msgs = [
    ("Claim your free prize today!", "en", "spam", "spam"),
    ("URGENT: meeting moved to 15:00", "en", "legit", "spam"),
    ("Special offer for existing clients", "en", "legit", "spam"),
    ("Your account needs verification", "en", "spam", "legit"),
    ("Lunch tomorrow?", "en", "legit", "legit"),
    ("Win an iPhone now, click here", "en", "spam", "spam"),
    ("Gratis Gutschein, jetzt klicken!", "de", "spam", "legit"),
    ("Rechnung für Oktober im Anhang", "de", "legit", "legit"),
    ("Votre colis est en attente, payez 2 CHF", "fr", "spam", "legit"),
    ("Réunion déplacée à jeudi", "fr", "legit", "spam"),
    ("Félicitations, vous avez gagné !", "fr", "spam", "legit"),
    ("Offre spéciale pour nos clients", "fr", "legit", "spam"),
    ("Can you review my pull request?", "en", "legit", "legit"),
    ("Limited time: 90% off watches", "en", "spam", "spam"),
    ("Dein Paket konnte nicht zugestellt werden", "de", "spam", "legit"),
    ("Termin am Montag bestätigt", "de", "legit", "legit"),
    ("Exam registration is now open", "en", "legit", "legit"),
    ("Cheap meds, no prescription", "en", "spam", "spam"),
    ("Mise à jour de votre mot de passe requise", "fr", "spam", "legit"),
    ("Bonjour, voici le rapport final", "fr", "legit", "legit"),
]
pd.DataFrame(msgs, columns=["text", "language", "actual", "predicted"]).to_csv(OUT / "spam_predictions.csv", index=False)
print("done ->", OUT)
