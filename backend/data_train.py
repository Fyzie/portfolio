import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

np.random.seed(42)
n_samples = 1000

temp = np.random.normal(475, 15, n_samples)
pressure = np.random.normal(25.0, 3.0, n_samples)
speed = np.random.normal(12.0, 2.0, n_samples)

base_yield = 100 - (abs(temp - 475) * 0.3) - (abs(pressure - 25.0) * 1.2) - (abs(speed - 12.0) * 1.5)

yields = []
for y in base_yield:
    trend = [
        round(float(y), 2),
        round(float(y - np.random.uniform(0.1, 1.0)), 2),
        round(float(y - np.random.uniform(0.5, 2.0)), 2),
        round(float(y - np.random.uniform(1.2, 3.5)), 2),
        round(float(y - np.random.uniform(2.0, 5.0)), 2),
    ]
    yields.append(trend)

X = pd.DataFrame({'temp': temp, 'pressure': pressure, 'speed': speed})
y = np.array(yields)

print("Training Aluminum Extrusion Random Forest Regressor...")
model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model.fit(X, y)

joblib.dump(model, 'data_model.pkl')
print("Saved aluminum extrusion model to manufacturing_model.pkl")