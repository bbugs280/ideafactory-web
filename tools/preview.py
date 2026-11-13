#!/usr/bin/env python3
"""Dev preview server for ideafactory-web.

WHY THIS EXISTS
---------------
The stock `python3 -m http.server` sends no Cache-Control header, so browsers
fall back to *heuristic* caching: they invent a freshness lifetime from the
Last-Modified date and serve the stale file without revalidating. Measured
2026-11-13: after editing product-pages.css and main.js, the browser kept
serving a 116-rule stylesheet with none of the new rules, and a main.js with
no scrollRestoration fix. Every verification pass read stale bytes and
reported "the fix isn't working" when the files on disk were correct.

That cost an hour of false debugging, so the preview server now sets
`Cache-Control: no-store` on every response. Development is exactly the case
where you never want a cached byte.
"""

import http.server
import socketserver


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Threaded so one browser keep-alive connection cannot block every other
    request. The stock single-threaded TCPServer deadlocked the preview on
    2026-11-13: curl hung for 60s because the browser held an idle socket."""

    daemon_threads = True
    allow_reuse_address = True

PORT = 8766


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # Quiet by default; uncomment to debug request paths.
        pass


if __name__ == "__main__":
    with ThreadingHTTPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"serving at http://localhost:{PORT}/ (no-store, threaded)")
        httpd.serve_forever()
