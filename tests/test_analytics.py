import pytest
import pandas as pd
from app.analytics.profiler import profile_dataframe, detect_column_type
from app.analytics.quality import calculate_quality_score, apply_cleaning_actions
from app.analytics.aggregations import run_aggregation
from app.analytics.recommender import recommend_kpis, recommend_charts
from app.analytics.ask_engine import ask_your_data

@pytest.fixture
def sample_sales_df():
    return pd.DataFrame({
        "Order ID": ["CA-1", "CA-2", "CA-3", "CA-3"],  # 1 duplicate
        "Region": ["East", "West", "East", "East"],
        "Sales": [100.0, 200.0, 300.0, 300.0],
        "Profit": [20.0, 50.0, 90.0, 90.0],
        "Category": ["Technology", "Furniture", "Technology", "Technology"]
    })

def test_detect_column_type():
    s_num = pd.Series([1, 2, 3])
    s_cat = pd.Series(["A", "B", "C"])
    _, t_num = detect_column_type(s_num)
    _, t_cat = detect_column_type(s_cat)
    assert t_num == "numeric"
    assert t_cat == "categorical"

def test_profile_dataframe(sample_sales_df):
    profile = profile_dataframe(sample_sales_df, 1, "Test Sales")
    assert profile["total_rows"] == 4
    assert profile["total_columns"] == 5
    assert profile["duplicate_rows"] == 1
    assert profile["numeric_columns_count"] >= 2

def test_quality_score_and_cleaning(sample_sales_df):
    quality = calculate_quality_score(sample_sales_df, 1)
    assert 0 <= quality["overall_score"] <= 100
    assert quality["scores"]["completeness"] == 100.0  # no NaNs
    assert quality["scores"]["uniqueness"] < 100.0     # 1 duplicate row
    
    # Test cleaning fix
    cleaned = apply_cleaning_actions(sample_sales_df, ["drop_duplicates"])
    assert len(cleaned) == 3

def test_kpi_engine(sample_sales_df):
    kpis = recommend_kpis(sample_sales_df)
    names = [k["name"] for k in kpis]
    assert any("Sales" in n for n in names)
    assert any("Profit" in n for n in names)

def test_aggregations(sample_sales_df):
    res = run_aggregation(sample_sales_df, dimension="Region", metric="Sales", aggregation="sum")
    assert len(res["data"]) == 2
    east = next(r for r in res["data"] if r["Region"] == "East")
    assert east["value"] == 700.0  # 100 + 300 + 300

def test_ask_your_data(sample_sales_df):
    ans = ask_your_data(sample_sales_df, "Which region generated the highest sales?")
    assert "East" in ans["answer_text"]
    assert ans["calculation_basis"]["top_entity"] == "East"
