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
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Missing url")

    # Add https:// if missing
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    logger.info("Received analyze request for URL: %s", url)

    # Return cached result if available and fresh
    cached = CACHE.get(url)
    if cached:
        result, ts = cached
        if time.time() - ts < CACHE_TTL:
            result = result.copy()
            result["analysis_mode"] = result.get("analysis_mode", "cached")
            logger.info("Returning cached result for %s", url)
            return result

    # Step 1: screenshot — 60s timeout to handle Render cold starts
    try:
        logger.info("Starting screenshot capture for %s", url)
        screenshot_path = capture_website(url, timeout=60)
        logger.info("Screenshot captured: %s", screenshot_path)

        # Step 2: AI analysis
        result = analyze_ui(screenshot_path)
        if result is None:
            raise RuntimeError("No result from AI analysis")
        result["analysis_mode"] = result.get("analysis_mode", "ai")
        logger.info("Analysis completed for %s", url)

        # Cache successful result
        CACHE[url] = (result.copy(), time.time())

    except Exception as exc:
        logger.exception("Analysis failed for %s: %s", url, exc)
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        CACHE[url] = (result.copy(), time.time())

    return result