import os
import uuid
import asyncio
import logging
import subprocess

# Force Playwright to use a writable path on Render
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "/opt/render/project/src/.cache/ms-playwright"

logger = logging.getLogger("backend.services.screenshot")

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed")

_browser = None
_playwright = None


async def _get_browser():
    global _browser, _playwright
    if _browser is None:
        logger.info("Launching Chromium...")
        
        # Install browser if missing
        try:
            result = subprocess.run(
                ["playwright", "install", "chromium"],
                capture_output=True, text=True, timeout=120
            )
            logger.info("Playwright install output: %s", result.stdout)
            if result.returncode != 0:
                logger.warning("Playwright install stderr: %s", result.stderr)
        except Exception as e:
            logger.warning("Could not run playwright install: %s", e)

        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process",
                "--no-zygote",
            ],
        )
        logger.info("Chromium launched.")
    return _browser


async def _capture_async(url: str) -> str:
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright not installed")

    upload_dir = "/tmp/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, f"{uuid.uuid4()}.png")

    browser = await _get_browser()
    page = await browser.new_page(viewport={"width": 1366, "height": 768})
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.screenshot(path=filepath, full_page=False)
        logger.info("Screenshot saved: %s", filepath)
        return filepath
    finally:
        await page.close()


def capture_website(url: str, timeout: int = 60) -> str:
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright not installed")

    import concurrent.futures

    def run_in_new_loop():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(
                asyncio.wait_for(_capture_async(url), timeout=timeout)
            )
        finally:
            loop.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(run_in_new_loop)
        try:
            return future.result(timeout=timeout + 5)
        except concurrent.futures.TimeoutError:
            raise RuntimeError(f"Screenshot timed out after {timeout}s")