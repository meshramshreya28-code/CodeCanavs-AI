import os
import uuid
import time
import atexit

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    sync_playwright = None
    PLAYWRIGHT_AVAILABLE = False

# Keep a persistent Playwright/browser instance to avoid launching per-request
_playwright = None
_browser = None


def _ensure_browser():
    global _playwright, _browser
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is not installed")
    if _browser is None:
        # start playwright once
        _playwright = sync_playwright().start()
        _browser = _playwright.chromium.launch(headless=True, args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"], timeout=30000)
    return _browser


def _shutdown():
    global _playwright, _browser
    try:
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()
    except Exception:
        pass


atexit.register(_shutdown)


def capture_website(url: str):

    # Generate unique image name
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is not installed")

    filename = f"{uuid.uuid4()}.png"
    filepath = f"uploads/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    browser = _ensure_browser()

    # Create page
    page = browser.new_page(viewport={"width": 1366, "height": 768})
    # Slightly higher navigation timeout but avoid relaunch overhead
    page.set_default_navigation_timeout(20000)

    # Open website (wait for domcontentloaded only)
    page.goto(url, wait_until="domcontentloaded", timeout=20000)

    # Take screenshot (limit to viewport to speed up)
    page.screenshot(path=filepath, full_page=False)

    # Close page but keep browser alive
    try:
        page.close()
    except Exception:
        pass

    return filepath