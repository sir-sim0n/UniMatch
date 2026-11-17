export const STUDENT_CATEGORIES = Object.freeze([
  'Confessions', 'Relationships and friendships', 'Academic questions',
  'Residence life', 'Money and student survival', 'Rants and advice', 'Everyday experiences'
]);
export const REPORT_REASONS = Object.freeze([
  'Personal information', 'Harassment', 'Threats', 'Impersonation', 'Spam', 'Other'
]);
export const DEMO_NAMES = Object.freeze({
  personal: 'campuswanderer', naledi: 'campusowl', sipho: 'midnightcoder', ayesha: 'quietcomet'
});
export const POLICY_VERSION = '2026-11-17';
export function seedCampusCircles() {
  return [
    ['student-confessions','NWU Vanderbijlpark Confessions','Campus experiences and the things you need to get off your chest.'],
    ['student-questions','NWU Vanderbijlpark Questions','Ask questions and share advice about student life.'],
    ['student-across','Across campuses','Student experiences and conversations across campuses.']
  ].map(([id,title,description]) => ({id,title,description,student:true,owner:'naledi',
    members:['personal','naledi','sipho','ayesha'],moderators:['naledi'],requests:[],flairs:[],pinned:null,
    private:false,rules:'Use pseudonyms. Do not expose personal information, harass, threaten or impersonate others.'}));
}
export const PILOT = Object.freeze({
  university: 'North-West University', campus: 'Vanderbijlpark',
  emailDomain: 'mynwu.ac.za', capacity: 50
});

export function validatePseudonym(value) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_]{2,23}$/.test(value)) {
    throw Error('Choose a username of 3–24 lowercase letters, digits or underscores.');
  }
  return value;
}

export function postIdentity(post, reply = null) {
  const hidden = !!post?.anonymous && (!reply || reply.author === post.author);
  return hidden ? 'Anonymous OP' : null;
}

export function seedStudentState() {
  return { studentRestrictions: [], moderationActions: [], studentAppeals: [], deletedStudents: [], studentProfiles: [] };
}

export function validateStudentState(data, actors) {
  for (const key of Object.keys(seedStudentState())) {
    if (!Array.isArray(data[key])) throw Error('Invalid student community data.');
  }
  for (const item of data.studentRestrictions) {
    if (!actors.includes(item.actor) || !Number.isFinite(item.until)) throw Error('Invalid restriction.');
  }
  for (const post of data.feedPosts) {
    if (post.anonymous !== undefined && typeof post.anonymous !== 'boolean') throw Error('Invalid post identity.');
    if (post.category !== undefined && !STUDENT_CATEGORIES.includes(post.category)) throw Error('Invalid category.');
  }
  for (const item of data.moderationActions) {
    if (!actors.includes(item.actor) || !['remove','restore','restrict','resolve'].includes(item.action) ||
        typeof item.reason !== 'string' || !item.reason.trim() || item.reason.length > 1000 ||
        !Number.isFinite(item.at)) throw Error('Invalid moderation action.');
  }
  for (const appeal of data.studentAppeals) {
    if (!actors.includes(appeal.actor) || typeof appeal.text !== 'string' || !appeal.text.trim() ||
        appeal.text.length > 1000 || !['open','resolved'].includes(appeal.status)) throw Error('Invalid appeal.');
  }
  if (data.deletedStudents.some(actor => !actors.includes(actor))) throw Error('Invalid deleted account.');
  const profileActors = new Set();
  for (const profile of data.studentProfiles) {
    if (!actors.includes(profile.actor) || profileActors.has(profile.actor) || !['sun','moon','leaf','star'].includes(profile.avatar)) throw Error('Invalid student profile.');
    validatePseudonym(profile.name); profileActors.add(profile.actor);
  }
}

export function assertStudentWrite(data, actor, operation, now) {
  if (data.deletedStudents.includes(actor)) throw Error('This demo account was deleted. Reset the demo to use it again.');
  if (data.studentRestrictions.some(r => r.actor === actor && r.until > now) &&
      !['student-appeal','student-delete'].includes(operation)) throw Error('Posting is temporarily restricted. You can submit an appeal.');
  const collection = operation === 'feed-publish' ? data.feedPosts : operation === 'feed-comment' ? data.feedReplies : null;
  if (collection && collection.filter(p => p.author === actor && now - p.at < 3600000).length >= 10) {
    throw Error('You have reached the hourly posting limit. Please try again later.');
  }
}

