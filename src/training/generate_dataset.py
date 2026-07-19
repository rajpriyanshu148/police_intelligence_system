import json
import os
from pathlib import Path
from src.utils.config_loader import PROJECT_ROOT

DATASET_PATH = PROJECT_ROOT / "data" / "train_dataset.jsonl"

# Base case profiles to synthesize multi-task training instances
CASE_PROFILES = [
    {
        "category": "Theft",
        "complaint": "My mobile phone, a black Samsung Galaxy S23, was stolen from my pocket while I was boarding the metro at Sector V station yesterday at around 6:30 PM. The suspect was a young male wearing a red jacket who pushed me during boarding.",
        "summary": "Mobile phone (Samsung Galaxy S23) stolen from victim's pocket at Sector V metro station by an unidentified male in a red jacket.",
        "entities": "Victim: Complainant; Suspect: Male in red jacket; Location: Sector V metro station; Stolen_Item: Samsung Galaxy S23 phone; Date: Yesterday 6:30 PM",
        "fir": "FIRST INFORMATION REPORT\nUnder Section 173 BNSS\n\nIncident Date/Time: Yesterday, 6:30 PM\nPlace: Sector V Metro Station\nComplainant: Citizen\nOffence: Theft under Section 303 BNS\nDetails: The complainant was boarding the metro train when an unknown male suspect wearing a red jacket pushed him and stealthily extracted his Samsung Galaxy S23 phone from his front right pocket. Suspect fled the scene.",
        "severity": "Low",
        "priority": "P3",
        "legal_sections": ["BNS Section 303"],
        "timeline": "[Yesterday 6:30 PM] Complainant arrives at Sector V metro station -> [Yesterday 6:31 PM] Suspect in red jacket pushes complainant and steals Samsung S23 -> [Yesterday 6:32 PM] Complainant realizes phone is missing; suspect escapes.",
        "status": "Under Investigation"
    },
    {
        "category": "Robbery",
        "complaint": "At 11:30 PM last night near Central Park, two men on a black Pulsar motorcycle blocked my way, brandished a knife, and threatened to stab me. They forced me to hand over my gold chain and wallet containing Rs 8,000. They then fled towards the highway.",
        "summary": "Armed robbery at knife-point near Central Park by two men on a black Pulsar motorcycle; stolen gold chain and wallet with Rs 8,000.",
        "entities": "Victim: Complainant; Suspects: Two men on black Pulsar; Location: Central Park; Weapon: Knife; Stolen_Item: Gold chain, wallet with Rs 8,000; Date: Last night 11:30 PM",
        "fir": "FIRST INFORMATION REPORT\nUnder Section 173 BNSS\n\nIncident Date/Time: Last night, 11:30 PM\nPlace: Near Central Park\nComplainant: Citizen\nOffence: Robbery under Section 309 BNS\nDetails: The complainant was intercepted by two unidentified male suspects riding a black Pulsar motorcycle. The suspects brandished a knife, placing the complainant in instant fear of death/hurt, and forcibly took his gold chain and wallet. Suspects fled towards the highway.",
        "severity": "High",
        "priority": "P1",
        "legal_sections": ["BNS Section 309"],
        "timeline": "[Last night 11:30 PM] Complainant intercepted by two men on black Pulsar -> [Last night 11:32 PM] Suspects brandish knife and demand valuables -> [Last night 11:33 PM] Complainant hands over gold chain and wallet -> [Last night 11:34 PM] Suspects escape towards highway.",
        "status": "Under Investigation"
    },
    {
        "category": "Cheating / Fraud",
        "complaint": "I received a phone call from an unknown number +91-9876543210 claiming to be a customer support officer from SBI Bank. He asked me to verify my card details and share the OTP for KYC verification. Shortly after, Rs 45,000 was debited from my account in three transactions.",
        "summary": "SBI banking vishing scam; victim tricked into sharing card details and OTP, resulting in unauthorized debit of Rs 45,000.",
        "entities": "Victim: Complainant; Suspect: Fake SBI agent (+91-9876543210); Location: Online / SBI Bank Portal; Stolen_Item: Rs 45,000; Date: Today",
        "fir": "FIRST INFORMATION REPORT\nUnder Section 173 BNSS\n\nIncident Date/Time: Today\nPlace: Cyber Space (SBI Bank Portal)\nComplainant: Citizen\nOffence: Cheating under Section 318 BNS\nDetails: The complainant was contacted by a cyber-fraudster masquerading as an SBI bank official. Using social engineering, the suspect extracted OTP and credit card credentials, subsequently initiating three unauthorized transactions totaling Rs 45,000.",
        "severity": "Medium",
        "priority": "P2",
        "legal_sections": ["BNS Section 318", "SOP-01 (Cyber Fraud)"],
        "timeline": "[Today 10:00 AM] Complainant receives call from fake SBI agent (+91-9876543210) -> [Today 10:05 AM] Complainant shares OTP under false pretense -> [Today 10:08 AM] Three transactions occur debiting Rs 45,000 -> [Today 10:15 AM] Complainant contacts bank to freeze account.",
        "status": "Under Investigation"
    },
    {
        "category": "Assault",
        "complaint": "My neighbor, Mr. Ramesh Kumar, assaulted me with a wooden stick this morning at around 8:00 AM during a dispute over parking in front of our residential building. I suffered a fracture in my left arm and was treated at City Hospital.",
        "summary": "Physical assault with a wooden stick by neighbor Ramesh Kumar during a parking dispute, resulting in a fractured left arm.",
        "entities": "Victim: Complainant; Suspect: Ramesh Kumar; Location: Parking space, residential building; Weapon: Wooden stick; Date: This morning 8:00 AM; Injury: Fractured left arm",
        "fir": "FIRST INFORMATION REPORT\nUnder Section 173 BNSS\n\nIncident Date/Time: This morning, 8:00 AM\nPlace: Residential Building Parking\nComplainant: Citizen\nOffence: Voluntarily Causing Hurt under Section 115 BNS\nDetails: A verbal dispute over a parking space escalated when the suspect, Ramesh Kumar, fetched a wooden stick and struck the complainant, causing a fractured left arm. Complainant was shifted to City Hospital.",
        "severity": "Medium",
        "priority": "P2",
        "legal_sections": ["BNS Section 115"],
        "timeline": "[This morning 8:00 AM] Parking argument starts between complainant and neighbor Ramesh Kumar -> [This morning 8:05 AM] Ramesh Kumar attacks complainant with a wooden stick -> [This morning 8:15 AM] Complainant taken to City Hospital with fractured left arm.",
        "status": "Under Investigation"
    },
    {
        "category": "Murder",
        "complaint": "We discovered the body of a security guard, Ram Singh, lying in a pool of blood at the entrance of the ABC warehouse today morning at 6 AM. The guard had deep throat cuts, and the warehouse main lock was found broken.",
        "summary": "Discovery of security guard Ram Singh's body with severe throat cuts at ABC warehouse entrance; warehouse lock broken.",
        "entities": "Victim: Ram Singh (Security Guard); Suspect: Unknown; Location: ABC warehouse entrance; Weapon: Sharp instrument (throat cuts); Date: Today morning 6:00 AM",
        "fir": "FIRST INFORMATION REPORT\nUnder Section 173 BNSS\n\nIncident Date/Time: Today morning, found at 6:00 AM\nPlace: ABC Warehouse Entrance\nComplainant: Warehouse supervisor\nOffence: Murder under Section 103 BNS\nDetails: The deceased, security guard Ram Singh, was found murdered at the ABC warehouse entrance with deep lacerations on the neck, indicating use of a sharp weapon. The warehouse main lock was broken, hinting at trespass or burglary.",
        "severity": "Critical",
        "priority": "P1",
        "legal_sections": ["BNS Section 103", "SOP-02 (Crime Scene)"],
        "timeline": "[Last Night 10:00 PM] Ram Singh begins guard shift -> [Today 6:00 AM] Body of Ram Singh discovered by supervisor -> [Today 6:15 AM] Police cordons off crime scene -> [Today 7:00 AM] Forensic team arrives at ABC warehouse.",
        "status": "Under Investigation"
    }
]

