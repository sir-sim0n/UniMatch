import {mediaComposer} from './demo-media.mjs?v=1.17.0-demo';
import {STUDENT_CATEGORIES, DraftStore, PILOT} from './student-core.mjs?v=1.17.0-demo';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function action(text, callback) {
  const button = element('button', text, 'secondary');
  button.type = 'button';
  button.onclick = async () => {
    button.disabled = true;
    try { await callback(); }
    finally { if (button.isConnected) button.disabled = false; }
  };
  return button;
}

export function postingOptions(form, {account, draftAccount = account, title, body, cloud = false, audience = null}) {
  if (!cloud) form.classList.add('demo-post-form');
  const drafts = new DraftStore((cloud ? 'cloud:' : 'demo:') + draftAccount);
  const category = element('select');
  category.setAttribute('aria-label', 'Conversation category');
  for (const value of (cloud ? STUDENT_CATEGORIES.filter(v => v !== 'N/A') : STUDENT_CATEGORIES)) {
    const option = element('option', value); option.value = value; category.append(option);
  }
  category.value = 'Everyday experiences';
  const anonymous = element('input'); anonymous.type = 'checkbox';
  const identityLabel = element('label', undefined, 'field identity-choice');
  identityLabel.append(anonymous, document.createTextNode(' Post anonymously'));
  const audienceLabel = element('p', '', 'hint');
  const preview = element('section', undefined, 'panel');
  preview.setAttribute('aria-label', 'Post preview');
  const previewName = element('strong'), previewTitle = element('h3'), previewBody = element('p');
  previewBody.style.whiteSpace = 'pre-wrap';
  preview.append(element('h2', 'Preview'), previewName, previewTitle, previewBody);
  const status = element('p', '', 'hint'); status.setAttribute('role', 'status');
  const label = element('label', 'What would you like to share?', 'field'); label.append(category);
  form.append(label, identityLabel, audienceLabel,
    element('p', 'Before sharing, remove names, student numbers, room numbers and details that identify another person.', 'hint'),
    element('p', cloud
      ? 'An anonymous post is hidden from your public profile. Authorised operators can access account records for moderation. Readers may recognise details you share.'
      : 'This fictional demo simulates anonymous display. Switchable personas and browser backups contain the underlying demo records.', 'hint'),
    preview, status);
  const attachment = cloud ? null : mediaComposer(form,{body,preview,before:previewBody});
  const saved = drafts.read();
  if (saved && typeof saved.title === 'string' && typeof saved.text === 'string') {
    title.value = saved.title; body.value = saved.text;
    if (STUDENT_CATEGORIES.includes(saved.category)) category.value = saved.category;
    anonymous.checked = saved.anonymous === true;
    if (audience && [...audience.options].some(o => o.value === saved.audience)) audience.value = saved.audience;
    status.textContent = 'Your draft was restored on this device.';
  }
  function update(save = false) {
    previewName.textContent = anonymous.checked ? 'Anonymous OP' : '@' + account;
    previewTitle.textContent = title.value || 'Your post title';
    previewBody.textContent = body.value || 'Your experience or question will appear here.';
    audienceLabel.textContent = 'Audience · ' + (audience?.selectedOptions[0]?.textContent ?? 'Your campus community');
    if (save) {
      const ok = drafts.write({title:title.value, text:body.value, category:category.value,
        anonymous:anonymous.checked, audience:audience?.value ?? ''});
      status.textContent = ok ? 'Draft saved for this tab and account.' : 'Draft storage is unavailable. Keep this tab open until you publish.';
    }
  }
  form.addEventListener('input', () => update(true));
  category.addEventListener('change', () => update(true));
  audience?.addEventListener('change', () => update(true));
  form.append(action('Discard draft', () => {
    drafts.clear(); attachment?.reset(); title.value = ''; body.value = ''; update(); status.textContent = 'Draft discarded.';
  }));
  update();
  return {read:() => ({anonymous:anonymous.checked, category:category.value, ...(!cloud ? {media:attachment.read()} : {})}), clear:() => drafts.clear()};
}

export function privacyInformation(host) {
  const panel = element('details', undefined, 'panel');
  panel.append(element('summary', 'Community rules and privacy'));
  panel.append(element('p', 'Use a private username. Keep identifying information, harassment, threats and impersonation out of posts. Share experiences without exposing other people.'));
  panel.append(element('p', 'Anonymous OP stays consistent within a conversation. Your verification email is private. Authorised operators can access account records for moderation and support. Screenshots and identifying story details can reveal information outside Orbit.'));
  panel.append(element('p', `The initial pilot is for up to ${PILOT.capacity} adult students at NWU ${PILOT.campus}. University-mailbox verification checks control of the mailbox. Campus and current-student declarations are self-reported.`));
  host.append(panel);
}

export function studentAvatar(kind = 'moon') {
  const symbols = {sun:'☀', moon:'☾', leaf:'❧', star:'✦'};
  const avatar = element('span', symbols[kind] ?? symbols.moon, 'avatar student-avatar avatar-' + kind);
  avatar.setAttribute('aria-label', kind + ' avatar');
  return avatar;
}

