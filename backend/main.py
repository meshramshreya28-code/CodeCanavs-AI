from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.screenshot import router as screenshot_router

app = FastAPI()

# ✅ CORS FIX (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screenshot_router)

@app.get("/")
def home():
    return {"message": "CodeCanvas AI Backend Running"}