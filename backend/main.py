from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.screenshot import router as screenshot_router

# ✅ Load .env file
load_dotenv()

app = FastAPI()

# ✅ CORS FIX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Routes
app.include_router(screenshot_router)

# ✅ Test Route
@app.get("/")
def home():
    return {"message": "CodeCanvas AI Backend Running"}