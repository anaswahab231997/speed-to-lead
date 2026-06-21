import urllib.request
import json
import re
from html.parser import HTMLParser

url = "https://kingsgateluxuryhomes.com/"

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.images = []
        self.in_style = False
        self.in_script = False

    def handle_starttag(self, tag, attrs):
        if tag == 'style':
            self.in_style = True
        elif tag == 'script':
            self.in_script = True
        elif tag == 'img':
            for attr in attrs:
                if attr[0] == 'src':
                    self.images.append(attr[1])

    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False
        elif tag == 'script':
            self.in_script = False

    def handle_data(self, data):
        if not self.in_style and not self.in_script:
            cleaned = data.strip()
            if cleaned:
                self.text.append(cleaned)

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    
    parser = MyHTMLParser()
    parser.feed(html)
    
    # Extract Hex Codes (basic regex for hex colors)
    hex_codes = list(set(re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', html)))
    
    data = {
        "url": url,
        "extracted_text": parser.text,
        "extracted_images": parser.images,
        "hex_codes": hex_codes
    }
    
    with open(r"c:\Antigravity\speed-to-lead\Websites for businesses mock up\kingsgate\scrape_result.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    print("SCRAPE SUCCESS")
except Exception as e:
    print(f"SCRAPE FAILED: {e}")
