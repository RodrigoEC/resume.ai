import os
from pathlib import Path

from dotenv import load_dotenv

# Resolved from this file, so it works regardless of the working directory.
ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env")

HF_TOKEN = os.getenv("HF_TOKEN")

def setup_huggingface() -> None:
    # Imported here so HF_HOME from .env is set before huggingface_hub reads it.
    from huggingface_hub import login
    login(HF_TOKEN, add_to_git_credential=True)


