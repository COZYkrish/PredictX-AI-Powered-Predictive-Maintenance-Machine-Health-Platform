import json
from pathlib import Path

meta = json.loads(Path('ml/artifacts/models/metadata.json').read_text())
print('=== NEW metadata.json ===')
print('model_name:', meta.get('model_name'))
print('artifacts:', [a['filename'] for a in meta.get('artifacts', [])])
m = meta.get('metrics', {})
print('accuracy:', m.get('accuracy'))
print('f1:', m.get('f1'))
print('recall:', m.get('recall'))
print('precision:', m.get('precision'))
print('roc_auc:', m.get('roc_auc'))
print('pr_auc:', m.get('pr_auc'))
print('confusion_matrix:', m.get('confusion_matrix'))

print()
report = json.loads(Path('ml/artifacts/reports/evaluation_v1.0.0.json').read_text())
print('=== ALL MODELS EVALUATION ===')
for model, mx in report.items():
    acc = mx.get('accuracy', 0)
    f1 = mx.get('f1', 0)
    rec = mx.get('recall', 0)
    pr = mx.get('pr_auc', 0)
    print(f'{model:20s}: accuracy={acc:.3f}  F1={f1:.3f}  recall={rec:.3f}  pr_auc={pr:.3f}')
