"""
CivicResolve AI — Municipal Admin & Verification Dashboard Local Runner
Zero-dependency HTTP server to launch the dashboard instantly on any machine.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Clean logging
        sys.stderr.write(f"[CivicResolve Console] {self.address_string()} - {format % args}\n")

def run():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 65)
        print(" CIVICRESOLVE AI — MUNICIPAL ADMIN & VERIFICATION DASHBOARD")
        print("=" * 65)
        print(f" Dashboard URL : http://localhost:{PORT}")
        print(f" Working Dir   : {DIRECTORY}")
        print(f" Features      : GIS Spatial Map, SLA Alerts, AI Verification Studio")
        print(f" Integration   : Configured to connect to http://localhost:8000/api")
        print("=" * 65)
        print("Press Ctrl+C to stop the dashboard server.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nDashboard server stopped cleanly.")

if __name__ == "__main__":
    run()
