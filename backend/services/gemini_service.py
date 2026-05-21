import os
import json
import logging

logger = logging.getLogger("backend.services.gemini")

try:
    import google.generativeai as genai
    from dotenv import load_dotenv

    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    logger.info("GEMINI_API_KEY present: %s", bool(api_key))
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro-vision")
    AI_ENABLED = True
    logger.info("Gemini AI enabled.")
except Exception as e:
    logger.warning("Gemini init failed: %s", e)
    AI_ENABLED = False


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
        "accessibility": [
            "Check color contrast ratios",
            "Add alt text for images"
        ],
        "color_palette": ["#000000", "#FFFFFF", "#F5F5F5"],
        "font_pairings": ["Inter + Roboto"]
    }


def analyze_ui(image_path):
    if not AI_ENABLED:
        logger.warning("AI not enabled, using fallback.")
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result

    try:
        logger.info("Reading image: %s", image_path)
        import PIL.Image
        image = PIL.Image.open(image_path)

        prompt = """
        Analyze this website UI screenshot.

        Return ONLY valid JSON.

        Analyze:
        - UI hierarchy
        - spacing
        - typography
        - color usage
        - accessibility
        - CTA visibility
        - responsiveness
        - UX issues

        JSON format:

        {
          "ui_score": 0,
          "ux_score": 0,
          "summary": "",
          "suggestions": [],
          "accessibility": [],
          "color_palette": [],
          "font_pairings": []
        }
        """

        response = model.generate_content([prompt, image])
        logger.info("Gemini response received.")

        if not response or not response.text:
            logger.warning("Empty response from Gemini.")
            result = basic_ui_score_analysis()
            result["analysis_mode"] = "fallback"
            return result

        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        parsed["analysis_mode"] = "ai"
        logger.info("AI analysis successful.")
        return parsed

    except Exception as e:
        logger.exception("Gemini analysis failed: %s", e)
        result = basic_ui_score_analysis()
        result["analysis_mode"] = "fallback"
        return result