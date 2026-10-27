"""Fail deployment if the staged website is incomplete or contains unexpected files."""
from pathlib import Path
import sys

site = Path(sys.argv[1]).resolve()
expected = {
    'index.html', 'cloud.html', 'assets/cloud-ui.mjs', 'assets/cloud-client.mjs', 'assets/cloud-config.mjs', 'assets/vendor/supabase.mjs', 'assets/vendor/THIRD_PARTY_NOTICES.txt', '.nojekyll', 'assets/community-core.mjs', 'assets/community-ui.mjs', 'assets/indexed-social.mjs', 'assets/games-core.mjs', 'assets/games-ui.mjs', 'assets/theme.js', 'assets/discovery-core.mjs', 'assets/engagement-core.mjs', 'assets/demo-accounts.mjs', 'assets/demo-social.mjs', 'assets/social-ui.mjs', 'assets/feed-core.mjs', 'assets/feed-ui.mjs', 'assets/ui-icons.mjs', 'assets/circles-core.mjs', 'assets/circles-ui.mjs', 'assets/messages-ui.mjs', 'assets/app.js', 'assets/api-client.mjs',
    'assets/persistence.mjs', 'assets/styles.css', 'assets/favicon.svg',
    'assets/orbit-mark.svg', 'assets/orbit-logo.svg', 'assets/orbit-logo-stacked.svg', 'assets/unimatch.mjs', 'assets/unimatch.wasm',
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
