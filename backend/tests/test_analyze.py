from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

CSV = """x1,x2,label
1,10,0
2,20,0
3,30,1
4,40,1
"""

def test_analyze_basic():
    files = {"file": ("test.csv", CSV, "text/csv")}
    resp = client.post("/analyze", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["n_rows"] == 4
    assert data["n_columns"] == 3
    assert "missing_fraction" in data
    assert data.get("label") is None

def test_analyze_with_label():
    files = {"file": ("test.csv", CSV, "text/csv")}
    resp = client.post("/analyze?label=label", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["label"] == "label"
    assert "class_balance" in data
    # class_balance keys are strings
    assert "0" in data["class_balance"]
    assert "1" in data["class_balance"]
