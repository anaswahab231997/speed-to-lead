import csv
import json

csv_path = r'C:\Users\ANAS\Downloads\dataset_crawler-google-places_2026-06-06_09-40-10-896.csv'

candidates = []
with open(csv_path, encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        clean_row = {k.strip('"'): v for k, v in row.items() if k}
        website = clean_row.get('website', '').strip()
        reviews = clean_row.get('reviewsCount', '')
        rating = clean_row.get('totalScore', '')
        
        try:
            reviews_count = int(reviews) if reviews else 0
        except ValueError:
            reviews_count = 0
            
        services = []
        for k in range(11):
            cat = clean_row.get(f'categories/{k}')
            if cat: services.append(cat)
            
        is_custom_builder = any('custom home builder' in s.lower() for s in services)
        
        if website and is_custom_builder and reviews_count > 0:
            candidates.append({
                'name': clean_row.get('title', '').strip(),
                'reviews_count': reviews_count,
                'rating': rating,
                'services': services,
                'website': website,
                'phone': clean_row.get('phone', ''),
                'address': (clean_row.get('street', '') + ', ' + clean_row.get('city', '') + ', ' + clean_row.get('state', '')).strip(', '),
                'url': clean_row.get('url', '')
            })

candidates.sort(key=lambda x: x['reviews_count'], reverse=True)

if candidates:
    for c in candidates[:3]:
        print(f"{c['name']} - Reviews: {c['reviews_count']} - Rating: {c['rating']}")
        print(f"Services: {c['services']}")
        print("---")
else:
    print('No valid targets found.')
