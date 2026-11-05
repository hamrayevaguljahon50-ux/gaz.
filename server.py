#!/usr/bin/env python3
"""
PetroFlow Fuel & Gas Station - Local Web Server & Development Host
Serves the station dashboard, kirim.html, and mobile views with auto-port detection.
No external pip dependencies required - runs on pure Python standard library.
"""

import os
import sys
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class StationHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Default route redirects to html/index.html or index.html
        if self.path == "/" or self.path == "":
            if os.path.exists(os.path.join(DIRECTORY, "html", "index.html")):
                self.send_response(302)
                self.send_header("Location", "/html/index.html")
                self.end_headers()
                return
            elif os.path.exists(os.path.join(DIRECTORY, "index.html")):
                self.send_response(302)
                self.send_header("Location", "/index.html")
                self.end_headers()
                return

        # Simple API endpoint to fetch station data
        if self.path == "/api/data":
            data_file = os.path.join(DIRECTORY, "station_data.json")
            if os.path.exists(data_file):
                with open(data_file, "r", encoding="utf-8") as f:
                    content = f.read()
            else:
                content = json.dumps({"status": "no_data_yet"})
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))
            return

        return super().do_GET()

    def do_POST(self):
        # API endpoint to save station data from browser
        if self.path == "/api/data":
            length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(length).decode("utf-8")
            data_file = os.path.join(DIRECTORY, "station_data.json")
            try:
                # Validate JSON
                parsed = json.loads(post_body)
                with open(data_file, "w", encoding="utf-8") as f:
                    json.dump(parsed, f, indent=2, ensure_ascii=False)
                
                response = json.dumps({"success": True, "message": "Station data synced successfully"})
                self.send_response(200)
            except Exception as e:
                response = json.dumps({"success": False, "error": str(e)})
                self.send_response(400)

            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(response.encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def run_server(port=PORT):
    server_address = ("", port)
    try:
        httpd = HTTPServer(server_address, StationHTTPHandler)
    except OSError:
        port += 1
        httpd = HTTPServer(("", port), StationHTTPHandler)

    url = f"http://localhost:{port}/html/index.html"
    print("=" * 65)
    print("  PETROFLOW FUEL & GAS STATION - LOCAL WEB SERVER")
    print(f"  Serving directory : {DIRECTORY}")
    print(f"  Main Dashboard    : {url}")
    print(f"  Delivery Terminal : http://localhost:{port}/html/kirim.html")
    print(f"  Mobile Terminal   : http://localhost:{port}/html/m.index.html")
    print(f"  Handheld Dispenser: http://localhost:{port}/html/m.html")
    print("=" * 65)
    print("Press Ctrl+C to stop the server.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Shutting down PetroFlow server.")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    run_server()