export function pseudonymSettings(host, {name, avatar = 'moon', save}) {
  const form = element('form', undefined, 'panel'), username = element('input'), choice = element('select');
  username.value = name; username.maxLength = 24; username.pattern = '[a-z][a-z0-9_]{2,23}'; username.required = true;
  username.setAttribute('aria-label', 'Private username'); choice.setAttribute('aria-label', 'Illustrated avatar');
  for (const value of ['sun','moon','leaf','star']) { const option = element('option', value); option.value = value; choice.append(option); }
  choice.value = avatar;
  const preview = studentAvatar(avatar);
  choice.onchange = () => {const next = studentAvatar(choice.value); preview.replaceChildren(...next.childNodes); preview.className = next.className; preview.setAttribute('aria-label',choice.value+' avatar');};
  const submit = element('button', 'Save private username'); submit.type = 'submit';
  const error = element('p', '', 'error'); error.setAttribute('role', 'alert');
  form.append(element('h2','Your community identity'),username,choice,preview,submit,error);
  form.onsubmit = async event => {
    event.preventDefault(); submit.disabled = true;
    try { await save({name:username.value,avatar:choice.value}); }
    catch (failure) { error.textContent = failure.message; }
    finally { submit.disabled = false; }
  };
  host.append(form);
}

export async function moderationPanel(host, {load, change, notify}) {
  host.append(element('h1', 'Community moderation'));
  const data = await load();
  host.append(element('p', `${data.reports.filter(r => r.status !== 'resolved').length} open reports · ${data.appeals.filter(a => a.status === 'open').length} open appeals`, 'hint'));
  const error = element('p', '', 'error'); error.setAttribute('role', 'alert'); host.append(error);
  async function apply(operation, target, extra) {
    error.textContent = '';
    try {
      await change(operation, target, extra);
      notify('Moderation action recorded.');
      host.replaceChildren(); await moderationPanel(host, {load, change, notify});
    } catch (failure) { error.textContent = failure.message; }
  }
  for (const report of data.reports) {
    const card = element('article', undefined, 'panel');
    card.append(element('h2', report.reason), element('p', report.details),
      element('p', `${report.kind} ${report.target} · ${report.status ?? 'open'}`, 'hint'),
      element('p', report.text ?? 'Content unavailable.'));
    const reason = element('textarea'); reason.maxLength = 1000;
    reason.setAttribute('aria-label', 'Moderation reason'); card.append(reason);
    const details = () => ({kind:report.kind, reporter:report.actor, reason:reason.value});
    if (report.kind !== 'account') card.append(
      action('Remove content', () => apply('remove', report.target, details())),
      action('Restore content', () => apply('restore', report.target, details())));
    card.append(action('Resolve report', () => apply('resolve', report.target, details())));
    if (report.author) card.append(action('Restrict author for 24 hours', () => apply('restrict', report.author, details())));
    host.append(card);
  }
  for (const appeal of data.appeals.filter(a => a.status === 'open')) {
    const card = element('article', undefined, 'panel'), reason = element('textarea');
    reason.maxLength = 1000; reason.setAttribute('aria-label', 'Appeal decision reason');
    card.append(element('h2', 'Appeal'), element('p', appeal.text), reason,
      action('Resolve appeal', () => apply('appeal-resolve', appeal.actor, {reason:reason.value})));
    host.append(card);
  }
  const history = element('details'); history.append(element('summary', 'Moderation history'));
  for (const item of data.actions) history.append(element('p', `${item.action} · ${item.reason} · ${new Date(item.at).toLocaleString('en-ZA')}`));
  host.append(history);
}

export function communityAccountPanel(host, {appeal, remove, onDeleted, reauth = false}) {
  const panel = element('section', undefined, 'panel'); panel.append(element('h2', 'Community account controls'));
  const error = element('p', '', 'error'); error.setAttribute('role', 'alert');
  const text = element('textarea'); text.maxLength = 1000; text.setAttribute('aria-label', 'Appeal explanation');
  if (appeal) panel.append(text, action('Submit appeal', async () => {
    try { await appeal(text.value); text.value = ''; error.textContent = 'Appeal submitted for review.'; }
    catch (failure) { error.textContent = failure.message; }
  }));
  panel.append(error, action('Delete account', () => {
    const dialog = element('dialog'), form = element('form'), confirmation = element('input');
    confirmation.setAttribute('aria-label', 'Type DELETE to confirm'); confirmation.required = true;
    const password = element('input'); password.type = 'password'; password.autocomplete = 'current-password';
    password.setAttribute('aria-label', 'Current password'); password.required = reauth;
    const submit = element('button', 'Delete my account'); submit.type = 'submit';
    const failure = element('p', '', 'error'); failure.setAttribute('role', 'alert');
    form.append(element('h2', 'Delete your account?'),
      element('p', 'This removes your posts, replies and access to this account. Type DELETE to continue.'),
      confirmation, failure, submit, action('Cancel', () => dialog.close()));
    if (reauth) form.insertBefore(password, submit);
    form.onsubmit = async event => {
      event.preventDefault(); submit.disabled = true;
      try { await remove(confirmation.value,password.value); dialog.close(); await onDeleted(); }
      catch (error) { failure.textContent = error.message; submit.disabled = false; }
    };
    dialog.append(form); dialog.onclose = () => dialog.remove(); document.body.append(dialog); dialog.showModal();
  }));
  host.append(panel);
}
