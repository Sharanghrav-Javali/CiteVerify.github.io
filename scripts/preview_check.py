"""Short-lived static preview checks. Build the application before running."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root / 'dist')))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        for width, height in [(1440, 1000), (1280, 900), (390, 844)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
            errors=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}', wait_until='networkidle')
            page.screenshot(path=f'/tmp/citeverify-{width}.png', full_page=True)
            print(width, 'viewport; horizontal overflow:', page.evaluate('document.documentElement.scrollWidth - innerWidth'), 'errors:', errors)
            print('Panels start at:', page.locator('.workspace').bounding_box()['y'], 'selected claim position:', page.locator('.selected-passage').bounding_box())
            page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
