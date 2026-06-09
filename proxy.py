#!/usr/bin/env python3
"""
proxy.py - Beeper Desktop API relay (Python version, no dependencies)

Run: python proxy.py
Then enter http://<your-ip>:23374 in the app's Connect screen.
"""
import http.server
import urllib.request
import urllib.error
import socket
import sys

BEEPER_HOST = "127.0.0.1"
BEEPER_PORT = 23373
PROXY_PORT  = 23374

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress per-request noise

    def send_cors(self, status=204):
        self.send_response(status)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_cors(204)

    def proxy(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None

        url = f"http://{BEEPER_HOST}:{BEEPER_PORT}{self.path}"
        req = urllib.request.Request(url, data=body, method=self.command)
        for k, v in self.headers.items():
            if k.lower() not in ("host", "content-length"):
                req.add_header(k, v)
        req.add_header("Host", f"{BEEPER_HOST}:{BEEPER_PORT}")

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for k, v in CORS.items():
                    self.send_header(k, v)
                for k, v in resp.headers.items():
                    if k.lower() not in ("transfer-encoding",):
                        self.send_header(k, v)
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.URLError as e:
            msg = str(e).encode()
            self.send_response(502)
            for k, v in CORS.items():
                self.send_header(k, v)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    do_GET = do_POST = do_PUT = do_DELETE = proxy

def get_local_ips():
    ips = []
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None):
            ip = info[4][0]
            if "." in ip and not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass
    return list(dict.fromkeys(ips))

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", PROXY_PORT), ProxyHandler)
    print(f"\n✓ Beeper proxy running")
    print(f"  Forwarding 0.0.0.0:{PROXY_PORT} → {BEEPER_HOST}:{BEEPER_PORT}\n")
    for ip in get_local_ips():
        print(f"  Enter in app:  http://{ip}:{PROXY_PORT}")
    print("\n  Keep this window open while using the app.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy stopped.")
        sys.exit(0)
