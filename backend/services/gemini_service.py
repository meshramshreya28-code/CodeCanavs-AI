import os
import json
import base64
import logging

logger = logging.getLogger("backend.services.gemini")

try:
    import google.generativeai as genai
    from dotenv import load_dotenv

    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        AI_ENABLED = True
        logger.info("Gemini AI enabled with gemini-1.5-flash-latest")
    else:
        AI_ENABLED = False
        logger.warning("GEMINI_API_KEY not set — AI disabled, using fallback")
except Exception as e:
    AI_ENABLED = False
    logger.warning("Gemini import failed: %s", e)


def basic_ui_score_analysis():
    return {
        "ui_score": 65,
        "ux_score": 60,
        "summary": "Basic heuristic analysis (no AI used).",
        "suggestions": [
            "Improve spacing consistency",
            "Increase CTA visibility",
            "Use better contrast for text",
            "Improve font hierarchy"
        ],
        "accessibility": ["Check color contrast ratios", "Add alt text for images"],
        "color_palette": ["#000000", "#FFFFFF", "#F5F5F5"],
        "font_pairings": ["Inter + Roboto"]
    }


def analyze_ui(image_path):
    if not AI_ENABLED:
        logger.warning("AI not enabled — using fallback scores")
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result

    try:
        logger.info("Reading image for Gemini: %s", image_path)

        # Read image as base64 and send inline — more reliable than upload_file
        with open(image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        prompt = """Analyze this website UI screenshot carefully.

Return ONLY valid JSON. No markdown, no backticks, no explanation.

Evaluate:
- Visual hierarchy and layout structure
- Spacing and whitespace usage
- Typography quality and readability
- Color scheme and contrast ratios
- Accessibility issues
- CTA (call-to-action) visibility
- Overall UX quality

Return exactly this JSON:
{
  "ui_score": <integer 0-100>,
  "ux_score": <integer 0-100>,
  "summary": "<2-3 sentence summary of the overall design>",
  "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>", "<improvement 5>"],
  "accessibility": ["<accessibility issue 1>", "<accessibility issue 2>"],
  "color_palette": ["<dominant hex color 1>", "<hex color 2>", "<hex color 3>"],
  "font_pairings": ["<detected font style description>"]
}"""

        response = model.generate_content([
            prompt,
            {
                "mime_type": "image/png",
                "data": image_data
            }
        ])

        if not response or not response.text:
            logger.warning("Empty response from Gemini — using fallback")
            result = basic_ui_score_analysis()
            result["analysis_mode"] = "fallback"
            return result

        cleaned = response.text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        parsed["analysis_mode"] = "ai"
        logger.info("Gemini done — UI: %s UX: %s", parsed.get("ui_score"), parsed.get("ux_score"))
        return parsed

    except json.JSONDecodeError as e:
        logger.exception("JSON parse error: %s", e)
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result
    except Exception as e:
        logger.exception("Gemini analysis failed: %s", e)
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result