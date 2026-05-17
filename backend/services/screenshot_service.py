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
    logger.warning("Playwright not installed — screenshots disabled")

# Persistent browser instance (created once, reused across requests)
_playwright = None
_browser = None
_browser_lock = asyncio.Lock()


async def _ensure_browser():
    global _playwright, _browser
    async with _browser_lock:
        if _browser is None:
            logger.info("Launching Chromium (first time — may take 30s on cold start)...")
            _playwright = await async_playwright().start()
            _browser = await _playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--single-process",          # important for Render free tier
                    "--no-zygote",
                ],
            )
            logger.info("Chromium launched successfully.")
    return _browser


async def _capture_async(url: str) -> str:
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is not installed")

    # Ensure uploads directory exists
    upload_dir = "/tmp/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4()}.png"
    filepath = os.path.join(upload_dir, filename)

    browser = await _ensure_browser()

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
    Synchronous wrapper around the async capture function.
    Uses asyncio.run() so it works from FastAPI sync routes too.
    Timeout is 60s to handle Render cold starts.
    """
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is not installed")

    try:
        # If there's already a running event loop (e.g. inside async context), use it
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context — run in a new thread loop
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(asyncio.run, _capture_async(url))
                return future.result(timeout=timeout)
        else:
            return loop.run_until_complete(
                asyncio.wait_for(_capture_async(url), timeout=timeout)
            )
    except asyncio.TimeoutError:
        raise RuntimeError(f"Screenshot timed out after {timeout}s for URL: {url}")
    except Exception as e:
        logger.exception("Screenshot failed for %s", url)
        raise