export class ApiError extends Error {
  constructor(errors) {
    super(errors.map(error => error.message).join(' '));
    this.name = 'ApiError';
    this.errors = errors;
  }
}
export class Client {
  constructor(engine) { this.session = new engine.Session(); }
  call(operation, payload = {}) {
    if (!this.session) throw new Error('This Orbit client has been disposed.');
    const response = JSON.parse(this.session.request(JSON.stringify({ operation, payload })));
    if (response.apiVersion !== 1 || typeof response.ok !== 'boolean' || !Array.isArray(response.errors)) {
      throw new Error('Unexpected Orbit API response.');
    }
    if (!response.ok) throw new ApiError(response.errors);
    return response.data;
  }
  dispose() { this.session?.delete(); this.session = null; }
}
export async function loadClient() {
  const moduleUrl = new URL('./unimatch.mjs?v=1.3.0', import.meta.url);
  const { default: createUniMatch } = await import(moduleUrl.href);
  const engine = await createUniMatch({ locateFile: file => new URL(`${file}?v=1.3.0`, moduleUrl).href });
  const client = new Client(engine);
  try {
    const fetchText = async name => {
      const response = await fetch(new URL(`../data/${name}`, import.meta.url));
      if (!response.ok) throw new Error(`Could not load ${name} (HTTP ${response.status}).`);
      return response.text();
    };
    const [catalogueJson, profilesJson] = await Promise.all([fetchText('catalogues.json'), fetchText('profiles.json')]);
    client.call('initialize', { catalogueJson, profilesJson });
    return client;
  } catch (error) { client.dispose(); throw error; }
}
