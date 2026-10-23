import { Persistence, STORAGE_KEY } from './persistence.mjs';

export const ACTIVE_KEY = 'orbit.demo.active.v1';
export const ACCOUNTS = Object.freeze([
  { id: 'personal', label: 'Your original demo', description: 'Your existing profile and bookmarks, or a blank profile to make your own.', key: STORAGE_KEY },
  { id: 'naledi', label: 'Naledi Demo', description: 'A fictional Computer Science student at NWU Mahikeng.', key: 'orbit.demo.account.naledi.v1', campus: 'nwu-mahikeng' },
  { id: 'sipho', label: 'Sipho Demo', description: 'A fictional Computer Science student at NWU Potchefstroom.', key: 'orbit.demo.account.sipho.v1', campus: 'nwu-potchefstroom' },
  { id: 'ayesha', label: 'Ayesha Demo', description: 'A fictional Computer Science student at NWU Vanderbijlpark.', key: 'orbit.demo.account.ayesha.v1', campus: 'nwu-vanderbijlpark' }
]);

// Local persona repository. Each identity owns a separate validated C++ session.
// These IDs are the stable future actor IDs; visitor:local stays internal to each core.
export class DemoAccounts {
  constructor({ loadClient, storage = () => globalThis.localStorage, report = () => {} }) {
    this.loadClient = loadClient; this.storage = storage; this.report = report;
    this.entries = new Map(); this.active = null; this.busy = false;
  }
  initialId() {
    try { const id = this.storage().getItem(ACTIVE_KEY); return ACCOUNTS.some(a => a.id === id) ? id : 'personal'; }
    catch { return 'personal'; }
  }
  seed(entry) {
    if (!entry.account.campus) return;
    const cat = entry.client.call('getCatalogues');
    entry.client.call('updateProfile', { profile: {
      displayName: entry.account.label, age: 22, universityId: 'nwu', campusId: entry.account.campus,
      degreeId: 'computer-science', yearId: null, genderId: cat.genders[0].id, showGender: false,
      bio: 'A fictional student exploring shared interests, campus activities and new friendships.',
      interestIds: cat.interests.slice(0, 2).map(i => i.id)
    }});
  }
  async activate(id) {
    const account = ACCOUNTS.find(a => a.id === id);
    if (!account) throw new Error('Unknown demo account.');
    if (this.busy) throw new Error('An account switch is already in progress.');
    this.busy = true;
    try {
      let entry = this.entries.get(id);
      if (!entry) {
        const client = await this.loadClient();
        entry = { account, client, status: 'ready', restored: 'empty' };
        try {
          entry.persistence = new Persistence(client, { storage: this.storage, key: account.key, report: code => {
            entry.status = code;
            if (this.active === entry) this.report(code);
          }});
          entry.restored = entry.persistence.restore();
          if (entry.restored === 'empty' || entry.restored === 'memory') {
            this.seed(entry);
            if (account.campus && entry.restored === 'empty') entry.persistence.save();
          }
          this.entries.set(id, entry);
        } catch (error) { client.dispose(); throw error; }
      } else entry.persistence.checkExternalChange();
      this.active = entry;
      try { this.storage().setItem(ACTIVE_KEY, id); } catch { /* Active choice is session-only; account persistence reports its own failures. */ }
      this.report(entry.status);
      return entry;
    } finally { this.busy = false; }
  }
  resetActive() {
    const entry = this.active;
    const removed = entry.persistence.reset();
    this.seed(entry);
    if (removed && entry.account.campus) return entry.persistence.save();
    return removed;
  }
  checkExternalChange(key) {
    if (!key || key === this.active?.account.key) this.active?.persistence.checkExternalChange();
  }
  dispose() { for (const e of this.entries.values()) e.client.dispose(); this.entries.clear(); this.active = null; }
}
