from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import StringIO

from fastapi import UploadFile, File, HTTPException, Query
from io import StringIO
import pandas as pd

from app.analysis.stats import basic_stats
from app.analysis.imbalance import class_balance
from app.analysis.leakage import top_abs_label_correlations, leakage_warnings_from_corrs
from app.report.schemas import DatasetSummary, LeakageWarning



app = FastAPI(title="ML Data Audit API", version="0.1.0")

origins = [
  "http://localhost:5173",
  "https://skyflare108.github.io",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=DatasetSummary)
async def analyze(
    file: UploadFile = File(...),
    label: str | None = Query(default=None, description="Optional label/target column name"),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported")

    contents = await file.read()

    try:
        df = pd.read_csv(StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

    summary = basic_stats(df)

    # label-aware enrichments
    if label is not None:
        if label not in df.columns:
            raise HTTPException(status_code=400, detail=f"Label column '{label}' not found in CSV")

        summary["label"] = label

        # class balance
        summary["class_balance"] = class_balance(df, label)

        # leakage correlation (numeric label only for now)
        corrs = top_abs_label_correlations(df, label, top_k=10)
        if corrs:
            summary["top_label_correlations"] = corrs
            lw = leakage_warnings_from_corrs(corrs, threshold=0.95)
            summary["leakage_warnings"] = lw

    return summary

@app.get("/")
def root():
    return {
        "name": "ML Data Audit API",
        "status": "ok",
        "health": "/health",
        "docs": "/docs",
        "analyze": "/analyze"
    }
