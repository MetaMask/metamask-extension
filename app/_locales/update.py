import os
import json

def update_messages_json():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for root, dirs, files in os.walk(script_dir):
        if "messages.json" in files:
            file_path = os.path.join(root, "messages.json")
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    print(f"Skipping invalid JSON file: {file_path}")
                    continue

            modified = False
            for key, value in data.items():
                for field in ["message", "description"]:
                    if field in value and "MetaMask" in value[field]:
                        value[field] = value[field].replace("MetaMask", "Widllet")
                        modified = True

            if modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"Updated: {file_path}")

# Run it
if __name__ == "__main__":
    update_messages_json()