import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Exercise the same generated module delivered to the browser.
const { default: createUniMatch } = await import(pathToFileURL(process.argv[2]).href);
const engine = await createUniMatch();
assert.equal(typeof engine.getApplicationInfo, 'function');
const first = engine.getApplicationInfo();
const info = JSON.parse(first);
assert.equal(info.application, 'UniMatch');
assert.equal(info.apiVersion, 1);
assert.equal(info.demoOnly, true);
assert.equal(engine.getApplicationInfo(), first, 'The read-only call must be repeatable.');
console.log('Generated ES module loads WebAssembly and calls C++ through Embind.');
