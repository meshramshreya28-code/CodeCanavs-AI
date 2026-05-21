import os
import uuid
import asyncio
import logging

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
    """
    Always spawns a fresh event loop in a new thread.
    This avoids the 'no current event loop' error in AnyIO/uvloop worker threads.
    """
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright not installed")

    import concurrent.futures

    def run_in_new_loop():
        # Each thread gets its own fresh event loop — no conflict with uvloop
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