def generate():
    dataset = []
    
    # We will generate training instances for each task from the case profiles
    for profile in CASE_PROFILES:
        # Task 1: Classification
        dataset.append({
            "task": "complaint_classification",
            "instruction": "Analyze the text and classify the complaint into one of these categories: Theft, Robbery, Assault, Murder, Cheating / Fraud, Cybercrime.",
            "input": profile["complaint"],
            "output": profile["category"],
            "metadata": {"category": profile["category"]}
        })
        
        # Task 2: Summarization
        dataset.append({
            "task": "complaint_summarization",
            "instruction": "Summarize the following citizen crime complaint, capturing the core incident details.",
            "input": profile["complaint"],
            "output": profile["summary"],
            "metadata": {"category": profile["category"]}
        })
        
        # Task 3: NER Extraction
        dataset.append({
            "task": "named_entity_recognition",
            "instruction": "Perform Named Entity Recognition (NER) on the police complaint. Extract entities like Victim, Suspect, Location, Weapon, Stolen_Item, Date, and Injury.",
            "input": profile["complaint"],
            "output": profile["entities"],
            "metadata": {"category": profile["category"]}
        })
        
        # Task 4: FIR Generation
        dataset.append({
            "task": "fir_generation",
            "instruction": "Draft a formal First Information Report (FIR) under Section 173 BNSS based on the crime complaint text.",
            "input": profile["complaint"],
            "output": profile["fir"],
            "metadata": {"category": profile["category"], "legal_sections": profile["legal_sections"]}
        })
        
        # Task 5: Severity Prediction
        dataset.append({
            "task": "severity_prediction",
            "instruction": "Determine the severity of the crime described in the complaint. Options: Low, Medium, High, Critical.",
            "input": profile["complaint"],
            "output": profile["severity"],
            "metadata": {"category": profile["category"]}
        })

        # Task 6: Priority Prediction
        dataset.append({
            "task": "priority_prediction",
            "instruction": "Predict the dispatch and investigation priority for the police based on the complaint details. Options: P1 (Immediate), P2 (Urgent), P3 (Routine), P4 (Low Priority).",
            "input": profile["complaint"],
            "output": profile["priority"],
            "metadata": {"category": profile["category"]}
        })

        # Task 7: Legal Section Recommendation
        dataset.append({
            "task": "legal_recommendation",
            "instruction": "Recommend applicable legal sections from the Bharatiya Nyaya Sanhita (BNS) for the incident described in the complaint.",
            "input": profile["complaint"],
            "output": ", ".join(profile["legal_sections"]),
            "metadata": {"category": profile["category"]}
        })

        # Task 8: Timeline Generation
        dataset.append({
            "task": "timeline_generation",
            "instruction": "Construct a chronological timeline of events leading up to and during the incident described in the complaint.",
            "input": profile["complaint"],
            "output": profile["timeline"],
            "metadata": {"category": profile["category"]}
        })

        # Task 9: Case Status Prediction
        dataset.append({
            "task": "case_status_prediction",
            "instruction": "Predict the status of the case given the complaint details. Options: Under Investigation, Under Trial, Closed.",
            "input": profile["complaint"],
            "output": profile["status"],
            "metadata": {"category": profile["category"]}
        })

    # Let's multiply the data with slight variations to create a larger fine-tuning dataset
    expanded_dataset = []
    for record in dataset:
        expanded_dataset.append(record)
        # Duplicate with minor variations for training size
        var_record = record.copy()
        var_record["input"] = record["input"].replace("yesterday", "three days ago").replace("last night", "two days ago")
        expanded_dataset.append(var_record)

    os.makedirs(DATASET_PATH.parent, exist_ok=True)
    with open(DATASET_PATH, "w") as f:
        for item in expanded_dataset:
            f.write(json.dumps(item) + "\n")
            
    print(f"[Dataset] Generated {len(expanded_dataset)} instruction tuning training samples at {DATASET_PATH}")

if __name__ == "__main__":
    generate()
