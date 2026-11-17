"""Exercise student posting in an isolated browser against the built website."""
import functools
import json
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import threading

from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
site = root / 'build' / 'release' / 'site'
artifacts = root / 'build' / 'student-browser-results'
artifacts.mkdir(parents=True, exist_ok=True)
shutil.copy2(root / 'tests' / 'cloud-campus-harness.html', site / 'cloud-test.html')
mimetypes.add_type('text/javascript', '.mjs')
handler = functools.partial(SimpleHTTPRequestHandler, directory=str(site))
server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}'
checks = []

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(viewport={'width':1280,'height':900})
        page = context.new_page()
        failures = []
        page.on('pageerror', lambda error: failures.append(str(error)))
        page.goto(base + '/?demo=naledi')
        page.get_by_role('button', name='Create', exact=True).click()
        page.get_by_label('Post title', exact=True).fill('A fictional anonymous confession')
        page.get_by_label('Post text', exact=True).fill('A fictional campus experience for browser testing.')
        page.get_by_label('Post anonymously', exact=True).check()
        expect(page.get_by_role('region', name='Post preview')).to_contain_text('Anonymous OP')
        page.reload()
        page.get_by_role('button', name='Create', exact=True).click()
        expect(page.get_by_label('Post title', exact=True)).to_have_value('A fictional anonymous confession')
        expect(page.get_by_label('Post anonymously', exact=True)).to_be_checked()
        checks.append('Account-scoped draft restores text and anonymous identity')
        page.screenshot(path=str(artifacts / 'anonymous-composer.png'), full_page=True)
        page.get_by_role('button', name='Post', exact=True).click()
        link = page.get_by_role('link', name='A fictional anonymous confession (opens in a new tab)', exact=True)
        expect(link).to_be_visible()
        href = link.get_attribute('href')
        assert 'demo=' not in href
        expect(page.locator('.post-tile').filter(has=link)).to_contain_text('Anonymous OP')
        checks.append('Anonymous publication and share link omit demo persona')
        page.get_by_role('button', name='My profile', exact=True).click()
        expect(page.get_by_role('link', name='A fictional anonymous confession (opens in a new tab)', exact=True)).to_have_count(0)
        checks.append('Anonymous post excluded from public profile')
        page.get_by_role('button', name='Circles', exact=True).click()
        expect(page.get_by_role('link', name='NWU Vanderbijlpark Confessions (opens in a new tab)', exact=True)).to_be_visible()
        checks.append('Campus confession community available')
        discussion = context.new_page()
        discussion.on('pageerror', lambda error: failures.append(str(error)))
        discussion.goto(href)
        expect(discussion.get_by_text('Anonymous OP', exact=True)).to_be_visible()
        discussion.screenshot(path=str(artifacts / 'anonymous-discussion.png'), full_page=True)
        discussion.close()
        page.get_by_role('button', name='Moderation', exact=True).click()
        expect(page.get_by_role('heading', name='Community moderation')).to_be_visible()
        checks.append('Demo moderator queue opens')
        page.goto(base + '/cloud-test.html')
        page.get_by_role('button', name='Create', exact=True).click()
        expect(page.get_by_label('Post anonymously', exact=True)).to_be_visible()
        page.get_by_label('Post title', exact=True).fill('Cloud fixture confession')
        page.get_by_label('Your post', exact=True).fill('A synthetic post for a cloud interface test.')
        page.get_by_label('Post anonymously', exact=True).check()
        expect(page.get_by_role('region', name='Post preview')).to_contain_text('Anonymous OP')
        page.screenshot(path=str(artifacts / 'cloud-composer.png'), full_page=True)
        checks.append('Cloud composer has anonymous preview and category controls')
        account = context.new_page()
        account.on('pageerror', lambda error: failures.append(str(error)))
        identity = {'user':None}

        def cloud_response(route):
            request = route.request
            if request.method == 'OPTIONS':
                route.fulfill(status=204, headers={'Access-Control-Allow-Origin':'*',
                    'Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST,GET,OPTIONS'})
                return
            payload = request.post_data_json or {}
            path = payload.get('path')
            responses = {'/me':identity,
                '/student/status':{'version':'1.16.0','registrationOpen':False,'member':False},
                '/student/moderation':{'reports':[],'appeals':[],'actions':[]}}
            if path not in responses:
                route.abort()
                return
            route.fulfill(status=200, content_type='application/json',
                headers={'Access-Control-Allow-Origin':'*'},body=json.dumps(responses[path]))

        account.route('https://*.supabase.co/**', cloud_response)
        account.goto(base + '/cloud.html')
        expect(account.get_by_role('button', name='Create account', exact=True)).to_be_disabled()
        expect(account.get_by_label('Private username', exact=True)).to_be_visible()
        expect(account.get_by_role('button', name='Send password reset link', exact=True)).to_be_visible()
        checks.append('Cloud registration remains closed while email setup is deferred')
        identity['user'] = {'id':'11111111-1111-4111-8111-111111111111','handle':'fixture_operator',
            'displayName':'fixture_operator','studentMember':False,'isModerator':True,
            'deletionRequested':False,'university':'','campus':''}
        account.reload()
        expect(account.get_by_role('button', name='Verify a student mailbox', exact=True)).to_be_visible()
        expect(account.get_by_role('button', name='Delete account', exact=True)).to_be_visible()
        account.get_by_role('button', name='Reports', exact=True).click()
        expect(account.get_by_role('heading', name='Community moderation', exact=True)).to_be_visible()
        account.screenshot(path=str(artifacts / 'cloud-moderation.png'), full_page=True)
        checks.append('Explicit operator access and pre-enrollment account controls remain available')
        assert not failures, failures
        (artifacts / 'results.json').write_text(json.dumps({'passed':checks}, indent=2), encoding='utf-8')
        browser.close()
finally:
    (site / 'cloud-test.html').unlink(missing_ok=True)
    server.shutdown()
print('\n'.join(checks))
