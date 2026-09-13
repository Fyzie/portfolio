import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

df = pd.read_csv("D:/Github/portfolio datasets/industrial_fault_detection_data_1000.csv")

feature_cols = ['Vibration (mm/s)', 'Temperature (°C)', 'Pressure (bar)', 'RMS Vibration', 'Mean Temp']
X = df[feature_cols]
y = df['Fault Label'].astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

acc = clf.score(X_test, y_test)
print(f"Test Accuracy: {acc * 100:.2f}%")

joblib.dump(clf, "industrial_fault_model.pkl")