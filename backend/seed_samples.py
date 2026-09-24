"""
Seed script to generate realistic sample datasets:
1. Superstore Sales (~10k rows) with intentional missing values, duplicates, and outliers
2. Customer Churn
3. Marketing Campaign
"""
import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "samples")
os.makedirs(DATA_DIR, exist_ok=True)

np.random.seed(42)
random.seed(42)

def generate_superstore():
    n_rows = 9994
    regions = {
        "East": ["New York", "Pennsylvania", "Massachusetts", "New Jersey"],
        "West": ["California", "Washington", "Oregon", "Arizona"],
        "Central": ["Illinois", "Texas", "Michigan", "Wisconsin"],
        "South": ["Florida", "North Carolina", "Georgia", "Virginia"]
    }
    categories = {
        "Technology": ["Phones", "Accessories", "Copiers", "Machines"],
        "Furniture": ["Chairs", "Tables", "Bookcases", "Furnishings"],
        "Office Supplies": ["Paper", "Binders", "Storage", "Art", "Envelopes"]
    }
    segments = ["Consumer", "Corporate", "Home Office"]
    customers = [f"Cust-{i:04d}" for i in range(1, 800)]
    
    start_date = datetime(2022, 1, 1)
    
    data = []
    for i in range(1, n_rows + 1):
        order_id = f"CA-{random.randint(2022, 2024)}-{random.randint(100000, 999999)}"
        days_offset = random.randint(0, int(365 * 2.5))
        order_date = start_date + timedelta(days=days_offset)
        cust_id = random.choice(customers)
        segment = random.choices(segments, weights=[0.5, 0.3, 0.2])[0]
        
        region = random.choice(list(regions.keys()))
        state = random.choice(regions[region])
        
        category = random.choices(list(categories.keys()), weights=[0.4, 0.3, 0.3])[0]
        sub_cat = random.choice(categories[category])
        product_name = f"{sub_cat} Pro Series {random.randint(10, 99)}"
        
        quantity = random.randint(1, 10)
        base_price = random.uniform(15, 600) if category != "Technology" else random.uniform(80, 1500)
        sales = round(quantity * base_price, 2)
        discount = random.choices([0.0, 0.1, 0.2, 0.3, 0.5], weights=[0.5, 0.2, 0.15, 0.1, 0.05])[0]
        
        # Profit margin influenced by discount and category
        margin_pct = random.uniform(0.15, 0.40) - (discount * 0.8)
        profit = round(sales * margin_pct, 2)
        
        data.append({
            "Order ID": order_id,
            "Order Date": order_date.strftime("%Y-%m-%d"),
            "Customer": cust_id,
            "Segment": segment,
            "Category": category,
            "Sub-Category": sub_cat,
            "Product": product_name,
            "Region": region,
            "State": state,
            "Sales": sales,
            "Quantity": quantity,
            "Discount": discount,
            "Profit": profit
        })
    
    df = pd.DataFrame(data)
    
    # Introduce ~1% intentional duplicates
    dup_rows = df.sample(n=60, random_state=42)
    df = pd.concat([df, dup_rows], ignore_index=True)
    
    # Introduce intentional missing values in Segment, Region, Discount (~1.5%)
    missing_indices = np.random.choice(df.index, size=150, replace=False)
    for idx in missing_indices[:50]:
        df.loc[idx, "Region"] = np.nan
    for idx in missing_indices[50:100]:
        df.loc[idx, "Segment"] = np.nan
    for idx in missing_indices[100:]:
        df.loc[idx, "Discount"] = np.nan
        
    # Introduce extreme outliers in Sales & Profit (e.g. big enterprise deals)
    outlier_indices = np.random.choice(df.index, size=15, replace=False)
    for idx in outlier_indices[:10]:
        df.loc[idx, "Sales"] = round(df.loc[idx, "Sales"] * random.uniform(8, 15), 2)
        df.loc[idx, "Profit"] = round(df.loc[idx, "Sales"] * 0.45, 2)
    for idx in outlier_indices[10:]:
        # Outlier negative profit (heavy loss)
        df.loc[idx, "Profit"] = -round(df.loc[idx, "Sales"] * random.uniform(1.2, 2.5), 2)
        
    path = os.path.join(DATA_DIR, "superstore_sales.csv")
    df.to_csv(path, index=False)
    print(f"Generated Superstore Sales: {len(df)} rows -> {path}")

