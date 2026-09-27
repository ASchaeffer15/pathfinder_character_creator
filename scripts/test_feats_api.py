import sys
sys.stdout.reconfigure(encoding='utf-8')
from backend.feat_excel_service import TEMPLATE_PATH, generate_feat_template_excel
generate_feat_template_excel()

from fastapi.testclient import TestClient
from backend.api import app

client = TestClient(app)

res = client.get('/api/feats/template')
print('GET /api/feats/template status:', res.status_code, 'Content length:', len(res.content))

with open(TEMPLATE_PATH, 'rb') as f:
    upload_res = client.post(
        '/api/feats/upload-excel',
        files={'file': ('Pathfinder_2e_Feats_Template.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    )
    print('POST /api/feats/upload-excel status:', upload_res.status_code)
    print('Import response:', upload_res.json())

list_res = client.get('/api/feats/custom')
print('GET /api/feats/custom count:', len(list_res.json().get('feats', [])))
for ft in list_res.json().get('feats', []):
    print(f"  • {ft['name']} (Lvl {ft['level']} {ft['type']}): {ft['actions']} - {ft['description'][:60]}...")
