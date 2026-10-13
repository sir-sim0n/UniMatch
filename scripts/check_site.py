"""Fail deployment if the staged website is incomplete or contains unexpected files."""
from pathlib import Path
import sys

site = Path(sys.argv[1]).resolve()
expected = {
    'index.html', '.nojekyll', 'assets/app.js', 'assets/api-client.mjs',
    'assets/persistence.mjs', 'assets/styles.css', 'assets/favicon.svg',
    'assets/waves.svg', 'assets/unimatch.mjs', 'assets/unimatch.wasm',
    'data/catalogues.json', 'data/profiles.json',
}
actual = {p.relative_to(site).as_posix() for p in site.rglob('*') if p.is_file()}
if actual != expected:
    raise SystemExit(f'Site file mismatch. Missing: {sorted(expected-actual)}; unexpected: {sorted(actual-expected)}')
if any(p.is_symlink() for p in site.rglob('*')):
    raise SystemExit('Site must not contain symlinks.')
if (site / 'assets/unimatch.wasm').read_bytes()[:4] != b'\x00asm':
    raise SystemExit('WebAssembly binary is invalid or missing.')
for name in expected - {'.nojekyll'}:
    if (site / name).stat().st_size == 0:
        raise SystemExit(f'Empty site asset: {name}')
print(f'Publication check passed: {len(expected)} expected files, including WebAssembly and fictional data.')
