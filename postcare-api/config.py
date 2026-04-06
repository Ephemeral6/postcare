import os
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("ZEABUR_AI_HUB_API_KEY", os.getenv("DEEPSEEK_API_KEY", ""))
DEEPSEEK_BASE_URL = "https://hnd1.aihub.zeabur.ai/v1"
DEEPSEEK_MODEL = "claude-sonnet-4-5"
