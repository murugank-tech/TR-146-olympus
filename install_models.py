import spacy
import subprocess
import sys

def install_models():
    print("Installing spaCy model 'en_core_web_trf' (more accurate for anonymization)...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        print("Model 'en_core_web_sm' installed successfully.")
    except Exception as e:
        print(f"Error installing model: {e}")

if __name__ == "__main__":
    install_models()
