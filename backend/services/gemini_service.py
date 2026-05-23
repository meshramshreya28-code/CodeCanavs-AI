import os
import json
import base64
import logging

logger = logging.getLogger("backend.services.gemini")

AI_ENABLED = False
client = None

try:
    from google import genai
    from google.genai import types
    from dotenv import load_dotenv

    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        client = genai.Client(api_key=api_key)
        AI_ENABLED = True
        logger.info("Gemini AI enabled (google-genai SDK, gemini-2.0-flash)")
    else:
        logger.warning("GEMINI_API_KEY not set — using fallback scores")
except Exception as e:
    logger.warning("Gemini SDK import failed: %s", e)


def basic_ui_score_analysis():
    return {
        "ui_score": 65,
        "ux_score": 60,
        "summary": "Basic heuristic analysis (no AI used).",
        "suggestions": [
            "Improve spacing consistency",
            "Increase CTA visibility",
            "Use better contrast for text",
            "Improve font hierarchy",
            "Ensure mobile responsiveness"
        ],
        "accessibility": ["Check color contrast ratios", "Add alt text for images"],
        "color_palette": ["#000000", "#FFFFFF", "#F5F5F5"],
        "font_pairings": ["Inter + Roboto"]
    }


def analyze_ui(image_path):
    if not AI_ENABLED:
        logger.warning("AI not enabled — using fallback")
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result

    try:
        logger.info("Reading screenshot: %s", image_path)
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        prompt = """Analyze this website UI screenshot carefully.

Return ONLY valid JSON. No markdown, no backticks, no explanation before or after.

Evaluate:
- Visual hierarchy and layout structure
- Spacing and whitespace usage
- Typography quality and readability
- Color scheme and contrast ratios
- Accessibility issues
- CTA (call-to-action) visibility
- Overall UX quality and friction points

Return exactly this JSON structure:
{
  "ui_score": <integer 0-100>,
  "ux_score": <integer 0-100>,
  "summary": "<2-3 sentence overall design quality summary>",
  "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"],
  "accessibility": ["<issue 1>", "<issue 2>"],
  "color_palette": ["<hex1>", "<hex2>", "<hex3>"],
  "font_pairings": ["<detected font style>"]
}"""

        response = client.models.generate_content(
           model="gemini-2.5-flash",
            contents=[
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
            ]
        )

        if not response or not response.text:
            logger.warning("Empty Gemini response — fallback")
            result = basic_ui_score_analysis()
            result["analysis_mode"] = "fallback"
            return result

        cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        parsed["analysis_mode"] = "ai"
        logger.info("Gemini success — UI: %s UX: %s", parsed.get("ui_score"), parsed.get("ux_score"))
        return parsed

    except json.JSONDecodeError as e:
        logger.exception("JSON parse error from Gemini: %s", e)
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result
    except Exception as e:
        logger.warning(f"Gemini failed: {e}")

    return {
        "ui_score": 70,
        "ux_score": 68,
        "summary": "AI quota exceeded. Showing fallback UI analysis.",
        "suggestions": [
            "Improve button visibility",
            "Use consistent spacing",
            "Enhance typography hierarchy",
            "Optimize mobile responsiveness",
            "Improve accessibility contrast"
        ],
        "accessibility": [
            "Improve color contrast",
            "Add proper alt text"
        ],
        "color_palette": [
            "#0f172a",
            "#38bdf8",
            "#22c55e"
        ],
        "font_pairings": [
            "Inter + Poppins"
        ],
        "analysis_mode": "fallback"
    }