export function changeStudent(data, actor, operation, target, extra, now) {
  if (!operation.startsWith('student-')) return false;
  if (operation === 'student-profile') {
    const name = validatePseudonym(extra.name);
    if (!['sun','moon','leaf','star'].includes(extra.avatar)) throw Error('Choose an avatar.');
    if (data.studentProfiles.some(p => p.actor !== actor && p.name === name) ||
        Object.entries(DEMO_NAMES).some(([id,value]) => id !== actor && value === name)) throw Error('That username is already in use.');
    data.studentProfiles = data.studentProfiles.filter(p => p.actor !== actor);
    data.studentProfiles.push({actor,name,avatar:extra.avatar});
    return true;
  }
  if (operation === 'student-appeal') {
    if (typeof extra.text !== 'string' || !extra.text.trim() || extra.text.length > 1000) throw Error('Explain your appeal in up to 1,000 characters.');
    if (data.studentAppeals.some(a => a.actor === actor && a.status === 'open')) throw Error('Your existing appeal is awaiting review.');
    data.studentAppeals.push({actor, text:extra.text.trim(), status:'open', at:now});
    return true;
  }
  if (operation === 'student-delete') {
    if (extra.confirm !== 'DELETE') throw Error('Type DELETE to confirm.');
    for (const p of data.feedPosts.filter(p => p.author === actor)) {
      p.deleted = true; p.title = 'Deleted post'; p.text = '[Deleted]';
    }
    for (const r of data.feedReplies.filter(r => r.author === actor)) { r.deleted = true; r.text = '[Deleted]'; }
    for (const p of data.posts.filter(p => p.author === actor)) { p.hidden = true; p.text = '[Deleted]'; }
    data.messages = data.messages.filter(m => m.from !== actor && m.to !== actor);
    data.notifications = data.notifications.filter(n => n.from !== actor && n.to !== actor);
    data.requests = data.requests.filter(q => q.from !== actor && q.to !== actor);
    if (!data.deletedStudents.includes(actor)) data.deletedStudents.push(actor);
    return true;
  }
  if (actor !== 'naledi') throw Error('Only the demo moderator can review reports. Switch to campusowl.');
  const reason = typeof extra.reason === 'string' ? extra.reason.trim() : '';
  if (!reason || reason.length > 1000) throw Error('Add a moderation reason of up to 1,000 characters.');
  const action = operation.slice('student-'.length);
  if (action === 'restrict') {
    if (!['personal','sipho','ayesha'].includes(target)) throw Error('Choose another demo account.');
    data.studentRestrictions = data.studentRestrictions.filter(r => r.actor !== target);
    data.studentRestrictions.push({actor:target, until:now + 86400000});
  } else if (action === 'remove' || action === 'restore') {
    const item = (extra.kind === 'comment' ? data.feedReplies : data.feedPosts).find(p => p.id === target);
    if (!item) throw Error('Contribution unavailable.');
    item.moderationHidden = action === 'remove';
  } else if (action === 'resolve') {
    const report = extra.kind === 'account'
      ? data.reports.find(r => r.from === extra.reporter && r.to === target)
      : data.contentReports.find(r => r.actor === extra.reporter && r.kind === extra.kind && r.target === target);
    if (!report) throw Error('Report unavailable.');
    report.status = 'resolved';
  } else if (action === 'appeal-resolve') {
    const appeal = data.studentAppeals.find(a => a.actor === target && a.status === 'open');
    if (!appeal) throw Error('Appeal unavailable.');
    appeal.status = 'resolved';
    data.moderationActions.push({actor,action:'resolve',target,reason,at:now});
    return true;
  } else throw Error('Unknown moderation action.');
  data.moderationActions.push({actor, action, target, kind:extra.kind ?? null, reason, at:now});
  return true;
}

export class DraftStore {
  constructor(account, storage = () => globalThis.sessionStorage) {
    this.key = 'orbit.student.draft.' + account;
    this.storage = storage;
  }
  read() { try { return JSON.parse(this.storage().getItem(this.key) ?? 'null'); } catch { return null; } }
  write(value) { try { this.storage().setItem(this.key, JSON.stringify(value)); return true; } catch { return false; } }
  clear() { try { this.storage().removeItem(this.key); } catch {} }
}
