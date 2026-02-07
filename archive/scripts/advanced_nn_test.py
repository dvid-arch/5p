import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def test_advanced_models():
    print("=== ADVANCED NEURAL NETWORK COMPARISON (PYTHON) ===\n")
    
    # Load data
    try:
        df = pd.read_csv('neural_training_data.csv')
    except FileNotFoundError:
        print("❌ Error: neural_training_data.csv not found. Run the JS export script first.")
        return

    print(f"Loaded {len(df)} samples from history.")
    
    # Preprocessing
    features = ['momentum', 'gap', 'markov', 'pattern', 'algebraic', 'lag1', 'lag2', 'hmmState', 'resonance']
    X = df[features]
    y = df['hit_in_5']
    
    # Split data (Chronological split is better for time-series)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples.")

    # 1. MLP Classifier (Scikit-Learn's version of the JS model, but with Adam optimizer)
    print("\nTraining MLP Classifier (Advanced JS equivalent)...")
    mlp = MLPClassifier(
        hidden_layer_sizes=(16, 12), 
        activation='relu', 
        solver='adam', 
        max_iter=500,
        random_state=42
    )
    mlp.fit(X_train, y_train)
    y_pred_mlp = mlp.predict(X_test)
    acc_mlp = accuracy_score(y_test, y_pred_mlp)

    # 2. Random Forest (Often better for tabular data)
    print("Training Random Forest Classifier...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    acc_rf = accuracy_score(y_test, y_pred_rf)

    # 3. Simple Logistic Regression (Baseline)
    from sklearn.linear_model import LogisticRegression
    lr = LogisticRegression()
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    acc_lr = accuracy_score(y_test, y_pred_lr)

    print("\nMODEL PERFORMANCES (Accuracy on unseen data)")
    print("-" * 50)
    print(f"Logistic Regression (Baseline): {acc_lr*100:.2f}%")
    print(f"MLP (Deep Neural Network):      {acc_mlp*100:.2f}%")
    print(f"Random Forest (Ensemble):       {acc_rf*100:.2f}%")
    print("-" * 50)

    print("\nDETAILED ANALYSIS (MLP)")
    print(classification_report(y_test, y_pred_mlp))

    # Feature Importance (RF)
    importances = rf.feature_importances_
    feat_imp = pd.Series(importances, index=features).sort_values(ascending=False)
    print("\nFEATURE IMPORTANCE (What matters most?)")
    print(feat_imp)

    # Strategic Insight
    best_acc = max(acc_lr, acc_mlp, acc_rf)
    improvement = ((best_acc - acc_lr) / acc_lr * 100) if acc_lr > 0 else 0
    
    print("\nRESEARCH CONCLUSION")
    if best_acc > 0.75:
        print(f"   SUCCESS: Advanced models achieve {best_acc*100:.1f}% accuracy.")
        print(f"   Improvement over baseline: +{improvement:.1f}%")
        print("   RECOMMENDATION: Migrating to a persistent Python-based inference engine could yield significant gains.")
    else:
        print(f"   NEUTRAL: Models achieve {best_acc*100:.1f}% accuracy.")
        print("   Betting outcomes are high-variance. The current JS model provides reasonable heuristic value.")

if __name__ == "__main__":
    test_advanced_models()
