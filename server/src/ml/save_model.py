import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
import joblib

# Load your data
data = 'cleaned_data.csv'
df = pd.read_csv(data)

# Choose the task to analyze
task_name = "Complete coding challenge"
df_task = df[df["Task Name"] == task_name]

# Define target and features
target = "Quality"
X_quality = df_task.drop(columns=["Task Name", target, "Due Date"])
y_quality = df_task[target]

# Encode categorical columns
categorical_cols = X_quality.select_dtypes(include=['object']).columns
label_encoders_quality = {}
for col in categorical_cols:
    le = LabelEncoder()
    X_quality[col] = le.fit_transform(X_quality[col])
    label_encoders_quality[col] = le

# Encode target variable
target_encoder = LabelEncoder()
y_quality_class = target_encoder.fit_transform(y_quality)

# Standardize the data
scaler_class = StandardScaler()
X_quality_scaled = scaler_class.fit_transform(X_quality)

# Split into train/test
X_train_quality, X_test_quality, y_train_quality, y_test_quality = train_test_split(
    X_quality_scaled, y_quality_class, test_size=0.2, random_state=42, stratify=y_quality_class
)

# Train XGBoost model
xgb_model = XGBClassifier(
    objective='multi:softmax',
    num_class=len(np.unique(y_train_quality)),
    colsample_bytree=0.3,
    learning_rate=0.1,
    max_depth=5,
    alpha=10,
    n_estimators=100,
    random_state=123
)

# Fit the model
xgb_model.fit(X_train_quality, y_train_quality)

# Save the model
joblib.dump(xgb_model, 'xgboost_quality_model.pkl')
print("Model saved successfully as 'xgboost_quality_model.pkl'")

# Save the encoders and scaler
joblib.dump(label_encoders_quality, 'label_encoders.pkl')
joblib.dump(target_encoder, 'target_encoder.pkl')
joblib.dump(scaler_class, 'scaler.pkl')
print("Encoders and scaler saved successfully") 