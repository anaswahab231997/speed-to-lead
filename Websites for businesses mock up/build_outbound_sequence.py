import json
import os

def build_outbound():
    workspace = r"c:\Antigravity\speed-to-lead\Websites for businesses mock up"
    payload_path = os.path.join(workspace, "intelligence_payload.json")
    template_path = os.path.join(workspace, "layla_payload_template.txt")
    output_json = os.path.join(workspace, "final_outbound_payload.json")
    output_sample = os.path.join(workspace, "outbound_sample.txt")

    with open(payload_path, "r", encoding="utf-8") as f:
        leads = json.load(f)

    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    final_payloads = []

    for lead in leads:
        clinic_name = lead.get('extracted_clinic', 'Clinic Director')
        opening_line = lead.get('opening_line', '')
        
        # Determine First Name or Title
        # For simplicity, if we don't have a specific first name mapped, we use 'Clinic Director'
        # Or if the clinic name is a doctor's name (like Dr. Carolina G. So), we use "Dr. Carolina"
        if "Dr." in clinic_name:
            # Extract basic doctor name
            parts = clinic_name.split()
            dr_name = "Clinic Director"
            for i, p in enumerate(parts):
                if p.lower() == "dr.":
                    if i + 1 < len(parts):
                        dr_name = parts[i] + " " + parts[i+1]
                    break
            first_name = dr_name
        else:
            first_name = "Clinic Director"

        # Perform template replacements
        email_body = template.replace("[Clinic Name]", clinic_name)
        email_body = email_body.replace("[First Name or Clinic Director]", first_name)
        
        # Replace the LLaMA3 line, handling the trailing period if the line already ends with punctuation
        hook_placeholder1 = "[Insert the custom LLaMA3 opening line here]."
        hook_placeholder2 = "[Insert the custom LLaMA3 opening line here]"
        
        if hook_placeholder1 in email_body:
            if opening_line.strip().endswith(('.', '?', '!')):
                email_body = email_body.replace(hook_placeholder1, opening_line)
            else:
                email_body = email_body.replace(hook_placeholder1, opening_line + ".")
        elif hook_placeholder2 in email_body:
            email_body = email_body.replace(hook_placeholder2, opening_line)

        final_payloads.append({
            "target_clinic": clinic_name,
            "target_email": lead.get('emails', [''])[0] if isinstance(lead.get('emails'), list) and len(lead.get('emails')) > 0 else 'Unknown',
            "target_phone": lead.get('phone', 'Unknown'),
            "email_content": email_body
        })

    # Save full JSON payload
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(final_payloads, f, indent=2)

    # Save a sample text file of the first 3 emails for the Director to review
    with open(output_sample, "w", encoding="utf-8") as f:
        f.write("=== PHASE 3 OUTBOUND SAMPLES ===\n\n")
        for i in range(min(3, len(final_payloads))):
            f.write(f"--- EMAIL {i+1} ---\n")
            f.write(f"To: {final_payloads[i]['target_clinic']} | Email: {final_payloads[i]['target_email']}\n")
            f.write("--------------------------------------------------\n")
            f.write(final_payloads[i]['email_content'] + "\n")
            f.write("--------------------------------------------------\n\n")

    print(f"Phase 3 Execution Complete. {len(final_payloads)} outbound payloads generated.")
    print(f"Full payload saved to: {output_json}")
    print(f"Sample review saved to: {output_sample}")

if __name__ == '__main__':
    build_outbound()
