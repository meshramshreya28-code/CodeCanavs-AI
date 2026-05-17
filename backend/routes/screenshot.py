import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.screenshot_service import capture_website
from services.gemini_service import analyze_ui, basic_ui_score_analysis
import time

logger = logging.getLogger("backend.routes.screenshot")

# Simple in-memory cache: {url: (result_dict, timestamp)}
CACHE = {}
CACHE_TTL = 60 * 10  # 10 minutes

router = APIRouter()

class AnalyzeRequest(BaseModel):
    url: str

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "CodeCanvas AI Backend"}


@router.post("/analyze/url")
def analyze_url(request: AnalyzeRequest):

    url = request.url
    if not url:
        raise HTTPException(status_code=400, detail="Missing url")

    logger.info("Received analyze request for URL: %s", url)

    # Return cached result if available and fresh
    cached = CACHE.get(url)
    if cached:
        result, ts = cached
        if time.time() - ts < CACHE_TTL:
            result = result.copy()
            result["analysis_mode"] = result.get("analysis_mode", "cached")
            return result

    # Step 1: take screenshot
    try:
        screenshot_path = capture_website(url, timeout=25)

        # Step 2: AI analysis
        result = analyze_ui(screenshot_path)
        if result is None:
            raise RuntimeError("No result from AI analysis")
        result["analysis_mode"] = result.get("analysis_mode", "ai")
        logger.info("Analysis completed for %s", url)
        # Cache successful result
        try:
            CACHE[url] = (result.copy(), time.time())
        except Exception:
            pass
    except Exception as exc:
        logger.exception("Analysis failed for %s", url)
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        try:
            CACHE[url] = (result.copy(), time.time())
        except Exception:
            pass

    # Step 3: return ONLY JSON
    return result