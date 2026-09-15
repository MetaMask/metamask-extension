'use strict';

// origin: ai-synthesis (MWPE-316)

const fs = require('node:fs');
const path = require('node:path');
const { RuleTester } = require('eslint');
const { parser: tsParser } = require('typescript-eslint');
const {
  storageLocalWriteAllowlist,
} = require('../eslint-storage-local-write-allowlist');
const rule = require('./no-direct-storage-local-write');

const ALLOWLISTED_FILE = 'app/scripts/lib/allowlisted.ts';

const options = [
  {
    allowlist: [
      { file: ALLOWLISTED_FILE, owner: '@MetaMask/example', reason: 'test' },
    ],
  },
];

const inFile = (file) => path.join(process.cwd(), file);
const notAllowlisted = inFile('app/scripts/lib/other.ts');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-direct-storage-local-write', rule, {
  valid: [
    {
      name: 'reads from storage.local',
      code: `await browser.storage.local.get('key');`,
      filename: notAllowlisted,
      options,
    },
    {
      name: 'feature-detects a read method',
      code: `if (typeof browser.storage.local.getKeys === 'function') {}`,
      filename: notAllowlisted,
      options,
    },
    {
      name: 'checks the type of storage.local',
      code: `if (typeof browser.storage.local === 'undefined') {}`,
      filename: notAllowlisted,
      options,
    },
    {
      name: 'listens for changes',
      code: `browser.storage.local.onChanged.addListener(() => undefined);`,
      filename: notAllowlisted,
      options,
    },
    {
      name: 'writes to storage.session',
      code: `await browser.storage.session.set({ key: 'value' });`,
      filename: notAllowlisted,
      options,
    },
    {
      name: 'writes to an unrelated `local` property',
      code: `settings.local.set('key', 'value');`,
      filename: notAllowlisted,
      options,
    },
    {
      name: 'writes from an allowlisted file',
      code: `await browser.storage.local.set({ key: 'value' });`,
      filename: inFile(ALLOWLISTED_FILE),
      options,
    },
  ],
  invalid: [
    {
      name: 'set on browser.storage.local',
      code: `await browser.storage.local.set({ key: 'value' });`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'directWrite', data: { member: 'set' } }],
    },
    {
      name: 'remove on chrome.storage.local',
      code: `chrome.storage.local.remove('key');`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'directWrite', data: { member: 'remove' } }],
    },
    {
      name: 'clear on an injected browser API',
      code: `await browserApi.storage.local.clear();`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'directWrite', data: { member: 'clear' } }],
    },
    {
      name: 'set split across lines',
      code: `browser.storage.local
  .set({ key: 'value' })
  .catch(console.error);`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'directWrite', data: { member: 'set' } }],
    },
    {
      name: 'bracket access',
      code: `await browser.storage['local'].set({ key: 'value' });`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'directWrite', data: { member: 'set' } }],
    },
    {
      name: 'non-null assertion and optional chaining',
      code: `browser.storage.local!.set({}); browser?.storage?.local?.remove('key');`,
      filename: notAllowlisted,
      options,
      errors: [
        { messageId: 'directWrite', data: { member: 'set' } },
        { messageId: 'directWrite', data: { member: 'remove' } },
      ],
    },
    {
      name: 'alias, as in migration 223',
      code: `const storageLocal = browser.storage.local;
await storageLocal.remove(keys);`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'escapedReference', line: 1 }],
    },
    {
      name: 'destructured local, as in ExtensionStore',
      code: `const { local } = browser.storage;
await local.set({ key: 'value' });`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'escapedReference', line: 1 }],
    },
    {
      name: 'nested destructuring',
      code: `const { storage: { local } } = browser;`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'escapedReference' }],
    },
    {
      name: 'passed into a helper',
      code: `await writeState(browser.storage.local, state);`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'escapedReference' }],
    },
    {
      name: 'returned from a getter',
      code: `const store = { get backend() { return browser.storage.local; } };`,
      filename: notAllowlisted,
      options,
      errors: [{ messageId: 'escapedReference' }],
    },
    {
      name: 'allowlisted file that no longer writes',
      code: `await browser.storage.local.get('key');`,
      filename: inFile(ALLOWLISTED_FILE),
      options,
      errors: [{ messageId: 'staleAllowlistEntry' }],
    },
  ],
});

describe('storageLocalWriteAllowlist', () => {
  it.each(storageLocalWriteAllowlist.map((entry) => [entry.file, entry]))(
    '%s exists and states an owner field and a reason',
    (file, entry) => {
      expect(fs.existsSync(path.join(__dirname, '../..', file))).toBe(true);
      expect(entry.owner === null || entry.owner.startsWith('@')).toBe(true);
      expect(entry.reason.length).toBeGreaterThan(0);
    },
  );

  it('lists each file once', () => {
    const files = storageLocalWriteAllowlist.map((entry) => entry.file);
    expect(new Set(files).size).toBe(files.length);
  });
});
