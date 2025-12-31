import numpy as np
import pandas as pd


def top_abs_label_correlations(df: pd.DataFrame, label: str, top_k: int = 10) -> dict[str, float]:
    # Only works if label is numeric (we'll extend later)
    if label not in df.columns:
        return {}

    if not pd.api.types.is_numeric_dtype(df[label]):
        return {}

    numeric = df.select_dtypes(include=[np.number]).copy()
    if label not in numeric.columns:
        return {}

    corrs = numeric.corr(numeric_only=True)[label].drop(labels=[label], errors="ignore")
    corrs = corrs.dropna()
    top = corrs.abs().sort_values(ascending=False).head(top_k)

    # return as feature -> abs(corr)
    return {str(feat): float(val) for feat, val in top.items()}


def leakage_warnings_from_corrs(corrs: dict[str, float], threshold: float = 0.95):
    warnings = []
    for feature, abs_corr in corrs.items():
        if abs_corr >= threshold:
            warnings.append(
                {
                    "feature": feature,
                    "abs_corr": float(abs_corr),
                    "reason": f"Very high |corr| with label (≥ {threshold}). Possible leakage or target-derived feature.",
                }
            )
    return warnings
