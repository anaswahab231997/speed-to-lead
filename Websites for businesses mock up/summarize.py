import json
data = json.load(open('c:/Antigravity/speed-to-lead/Websites for businesses mock up/intelligence_payload.json', encoding='utf-8'))
print(f'Total Leads: {len(data)}')
no_website = sum(1 for d in data if not d.get('website'))
print(f'Leads without website: {no_website}')
print('\n--- SAMPLE EXTRACTS ---')
for i in range(3):
    print('Clinic:', data[i]['extracted_clinic'])
    print('Line:', data[i]['opening_line'])
    print('-' * 20)
