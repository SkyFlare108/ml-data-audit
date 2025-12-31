import pandas as pd

def basic_stats(df: pd.DataFrame):
    return {
        "n_rows": df.shape[0],
        "n_columns": df.shape[1],
        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_fraction": df.isna().mean().to_dict(),
    }
