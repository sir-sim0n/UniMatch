"""Exercise student posting in an isolated browser against the built website."""
import functools
import json
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import threading
import base64

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
                    'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,x-supabase-api-version',
                    'Access-Control-Allow-Methods':'POST,GET,OPTIONS'})
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
        # Demo-only review: local attachments, previews, compact controls and navigation.
        media_page = context.new_page()
        media_page.on('pageerror', lambda error: failures.append(str(error)))
        media_page.goto(base + '/?demo=naledi')
        nav = media_page.locator('#navigation')
        labels = nav.get_by_role('button').all_text_contents()
        assert labels.index('Circles') == labels.index('Create') + 1, labels
        media_page.get_by_role('button',name='Create',exact=True).click()
        selector = media_page.get_by_label('Conversation category',exact=True)
        selector.select_option('N/A')
        assert selector.evaluate('(node) => node.getBoundingClientRect().height') <= 50
        checkbox = media_page.get_by_label('Post anonymously',exact=True)
        assert checkbox.evaluate('(node) => node.getBoundingClientRect().height') <= 24
        image = base64.b64decode(media_page.evaluate("() => {const c=document.createElement('canvas');c.width=32;c.height=32;c.getContext('2d').fillRect(0,0,32,32);return c.toDataURL('image/png');}").split(',')[1])
        media_page.get_by_label('Image or video',exact=True).set_input_files({'name':'fictional.png','mimeType':'image/png','buffer':image})
        expect(media_page.get_by_text('Attachment ready. It will appear below your title.',exact=True)).to_be_visible()
        media_page.get_by_label('Post title',exact=True).fill('Demo image review')
        media_page.get_by_label('Post text',exact=True).fill('A brief fictional caption beneath this attachment.')
        media_page.set_viewport_size({'width':390,'height':844})
        assert media_page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')
        media_page.screenshot(path=str(artifacts/'demo-mobile-composer.png'),full_page=True)
        media_page.set_viewport_size({'width':1280,'height':900})
        media_page.get_by_role('button',name='Post',exact=True).click()
        tile = media_page.locator('.post-tile').filter(has=media_page.get_by_role('link',name='Demo image review (opens in a new tab)',exact=True))
        expect(tile.locator('img.post-media')).to_be_visible()
        assert tile.locator('img.post-media').evaluate('(node) => node.complete && node.naturalWidth > 0')
        expect(tile.locator('.post-excerpt')).to_have_text('A brief fictional caption beneath this attachment.')
        expect(tile.locator('.comment-count')).to_contain_text('0')
        order = tile.evaluate('(node) => [...node.children].map(n => n.tagName)')
        assert order.index('H2') < order.index('IMG') < order.index('P'), order
        media_page.screenshot(path=str(artifacts/'demo-image-feed.png'),full_page=True)
        discussion_url = tile.locator('.comment-count').get_attribute('href')
        media_page.goto(discussion_url.replace('#','?demo=naledi#',1))
        comment = media_page.get_by_role('textbox',name='Comment on post',exact=False)
        comment.fill('A fictional browser-test reply.')
        comment.press('Tab')
        media_page.get_by_role('button',name='Reply',exact=True).first.click()
        media_page.get_by_role('button',name='Home',exact=True).click()
        tile = media_page.locator('.post-tile').filter(has=media_page.get_by_role('link',name='Demo image review (opens in a new tab)',exact=True))
        expect(tile.locator('.comment-count')).to_contain_text('1')
        media_page.get_by_role('button',name='Create',exact=True).click()
        # Create an actual playable short WebM clip with Chromium's recorder.
        clip = media_page.evaluate('''async () => {
          const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
          const stream=canvas.captureStream(5), recorder=new MediaRecorder(stream,{mimeType:'video/webm'}), chunks=[];
          const done=new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());stream.getTracks().forEach(t=>t.stop());resolve(Array.from(bytes));};});
          recorder.start();canvas.getContext('2d').fillRect(0,0,32,32);await new Promise(r=>setTimeout(r,300));recorder.stop();return done;
        }''')
        media_page.get_by_label('Image or video',exact=True).set_input_files({'name':'fictional.webm','mimeType':'video/webm','buffer':bytes(clip)})
        expect(media_page.get_by_text('Attachment ready. It will appear below your title.',exact=True)).to_be_visible()
        media_page.get_by_label('Post title',exact=True).fill('Demo video review')
        media_page.get_by_label('Post text',exact=True).fill('')
        media_page.get_by_role('button',name='Post',exact=True).click()
        video_tile=media_page.locator('.post-tile').filter(has=media_page.get_by_role('link',name='Demo video review (opens in a new tab)',exact=True))
        expect(video_tile.locator('video[controls]')).to_be_visible()
        media_page.reload()
        expect(media_page.get_by_role('link',name='Demo video review (opens in a new tab)',exact=True)).to_be_visible()
        expect(media_page.locator('video[controls]').first).to_be_visible()
        checks.append('Demo N/A, image/video persistence, comment totals, media order, compact mobile controls and Circles order')
        assert not failures, failures
        (artifacts / 'results.json').write_text(json.dumps({'passed':checks}, indent=2), encoding='utf-8')
        browser.close()
finally:
    (site / 'cloud-test.html').unlink(missing_ok=True)
    server.shutdown()
print('\n'.join(checks))
