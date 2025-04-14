// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31890
// eslint-disable-next-line import/no-nodejs-modules
import assert from 'node:assert';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31890
// eslint-disable-next-line import/no-nodejs-modules
import { describe, it } from 'node:test';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31890
// eslint-disable-next-line import/no-nodejs-modules
import { join } from 'node:path';
import { getLatestCommit } from '../utils/git';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
// eslint-disable-next-line @typescript-eslint/no-floating-promises
describe('getLatestCommit', () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const gitDir = join(__dirname, '.', 'fixtures', 'git');
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  it('should return some values by default', () => {
    const { hash, timestamp } = getLatestCommit();

    assert.strictEqual(hash().length, 8, 'The hash length is wrong');
    assert.ok(typeof timestamp() === 'number', 'The timestamp type is wrong');
  });

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  it('should return the latest commit hash and timestamp', () => {
    const { hash, timestamp } = getLatestCommit(gitDir);

    assert.strictEqual(hash(), '634cad6d', 'The hash is wrong');
    assert.strictEqual(timestamp(), 1711385030000, 'The timestamp is wrong');
  });

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  it('should use the cache', () => {
    const firstCallCustom = getLatestCommit(gitDir);
    const firstCallDefault = getLatestCommit();
    const secondCallCustom = getLatestCommit(gitDir);
    const secondCallDefault = getLatestCommit();

    assert.notStrictEqual(firstCallCustom, firstCallDefault);
    assert.notStrictEqual(secondCallCustom, secondCallDefault);
    assert.strictEqual(firstCallCustom, secondCallCustom);
    assert.strictEqual(firstCallDefault, secondCallDefault);
  });
});