def generate_customer_churn():
    n_rows = 5000
    contracts = ["Month-to-month", "One year", "Two year"]
    payments = ["Electronic check", "Mailed check", "Bank transfer", "Credit card"]
    
    data = []
    for i in range(1, n_rows + 1):
        tenure = random.randint(1, 72)
        monthly_charges = round(random.uniform(20.0, 118.0), 2)
        total_charges = round(tenure * monthly_charges * random.uniform(0.95, 1.05), 2)
        contract = random.choices(contracts, weights=[0.55, 0.25, 0.20])[0]
        
        # Churn probability based on tenure and contract
        churn_prob = 0.55 if contract == "Month-to-month" else 0.12
        if tenure < 6:
            churn_prob += 0.2
        elif tenure > 40:
            churn_prob -= 0.15
        churn = "Yes" if random.random() < churn_prob else "No"
        
        data.append({
            "CustomerID": f"7590-C{i:04d}",
            "Tenure": tenure,
            "Contract": contract,
            "PaymentMethod": random.choice(payments),
            "MonthlyCharges": monthly_charges,
            "TotalCharges": total_charges,
            "InternetService": random.choice(["DSL", "Fiber optic", "No"]),
            "TechSupport": random.choice(["Yes", "No"]),
            "Churn": churn
        })
        
    df = pd.DataFrame(data)
    # Missing values
    missing_idx = np.random.choice(df.index, size=40, replace=False)
    for idx in missing_idx:
        df.loc[idx, "TotalCharges"] = np.nan
        
    path = os.path.join(DATA_DIR, "customer_churn.csv")
    df.to_csv(path, index=False)
    print(f"Generated Customer Churn: {len(df)} rows -> {path}")

def generate_marketing_campaign():
    n_rows = 3500
    channels = ["Social Media", "Search Ads", "Email", "Influencer", "Display"]
    campaigns = ["Spring Launch", "Summer Promo", "Black Friday", "Holiday Extravaganza", "Back to School"]
    
    data = []
    start_date = datetime(2023, 1, 1)
    for i in range(1, n_rows + 1):
        date = start_date + timedelta(days=random.randint(0, 360))
        channel = random.choice(channels)
        campaign = random.choice(campaigns)
        impressions = random.randint(1000, 150000)
        ctr = random.uniform(0.012, 0.075)
        clicks = int(impressions * ctr)
        cpc = random.uniform(0.35, 3.80)
        spend = round(clicks * cpc, 2)
        conversion_rate = random.uniform(0.02, 0.12)
        conversions = int(clicks * conversion_rate)
        revenue_per_conv = random.uniform(35.0, 180.0)
        revenue = round(conversions * revenue_per_conv, 2)
        roi = round((revenue - spend) / spend, 3) if spend > 0 else 0
        
        data.append({
            "Date": date.strftime("%Y-%m-%d"),
            "Campaign": campaign,
            "Channel": channel,
            "Impressions": impressions,
            "Clicks": clicks,
            "Spend": spend,
            "Conversions": conversions,
            "Revenue": revenue,
            "ROI": roi
        })
        
    df = pd.DataFrame(data)
    path = os.path.join(DATA_DIR, "marketing_campaign.csv")
    df.to_csv(path, index=False)
    print(f"Generated Marketing Campaign: {len(df)} rows -> {path}")

if __name__ == "__main__":
    generate_superstore()
    generate_customer_churn()
    generate_marketing_campaign()
