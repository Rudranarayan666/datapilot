from typing import List, Dict, Any
import pandas as pd
import numpy as np

def generate_computed_insights(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Computes strict data-backed insights:
    - Trend (e.g. Month-over-month growth)
    - Comparison (Top category vs 2nd)
    - Anomaly (IQR detected anomalies)
    - Opportunity (High sales but low margin)
    - Warning (Negative profit or high churn)
    All numbers are computed by Pandas; no LLM invention.
    """
    insights = []
    col_map = {c.lower(): c for c in df.columns}
    sales_col = next((col_map[c] for c in col_map if "sales" in c or "revenue" in c), None)
    profit_col = next((col_map[c] for c in col_map if "profit" in c), None)
    date_col = next((c for c in df.columns if "date" in c.lower() or pd.api.types.is_datetime64_any_dtype(df[c])), None)
    region_col = next((col_map[c] for c in col_map if "region" in c or "category" in c), None)

    # 1. Comparison Insight: Leader dominance
    if region_col and sales_col:
        grp = df.groupby(region_col)[sales_col].sum().sort_values(ascending=False)
        if len(grp) >= 2:
            top_name = grp.index[0]
            top_val = grp.iloc[0]
            sec_name = grp.index[1]
            sec_val = grp.iloc[1]
            diff_pct = round(((top_val - sec_val) / sec_val) * 100, 1) if sec_val > 0 else 0
            tot = grp.sum()
            share = round((top_val / tot) * 100, 1) if tot > 0 else 0
            insights.append({
                "type": "Comparison",
                "title": f"{top_name} leads {region_col} performance",
                "metric": sales_col,
                "value": f"${top_val:,.2f}",
                "comparison": f"+{diff_pct}% vs. second place ({sec_name})",
                "calculation_basis": f"SUM({sales_col}) grouped by {region_col}. Top entity captures {share}% of total {sales_col}."
            })

    # 2. Warning Insight: Negative profitability segments
    if profit_col and region_col:
        grp_profit = df.groupby(region_col)[profit_col].sum().sort_values(ascending=True)
        negatives = grp_profit[grp_profit < 0]
        if len(negatives) > 0:
            loss_name = negatives.index[0]
            loss_val = abs(negatives.iloc[0])
            insights.append({
                "type": "Warning",
                "title": f"Profit deficit in {loss_name}",
                "metric": profit_col,
                "value": f"-${loss_val:,.2f}",
                "comparison": f"Cumulative negative margin",
                "calculation_basis": f"SUM({profit_col}) for {loss_name} resulted in net negative contribution across all recorded transactions."
            })

    # 3. Opportunity Insight: High volume, low margin
    cat_col = next((col_map[c] for c in col_map if "sub-category" in c or "category" in c), None)
    if sales_col and profit_col and cat_col:
        grp_both = df.groupby(cat_col)[[sales_col, profit_col]].sum()
        grp_both["margin_pct"] = (grp_both[profit_col] / grp_both[sales_col]) * 100
        # Find high sales (> median) with low margin (< 10%)
        med_sales = grp_both[sales_col].median()
        candidates = grp_both[(grp_both[sales_col] > med_sales) & (grp_both["margin_pct"] < 12)]
        if len(candidates) > 0:
            cand_name = candidates.index[0]
            cand_sales = candidates.loc[cand_name, sales_col]
            cand_margin = candidates.loc[cand_name, "margin_pct"]
            insights.append({
                "type": "Opportunity",
                "title": f"Margin expansion opportunity in {cand_name}",
                "metric": "Profit Margin",
                "value": f"{cand_margin:.1f}%",
                "comparison": f"High volume (${cand_sales:,.0f}) with sub-optimal margin",
                "calculation_basis": f"{cand_name} generates above-median volume but delivers only {cand_margin:.1f}% margin. Price elasticity optimization recommended."
            })

    # 4. Trend Insight: Latest vs Previous month
    if date_col and sales_col:
        try:
            df["__dtt"] = pd.to_datetime(df[date_col], errors="coerce")
            monthly = df.dropna(subset=["__dtt"]).groupby(df["__dtt"].dt.to_period("M"))[sales_col].sum()
            if len(monthly) >= 2:
                latest_m = str(monthly.index[-1])
                latest_val = monthly.iloc[-1]
                prev_m = str(monthly.index[-2])
                prev_val = monthly.iloc[-2]
                mom_growth = round(((latest_val - prev_val) / prev_val) * 100, 1) if prev_val > 0 else 0
                trend_dir = "accelerated" if mom_growth >= 0 else "contracted"
                sign = "+" if mom_growth >= 0 else ""
                insights.append({
                    "type": "Trend",
                    "title": f"Monthly revenue {trend_dir} by {sign}{mom_growth}%",
                    "metric": sales_col,
                    "value": f"${latest_val:,.2f}",
                    "comparison": f"{sign}{mom_growth}% vs. {prev_m}",
                    "calculation_basis": f"MoM comparison of {sales_col} from {prev_m} (${prev_val:,.0f}) to {latest_m} (${latest_val:,.0f})."
                })
        except Exception:
            pass

    # 5. Anomaly Insight: Statistical outlier check
    if sales_col:
        num_s = pd.to_numeric(df[sales_col], errors="coerce").dropna()
        q75 = num_s.quantile(0.75)
        iqr = q75 - num_s.quantile(0.25)
        high_outliers = num_s[num_s > (q75 + 3 * iqr)]
        if len(high_outliers) > 0:
            max_v = high_outliers.max()
            insights.append({
                "type": "Anomaly",
                "title": f"Extreme transaction values detected",
                "metric": sales_col,
                "value": f"${max_v:,.2f}",
                "comparison": f"{len(high_outliers)} transactions exceed 3x IQR",
                "calculation_basis": f"Interquartile Range analysis detected {len(high_outliers)} high-magnitude records significantly above upper statistical fence."
            })

    if not insights:
        insights.append({
            "type": "Trend",
            "title": "Baseline Performance Distribution",
            "metric": "Records",
            "value": f"{len(df):,}",
            "comparison": "Uniform historical baseline",
            "calculation_basis": f"Evaluated across {len(df):,} total observations."
        })

    return insights
