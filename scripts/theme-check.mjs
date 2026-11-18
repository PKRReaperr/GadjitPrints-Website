import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/theme.js', import.meta.url), 'utf8');

function boot({ stored = null, matches = false, storageThrows = false, hasMedia = true } = {}) {
  const mediaListeners = new Set();
  const windowListeners = new Map();
  const values = new Map(stored === null ? [] : [['gadjitprints-theme', stored]]);
  const localStorage = {
    getItem(key) {
      if (storageThrows) throw new Error('storage unavailable');
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (storageThrows) throw new Error('storage unavailable');
      values.set(key, value);
    },
  };
  const media = {
    matches,
    addEventListener(type, listener) {
      if (type === 'change') mediaListeners.add(listener);
    },
  };
  const document = { documentElement: { dataset: {}, style: {} } };
  const window = {
    ...(hasMedia ? { matchMedia: () => media } : {}),
    addEventListener(type, listener) {
      windowListeners.set(type, listener);
    },
    dispatchEvent() {},
  };
  const context = { window, document, localStorage, Event: class Event {} };
  vm.runInNewContext(source, context);
  return { context, media, mediaListeners, windowListeners, values };
}

const light = boot({ matches: false });
assert.equal(light.context.document.documentElement.dataset.theme, 'light');
assert.equal(light.context.window.gadjitAppearance.getPreference(), 'system');

const darkSystem = boot({ matches: true });
assert.equal(darkSystem.context.document.documentElement.dataset.theme, 'dark');
darkSystem.context.window.gadjitAppearance.setPreference('light');
assert.equal(darkSystem.context.document.documentElement.dataset.theme, 'light');
darkSystem.context.window.gadjitAppearance.setPreference('system');
assert.equal(darkSystem.values.get('gadjitprints-theme'), 'system');
assert.equal(darkSystem.context.document.documentElement.dataset.theme, 'dark');
darkSystem.media.matches = false;
for (const listener of darkSystem.mediaListeners) listener({ matches: false });
assert.equal(darkSystem.context.document.documentElement.dataset.theme, 'light');

const invalid = boot({ stored: 'neon', matches: true });
assert.equal(invalid.context.window.gadjitAppearance.getPreference(), 'system');
assert.equal(invalid.context.document.documentElement.dataset.theme, 'dark');

const unavailable = boot({ stored: 'dark', matches: true, storageThrows: true, hasMedia: false });
assert.equal(unavailable.context.window.gadjitAppearance.getPreference(), 'system');
assert.equal(unavailable.context.document.documentElement.dataset.theme, 'light');

console.log('theme preference checks passed');
