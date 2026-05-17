import os
import uuid

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    sync_playwright = None
    PLAYWRIGHT_AVAILABLE = False


def capture_website(url: str):

    # Generate unique image name
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is not installed")

    filename = f"{uuid.uuid4()}.png"
    filepath = f"uploads/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with sync_playwright() as p:

        # Launch browser
        browser = p.chromium.launch(headless=True, timeout=10000)

        # Create page
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.set_default_navigation_timeout(10000)

        # Open website
        page.goto(url, wait_until="domcontentloaded", timeout=10000)

        # Take screenshot
        page.screenshot(path=filepath, full_page=True)

        # Close browser
        browser.close()

    return filepath