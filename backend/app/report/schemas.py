from pydantic import BaseModel
from typing import Dict, Optional, List


class LeakageWarning(BaseModel):
    feature: str
    abs_corr: float
    reason: str


class DatasetSummary(BaseModel):
    n_rows: int
    n_columns: int
    column_types: Dict[str, str]
    missing_fraction: Dict[str, float]

    # Optional label-aware fields
    label: Optional[str] = None
    class_balance: Optional[Dict[str, float]] = None
    top_label_correlations: Optional[Dict[str, float]] = None
    leakage_warnings: Optional[List[LeakageWarning]] = None
