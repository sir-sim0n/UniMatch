"""Serve the generated UniMatch site locally, including correct WASM/module MIME types."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class SiteHandler(SimpleHTTPRequestHandler):
    # Windows file associations can otherwise label .mjs as text/plain.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.wasm': 'application/wasm',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.html': 'text/html',
        '.json': 'application/json',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    site = Path(__file__).resolve().parents[1] / 'build' / 'wasm' / 'site'
    if not (site / 'index.html').is_file():
        parser.error('Build the project first: cmake --build --preset wasm-debug')
    handler = partial(SiteHandler, directory=str(site))
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'UniMatch: http://127.0.0.1:{args.port}/', flush=True)
        print('Press Ctrl+C to stop the local server.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
