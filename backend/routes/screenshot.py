from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.screenshot_service import capture_website
from services.gemini_service import analyze_ui, basic_ui_score_analysis

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str

@router.post("/analyze/url")
def analyze_url(request: AnalyzeRequest):

    url = request.url
    if not url:
        raise HTTPException(status_code=400, detail="Missing url")

    # Step 1: take screenshot
    try:
        screenshot_path = capture_website(url)

        # Step 2: AI analysis
        result = analyze_ui(screenshot_path)
        if result is None:
            raise RuntimeError("No result from AI analysis")
        result["analysis_mode"] = result.get("analysis_mode", "ai")
    except Exception:
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"

    # Step 3: return ONLY JSON
    return result