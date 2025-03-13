import assert from 'node:assert';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import { getLatestCommit } from '../utils/git';

describe('getLatestCommit', () => {
  const gitDir = join(__dirname, '.', 'fixtures', 'git');
  it('should return some values by default', () => {
    const { hash, timestamp } = getLatestCommit();

    assert.strictEqual(hash().length, 8, 'The hash length is wrong');
    assert.ok(typeof timestamp() === 'number', 'The timestamp type is wrong');
  });

  it('should return the latest commit hash and timestamp', () => {
    const { hash, timestamp } = getLatestCommit(gitDir);

    assert.strictEqual(hash(), '634cad6d', 'The hash is wrong');
    assert.strictEqual(timestamp(), 1711385030000, 'The timestamp is wrong');
  });

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
