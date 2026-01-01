# ML Data Audit

A lightweight, no-LLM dataset auditing tool that helps identify common ML data issues such as missing values, class imbalance, and potential label leakage — **before training a model**.

🔗
Demo (GitHub Pages):  
👉 https://skyflare108.github.io/ml-data-audit/
Backend API (Render):  
👉 https://ml-data-audit.onrender.com  
API Docs:  
👉 https://ml-data-audit.onrender.com/docs

---

## What This Tool Does

Upload a CSV dataset and (optionally) select a label column to receive:

- Dataset shape (rows / columns)
- Automatic column type inference
- Missing value fractions per column
- Label-aware analysis:
  - Class balance
  - Feature–label correlations
  - Leakage warnings for suspiciously predictive features

This tool is **model-agnostic** and does not use LLM APIs.

---

## Tech Stack

**Frontend**
- React
- Vite
- Deployed via GitHub Pages

**Backend**
- FastAPI
- pandas, numpy, scipy, scikit-learn
- Deployed on Render (free tier)

---

## Live Usage Instructions

1. Go to the live frontend:
   https://skyflare108.github.io/ml-data-audit/

2. Upload a CSV file

3. (Optional) Select a label column  
   - The analysis will recompute correlations and leakage checks relative to the selected label

4. Click **Analyze**

Results will appear below the upload section.
