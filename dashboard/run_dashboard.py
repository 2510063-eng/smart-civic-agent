"""
CivicResolve AI — Municipal Admin & Verification Dashboard Local Runner
Zero-dependency HTTP server with auto-port fallback and automatic browser launch.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time

PORTS_TO_TRY = [3000, 3001, 3002, 8080, 5000]
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[CivicResolve] {self.address_string()} - {format % args}\n")
        sys.stderr.flush()

def open_browser(url):
    time.sleep(1.0)
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}", flush=True)

def run():
    os.chdir(DIRECTORY)
    httpd = None
    selected_port = None

    for port in PORTS_TO_TRY:
        try:
            httpd = ReusableTCPServer(("", port), Handler)
            selected_port = port
            break
        except OSError:
            continue

    if not httpd:
        print("ERROR: Could not bind to any test port (3000, 3001, 3002, 8080, 5000).", flush=True)
        sys.exit(1)

    url = f"http://localhost:{selected_port}"
    print("=" * 65, flush=True)
    print(" CIVICRESOLVE AI — MUNICIPAL ADMIN & VERIFICATION DASHBOARD", flush=True)
    print("=" * 65, flush=True)
    print(f" Dashboard URL : {url}", flush=True)
    print(f" Directory     : {DIRECTORY}", flush=True)
    print(f" Features      : Spatial GIS Map, AI Verification Studio, SLA Alerts", flush=True)
    print(f" Opening browser automatically...", flush=True)
    print("=" * 65, flush=True)
    print("Press Ctrl+C in this terminal to stop the server.\n", flush=True)

    # Launch browser in separate thread
    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard server stopped cleanly.", flush=True)
    finally:
        httpd.server_close()

if __name__ == "__main__":
    run()
