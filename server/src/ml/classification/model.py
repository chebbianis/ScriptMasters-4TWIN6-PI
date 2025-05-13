# server/ml/classification/model.py
import os
import sys
import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from scipy.sparse import hstack

def map_category(skills):
    if isinstance(skills, list):
        skills = ", ".join(skills)
    if not isinstance(skills, str) or not skills.strip():
        return 'other'
    keywords = {
        'frontend': {'react','angular','vue','javascript','html','css','typescript','jest'},
        'backend': {'java','python','node.js','php','ruby','go','.net','spring boot','django','flask'},
        'database': {'mysql','postgresql','mongodb','redis','cassandra','oracle','sqlite','sql'},
        'devops': {'docker','kubernetes','aws','google cloud','terraform','ansible','jenkins','prometheus','heroku'},
        'data_science': {'pandas','tensorflow','pytorch','keras','scikit-learn'}
    }
    skills_set = {s.strip().lower() for s in skills.split(',')}
    if skills_set & keywords['frontend'] and skills_set & keywords['backend']:
        return 'fullstack'
    for cat in ['frontend','backend','devops','database','data_science']:
        if skills_set & keywords[cat]:
            return cat
    return 'other'

# Chargement initial du modèle et du vectorizer

def load_model():
    base = os.path.dirname(__file__)
    df = pd.read_csv(os.path.join(base, "engineers_skills.csv"))
    df = df[df['Skills'].notna() & df['Skills'].ne('')].reset_index(drop=True)
    df['Category'] = df['Skills'].apply(map_category)

    vectorizer = TfidfVectorizer(max_features=500, min_df=2, max_df=0.8)
    X_text = vectorizer.fit_transform(df['Skills'])

    num_cols = ['Years Experience', 'Current Workload', 'Performance Rating']
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    X_num = df[num_cols].values

    X = hstack([X_text, X_num])
    y = df['Category']

    clf = SVC(kernel='linear', probability=False, random_state=42)
    clf.fit(X, y)

    return clf, vectorizer, num_cols

model, vectorizer, num_features = load_model()

def predict_category(skills, numbers):
    if isinstance(skills, list):
        skills = ", ".join(skills)
    X_text = vectorizer.transform([skills])
    X_num = [numbers.get(col, 0) for col in num_features]
    X = hstack([X_text, [X_num]])
    return model.predict(X)[0]

if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        users = json.loads(raw)
        results = []
        for u in users:
            results.append({
                "id": u.get("id"),
                "category": predict_category(
                    u.get("skills", ""),
                    u.get("numbers", {})
                )
            })
        print(json.dumps(results), flush=True)
    except Exception as e:
        print(f"❌ Python Error: {e}", file=sys.stderr)
        sys.exit(1)