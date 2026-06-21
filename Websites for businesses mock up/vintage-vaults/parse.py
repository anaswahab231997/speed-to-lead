import csv
import json

csv_path = r'C:\Users\ANAS\Downloads\dataset_crawler-google-places_2026-06-06_09-40-10-896.csv'
out_path = r'c:\Antigravity\speed-to-lead\Websites for businesses mock up\vintage-vaults\data.json'

data = []
with open(csv_path, encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 5: break
        
        # Clean keys
        clean_row = {k.strip('"'): v for k, v in row.items() if k}
        
        services = []
        for k in range(11):
            cat = clean_row.get(f'categories/{k}')
            if cat: services.append(cat)
            
        data.append({
            'business_name': clean_row.get('title', '').strip(),
            'high_ticket_services': services,
            'trust_signals': {
                'rating': clean_row.get('totalScore', ''),
                'reviews_count': clean_row.get('reviewsCount', '')
            },
            'contact': {
                'phone': clean_row.get('phone', ''),
                'website': clean_row.get('website', ''),
                'address': (clean_row.get('street', '') + ', ' + clean_row.get('city', '') + ', ' + clean_row.get('state', '')).strip(', ')
            },
            'legacy_urls': {
                'google_maps': clean_row.get('url', '')
            }
        })

normalized = {
    'schema_type': 'B2B_Lead_Database_Scrape',
    'source_file': 'dataset_crawler-google-places_2026-06-06_09-40-10-896.csv',
    'target_entity': 'Vintage Vaults Prospects',
    'extracted_payloads': data
}

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(normalized, f, indent=2)

print('SUCCESS')
