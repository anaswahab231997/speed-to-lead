import urllib.request
import re
import os

url = 'https://kingsgateluxuryhomes.com/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    img_urls = re.findall(r'https://kingsgateluxuryhomes\.com/[^\'"\)\s]+\.(?:jpg|jpeg|png|webp)', html, re.IGNORECASE)
    
    all_urls = list(set(img_urls))
    valid_urls = [u for u in all_urls if 'logo' not in u.lower() and 'icon' not in u.lower() and 'sprite' not in u.lower() and 'close' not in u.lower()]
    
    out_dir = r'C:\Antigravity\speed-to-lead\Websites for businesses mock up\kingsgate\public\live-media'
    os.makedirs(out_dir, exist_ok=True)
    
    count = 0
    for u in valid_urls:
        if count >= 8:
            break
        try:
            print("Downloading:", u)
            req_img = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(req_img).read()
            with open(os.path.join(out_dir, f'live_asset_{count}.jpg'), 'wb') as f:
                f.write(img_data)
            count += 1
        except Exception as e:
            print("Failed to download:", u, e)
            
except Exception as e:
    print('Error:', e)
