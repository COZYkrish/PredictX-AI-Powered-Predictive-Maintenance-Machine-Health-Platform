import requests, json

r = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'admin@predictx.io', 'password': 'Admin123!'})
token = r.json()['access_token']
h = {'Authorization': 'Bearer ' + token}

status = requests.get('http://localhost:8000/api/v1/analytics/ml/status', headers=h).json()
print('active_model:', status.get('active_model'))
print('is_baseline:', status.get('is_baseline'))
print('feature_count:', status.get('feature_count'))
print()
print('MODEL COMPARISON:')
for m in status.get('model_comparison', []):
    mx = m['metrics']
    active_str = ' <-- ACTIVE' if m['is_active'] else ''
    baseline_str = ' [BASELINE]' if m['is_baseline'] else ''
    print(f"  {m['model_name']}{baseline_str}{active_str}: F1={mx.get('f1')} AUC={mx.get('pr_auc')}")

print()
print('TOP FEATURES:')
for fi in status.get('feature_importance', [])[:5]:
    print(f"  {fi['feature']}: {fi['importance']}")
