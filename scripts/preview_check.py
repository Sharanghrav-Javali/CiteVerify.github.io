"""Short-lived static preview checks. Build the application before running."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root / 'dist')))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as p, TemporaryDirectory() as temp:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        for width, height in [(1440, 1000), (1280, 900), (1024, 900), (768, 900), (390, 844), (360, 800)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
            errors=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}', wait_until='networkidle')
            page.screenshot(path=f'{temp}/citeverify-{width}.png', full_page=True)
            overflow = page.evaluate('document.documentElement.scrollWidth - innerWidth')
            assert overflow <= 0, f'{width}px viewport has {overflow}px horizontal overflow'
            assert page.locator('.metric-card').count() == 4
            assert page.locator('.reader-panel').is_visible()
            if width <= 820:
                assert page.locator('.mobile-workspace-tabs').is_visible()
            else:
                assert page.locator('.reader-panel').bounding_box()['x'] < page.locator('.inspector-panel').bounding_box()['x']
            assert not errors, errors
            print(width, 'viewport; no horizontal overflow; browser errors:', errors)
            page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
