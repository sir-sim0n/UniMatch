"""Serve only browser regression pages and application modules on loopback."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, unquote
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def translate_path(self,path):
        name=unquote(urlparse(path).path)
        if name=='/':name='/storage.html'
        base=ROOT/'web' if name.startswith('/assets/') else ROOT/'tests/browser'
        relative=name[len('/assets/'):] if name.startswith('/assets/') else name.lstrip('/')
        target=(base/relative).resolve()
        return str(target if target.is_relative_to(base.resolve()) else ROOT/'tests/browser/not-found')
if __name__=='__main__':
    print('Browser storage tests: http://127.0.0.1:8031/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8031),Handler).serve_forever()
