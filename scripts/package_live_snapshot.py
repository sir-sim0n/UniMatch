"""Keep the approved cloud UI independent of unpublished demo UI changes."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

source, site = (Path(arg).resolve() for arg in sys.argv[1:3])
commit = sys.argv[3]
web = source / 'web'
destination = site / 'live-assets'
if destination.exists():
    raise SystemExit('Use a clean site directory; frozen assets already exist.')
shutil.copytree(web, destination)
html = (web / 'cloud.html').read_text(encoding='utf-8')
(site / 'cloud.html').write_text(html.replace('./assets/', './live-assets/'), encoding='utf-8')
digests = {}
for file in destination.rglob('*'):
    if not file.is_file():
        continue
    relative = file.relative_to(destination)
    assert file.read_bytes() == (web / relative).read_bytes(), relative
    digests[relative.as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
assert (site / 'cloud.html').read_text(encoding='utf-8').replace('./live-assets/','./assets/') == html
(site / 'live-release.json').write_text(json.dumps({'sourceCommit':commit,'assets':digests},indent=2),encoding='utf-8')
print(f'Preserved approved live UI from {commit}: {len(digests)} byte-verified assets.')
