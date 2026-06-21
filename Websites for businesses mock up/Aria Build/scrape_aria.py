import urllib.request
import re
import json
import os
from html.parser import HTMLParser

url = "http://ariabuild.ca/"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req, timeout=10)
    html_content = response.read().decode('utf-8')
except Exception as e:
    html_content = ""
    print("Error fetching URL:", e)

class SimpleHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_data = []
        self.images = []
        self.css_links = []
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'img' and 'src' in attrs_dict:
            self.images.append(attrs_dict['src'])
        elif tag == 'link' and attrs_dict.get('rel') == 'stylesheet' and 'href' in attrs_dict:
            self.css_links.append(attrs_dict['href'])
        elif 'style' in attrs_dict:
            pass # Inline styles could be parsed
            
    def handle_data(self, data):
        stripped = data.strip()
        if stripped and len(stripped) > 20:
            self.text_data.append(stripped)

parser = SimpleHTMLParser()
parser.feed(html_content)

# Regex to find hex colors in HTML (inline)
hex_colors = set(re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', html_content))
font_families = set(re.findall(r'font-family:\s*([^;]+)', html_content))

# Look through the text for keywords about process, materials, communication
process_keywords = ["process", "management", "communication", "material", "build", "design", "step", "quality", "service"]
brand_copy = [text for text in parser.text_data if any(kw in text.lower() for kw in process_keywords)]

data_payload = {
    "brand_name": "Aria Build",
    "url": url,
    "brand_copy": brand_copy[:10], # Top 10 matches
    "high_ticket_services": [text for text in parser.text_data if "custom" in text.lower() or "luxury" in text.lower()],
    "design_tokens": {
        "colors": list(hex_colors)[:5], # Sample
        "fonts": list(font_families)[:3]
    },
    "legacy_media": parser.images
}

out_dir = r"C:\Antigravity\speed-to-lead\Websites for businesses mock up\Aria Build"
src_dir = os.path.join(out_dir, "src")
os.makedirs(src_dir, exist_ok=True)

with open(os.path.join(src_dir, "data.json"), "w", encoding="utf-8") as f:
    json.dump(data_payload, f, indent=2)

print("Scraping completed.")
