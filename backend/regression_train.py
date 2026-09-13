import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

df = pd.read_csv("D:/Github/portfolio datasets/garments_worker_productivity.csv")

feature_cols = ['targeted_productivity', 'smv', 'over_time', 'incentive', 'no_of_workers']
X = df[feature_cols]
y = df['actual_productivity']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

reg = RandomForestRegressor(n_estimators=100, random_state=42)
reg.fit(X_train, y_train)

score = reg.score(X_test, y_test)
print(f"R² Score: {score:.4f}")

joblib.dump(reg, "garments_regression_model.pkl")