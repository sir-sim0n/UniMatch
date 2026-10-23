export const STORAGE_KEY = 'unimatch.demo.v1';

// Storage transport only: C++ owns the versioned format and all restoration rules.
// The provider is lazy because accessing localStorage itself can throw.
export class Persistence {
  constructor(client, { storage = () => globalThis.localStorage, report = () => {}, key = STORAGE_KEY } = {}) {
    this.client = client;
    this.key = key;
    this.storage = storage;
    this.report = report;
    this.expected = null;
    this.mode = 'ready';
  }

  restore() {
    let text;
    try {
      text = this.storage().getItem(this.key);
      this.expected = text;
    } catch {
      this.mode = 'memory';
      this.report('read_failed');
      return 'memory';
    }
    if (text === null) {
      this.report('ready');
      return 'empty';
    }
    try {
      this.client.call('importState', { stateJson: text });
      this.report('restored');
      return 'restored';
    } catch (error) {
      this.mode = 'recovery';
      this.report('invalid', error);
      return 'invalid';
    }
  }

  save() {
    if (this.mode !== 'ready') return false;
    try {
      const storage = this.storage();
      if (storage.getItem(this.key) !== this.expected) {
        this.mode = 'conflict';
        this.report('conflict');
        return false;
      }
      const { stateJson } = this.client.call('exportState');
      storage.setItem(this.key, stateJson);
      this.expected = stateJson;
      this.report('saved');
      return true;
    } catch {
      // Keep the accepted in-memory C++ state. A later edit or Retry can save it.
      this.report('write_failed');
      return false;
    }
  }

  continueInMemory() {
    this.mode = 'memory';
    this.report('memory');
  }

  reset() {
    this.client.call('reset', { confirmed: true });
    try {
      // Never clear unrelated keys on the same origin.
      this.storage().removeItem(this.key);
      this.expected = null;
      this.mode = 'ready';
      this.report('reset');
      return true;
    } catch {
      this.mode = 'memory';
      this.report('reset_failed');
      return false;
    }
  }

  checkExternalChange() {
    if (this.mode !== 'ready') return;
    try {
      if (this.storage().getItem(this.key) !== this.expected) {
        this.mode = 'conflict';
        this.report('conflict');
      }
    } catch {
      this.mode = 'memory';
      this.report('read_failed');
    }
  }
}
