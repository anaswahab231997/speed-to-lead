import urllib.request
import json
import time
import sys

def pull_llama3():
    print("Pulling LLaMA3 model (this may take a few minutes)...")
    url = "http://localhost:11434/api/pull"
    data = json.dumps({"name": "llama3"}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        # It's a stream of JSON objects
        for line in response:
            if line:
                chunk = json.loads(line.decode('utf-8'))
                if "status" in chunk:
                    print("Pull status:", chunk["status"])
                if chunk.get("status") == "success":
                    print("Model pulled successfully!")
                    return True
        return True
    except Exception as e:
        print(f"Failed to pull model: {e}")
        return False

def generate_opening_line(clinic_data):
    prompt = f"""You are an elite B2B sales strategist. You are analyzing a dental clinic's data to generate a custom cold outreach opening line.
    
    Data:
    Name: {clinic_data.get('title', 'Unknown')}
    Website: {clinic_data.get('website', 'No Website')}
    Reviews: {clinic_data.get('reviewsCount', 0)}
    Rating: {clinic_data.get('totalScore', 0)}
    
    Task:
    Extract exactly two things:
    1. The Clinic Name.
    2. A custom opening line highlighting a gap in their current patient intake. For example, if they have no website, mention that. If they have bad reviews or low count, mention that. If they have a website but it looks generic, assume they rely on a standard contact form and are losing after-hours patient inquiries. Keep it punchy, professional, and directly address a specific gap.

    Output FORMAT EXACTLY like this (and nothing else):
    Clinic: [Clinic Name]
    Line: [Custom Opening Line]
    """

    url = "http://localhost:11434/api/generate"
    data = json.dumps({
        "model": "llama3",
        "prompt": prompt,
        "stream": False
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode('utf-8'))
        return result.get('response', '')
    except Exception as e:
        print(f"Error calling Ollama API: {e}")
        return None

def main():
    # 1. Ensure model is pulled
    if not pull_llama3():
        return

    # 2. Load the leads
    input_file = r"c:\Antigravity\speed-to-lead\Websites for businesses mock up\apify_leads.json"
    output_file = r"c:\Antigravity\speed-to-lead\Websites for businesses mock up\intelligence_payload.json"
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            leads = json.load(f)
    except Exception as e:
        print(f"Error loading leads: {e}")
        return

    print(f"Processing {len(leads)} leads...")
    results = []

    for i, lead in enumerate(leads):
        title = lead.get('title', 'Unknown')
        safe_title = title.encode('ascii', 'ignore').decode('utf-8')
        print(f"Processing [{i+1}/{len(leads)}]: {safe_title}")
        
        response_text = generate_opening_line(lead)
        
        clinic_name = title
        line = "Could not generate opening line."
        
        if response_text:
            lines = response_text.strip().split('\n')
            for l in lines:
                if l.startswith("Clinic:"):
                    clinic_name = l.replace("Clinic:", "").strip()
                elif l.startswith("Line:"):
                    line = l.replace("Line:", "").strip()

        results.append({
            "original_title": title,
            "extracted_clinic": clinic_name,
            "opening_line": line,
            "website": lead.get('website'),
            "phone": lead.get('phone'),
            "reviews": lead.get('reviewsCount'),
            "rating": lead.get('totalScore')
        })

        # Save progress after each lead
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)

    print(f"\nCompleted processing {len(leads)} leads. Saved to {output_file}")

if __name__ == '__main__':
    main()
