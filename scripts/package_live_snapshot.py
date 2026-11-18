"""Keep the approved cloud UI independent of unpublished demo UI changes."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

source, site = (Path(arg).resolve() for arg in sys.argv[1:3])
commit = sys.argv[3]
web = source / 'web'
destination = site / 'demo-assets'
if destination.exists():
    raise SystemExit('Use a clean site directory; demo assets already exist.')
shutil.copytree(site / 'assets', destination)
demo_html = (site / 'index.html').read_text(encoding='utf-8')
(site / 'index.html').write_text(demo_html.replace('./assets/', './demo-assets/'), encoding='utf-8')
# Keep original cloud paths valid for cached HTML and already-open live tabs.
assets = site / 'assets'
for file in web.rglob('*'):
    if not file.is_file() or file.suffix == '.html':
        continue
    target = assets / file.relative_to(web)
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(file,target)
html = (web / 'cloud.html').read_text(encoding='utf-8')
(site / 'cloud.html').write_bytes((web / 'cloud.html').read_bytes())
digests = {}
for file in web.rglob('*'):
    if not file.is_file() or file.suffix == '.html':
        continue
    relative = file.relative_to(web)
    assert file.read_bytes() == (assets / relative).read_bytes(), relative
    digests['assets/'+relative.as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
assert (site / 'cloud.html').read_bytes() == (web / 'cloud.html').read_bytes()
digests['cloud.html'] = hashlib.sha256((web / 'cloud.html').read_bytes()).hexdigest()
(site / 'live-release.json').write_text(json.dumps({'sourceCommit':commit,'assets':digests},indent=2),encoding='utf-8')
print(f'Preserved approved live UI from {commit}: {len(digests)} byte-verified assets.')
