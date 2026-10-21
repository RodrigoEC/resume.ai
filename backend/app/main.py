from fastapi import FastAPI

from app.api.routes import xp, health
from app.core.config import setup_huggingface

setup_huggingface()

app = FastAPI(title="resume.ai")
app.include_router(xp.router)
app.include_router(health.router)





        