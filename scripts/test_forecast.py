import requests

r = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'admin@predictx.io', 'password': 'Admin123!'})
token = r.json()['access_token']
h = {'Authorization': 'Bearer ' + token}
did = '0cf89c09-cc0b-4fc8-9ade-56ced6d1b344'

resp = requests.get(f'http://localhost:8000/api/v1/devices/{did}/forecast', headers=h)
print('Status:', resp.status_code)
if resp.status_code == 200:
    data = resp.json()
    print('has_warnings:', data['has_warnings'])
    print()
    for f in data['forecasts']:
        trend_icon = {'RISING': 'UP', 'FALLING': 'DOWN', 'STABLE': '--', 'UNKNOWN': '?'}[f['trend']]
        breach = f'  ETA to threshold: {f["eta_threshold_minutes"]} min' if f['will_breach_threshold'] else ''
        print(f"{f['label']:20s}: current={f['current']}%  forecast30={f['forecast_30min']}%  trend={f['trend']} {trend_icon}  data_pts={f['data_points']}{breach}")
else:
    print('Error:', resp.text[:500])
