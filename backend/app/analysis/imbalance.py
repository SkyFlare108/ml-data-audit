import pandas as pd


def class_balance(df: pd.DataFrame, label: str) -> dict[str, float]:
    # normalized frequency per class, cast keys to str for JSON safety
    counts = df[label].value_counts(dropna=False, normalize=True)
    return {str(k): float(v) for k, v in counts.items()}
