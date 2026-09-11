import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

np.random.seed(42)
n_samples = 1000

temp = np.random.normal(180, 10, n_samples)
pressure = np.random.normal(4.5, 0.5, n_samples)
speed = np.random.normal(1200, 50, n_samples)

base_yield = 100 - (abs(temp - 180) * 0.5) - (abs(pressure - 4.5) * 5) - (abs(speed - 1200) * 0.05)

yields = []
for y in base_yield:
    trend = [
        round(float(y), 2),
        round(float(y - np.random.uniform(0.2, 1.5)), 2),
        round(float(y - np.random.uniform(1.0, 2.8)), 2),
        round(float(y - np.random.uniform(2.0, 4.2)), 2),
        round(float(y - np.random.uniform(3.5, 6.0)), 2),
    ]
    yields.append(trend)

X = pd.DataFrame({'temp': temp, 'pressure': pressure, 'speed': speed})
y = np.array(yields)

print("Training Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model.fit(X, y)

joblib.dump(model, 'manufacturing_model.pkl')
print("Saved model to manufacturing_model.pkl")