import sys
import json
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Configurer le logging
def log(message):
    print(message, flush=True)

# Chemin du modèle
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.joblib')
log(f"Chemin du modèle: {MODEL_PATH}")

# Charger ou créer le modèle
def load_model():
    try:
        if os.path.exists(MODEL_PATH):
            log(f"Chargement du modèle existant depuis {MODEL_PATH}")
            return joblib.load(MODEL_PATH)
        else:
            log("Création d'un nouveau modèle")
            # Créer un modèle simple pour les prédictions
            model = RandomForestRegressor(n_estimators=50, random_state=42)
            
            # Générer des données d'entraînement synthétiques
            n_samples = 1000
            log(f"Génération de {n_samples} échantillons synthétiques")
            
            # Générer des features aléatoires
            X = np.random.rand(n_samples, 4)  # 4 features
            
            # Créer la variable cible avec des poids différents pour chaque feature
            y = (X[:, 0] * 0.6 +  # skillMatch (beaucoup plus important)
                 X[:, 1] * 0.2 +  # experience
                 (1 - X[:, 2]) * 0.1 +  # workload inversé (moins de charge = meilleur)
                 X[:, 3] * 0.1)   # performance
            
            # Normaliser pour avoir des scores entre 0 et 1
            y = y / y.max()
            
            log("Entraînement du modèle")
            # Entraîner le modèle
            model.fit(X, y)
            
            # Sauvegarder le modèle
            log(f"Sauvegarde du modèle dans {MODEL_PATH}")
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            joblib.dump(model, MODEL_PATH)
            
            return model
    except Exception as e:
        log(f"Erreur lors du chargement/création du modèle: {str(e)}")
        # En cas d'erreur, retourner un modèle simple qui prédit en fonction des règles de base
        fallback_model = RandomForestRegressor(n_estimators=10, random_state=42)
        X_simple = np.array([[0, 0, 0, 0], [1, 1, 0, 1]])  # Cas extrêmes
        y_simple = np.array([0.2, 0.9])  # Prédictions pour les cas extrêmes
        fallback_model.fit(X_simple, y_simple)
        return fallback_model

# Fonction de prédiction
def predict(input_data):
    try:
        log(f"Réception des données d'entrée: {input_data}")
        
        # Valider les données d'entrée
        if not all(key in input_data for key in ['skillMatch', 'yearsExperience', 'currentWorkload', 'performanceRating']):
            log("Données d'entrée incomplètes, utilisation de valeurs par défaut")
            return {'prediction': 0.5, 'error': 'Données incomplètes'}
        
        # Charger le modèle
        model = load_model()
        
        # Convertir et valider les données numériques
        try:
            skill_match = float(input_data['skillMatch'])
            years_exp = min(float(input_data['yearsExperience']), 10.0) / 10.0  # 10 ans max
            workload = min(float(input_data['currentWorkload']), 100.0) / 100.0  # 100% max
            performance = min(float(input_data['performanceRating']), 5.0) / 5.0  # 5 max
        except (ValueError, TypeError) as e:
            log(f"Erreur de conversion des données: {str(e)}")
            return {'prediction': 0.5, 'error': 'Données invalides'}
        
        # Préparer les données d'entrée
        features = np.array([[skill_match, years_exp, workload, performance]])
        log(f"Features préparées: {features}")
        
        # Faire la prédiction
        prediction = model.predict(features)[0]
        log(f"Prédiction brute: {prediction}")
        
        # Assurer que la prédiction est entre 0 et 1
        prediction = max(0, min(1, prediction))
        log(f"Prédiction normalisée: {prediction}")
        
        # Appliquer une correction forte basée sur le skill_match
        if skill_match == 0:
            adjusted_prediction = min(prediction, 0.3)  # Max 30% si aucune correspondance
            log(f"Prédiction ajustée (aucune compétence): {adjusted_prediction}")
            prediction = adjusted_prediction
        elif skill_match < 0.3:
            adjusted_prediction = min(prediction, 0.5)  # Max 50% si faible correspondance
            log(f"Prédiction ajustée (faible skill_match): {adjusted_prediction}")
            prediction = adjusted_prediction
        elif skill_match < 0.5:
            adjusted_prediction = min(prediction, 0.7)  # Max 70% si moyenne correspondance
            log(f"Prédiction ajustée (moyenne skill_match): {adjusted_prediction}")
            prediction = adjusted_prediction
            
        # Retourner la prédiction formatée
        return {'prediction': float(prediction)}
    
    except Exception as e:
        log(f"Erreur dans la fonction predict: {str(e)}")
        # Calcul de secours simple en cas d'erreur
        try:
            skill_match = float(input_data.get('skillMatch', 0))
            years_exp = float(input_data.get('yearsExperience', 0)) / 10.0  # Normaliser sur 10 ans
            performance = float(input_data.get('performanceRating', 3.0)) / 5.0  # Normaliser sur 5
            
            # Formule simple avec forte pondération des compétences
            fallback_score = skill_match * 0.6 + years_exp * 0.2 + performance * 0.2
            
            # Limiter le score selon la correspondance des compétences
            if skill_match == 0:
                fallback_score = min(fallback_score, 0.3)
            elif skill_match < 0.5:
                fallback_score = min(fallback_score, 0.6)
                
            fallback_score = max(0, min(1, fallback_score))  # Assurer entre 0 et 1
            
            log(f"Score de secours calculé: {fallback_score}")
            return {'prediction': float(fallback_score)}
        except:
            log("Échec du calcul de secours, retour valeur par défaut")
            return {'prediction': 0.5, 'error': str(e)}

if __name__ == '__main__':
    try:
        # Lire les données d'entrée depuis les arguments
        log("Démarrage du script Python")
        
        if len(sys.argv) > 1:
            log(f"Argument reçu: {sys.argv[1]}")
            try:
                input_data = json.loads(sys.argv[1])
                result = predict(input_data)
                log(f"Résultat: {result}")
                print(json.dumps(result))
            except json.JSONDecodeError as e:
                log(f"Erreur de décodage JSON: {str(e)}")
                print(json.dumps({'prediction': 0.5, 'error': f'Erreur JSON: {str(e)}'}))
        else:
            log("Aucun argument fourni")
            print(json.dumps({'prediction': 0.5, 'error': 'No input data provided'}))
    except Exception as e:
        log(f"Exception non gérée: {str(e)}")
        print(json.dumps({'prediction': 0.5, 'error': str(e)})) 