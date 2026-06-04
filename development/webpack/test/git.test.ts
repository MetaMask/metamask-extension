import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { join } from 'node:path';
import { getLatestCommit } from '../utils/git';

function runGit(
  args: string[],
  { cwd, env = {} }: { cwd: string; env?: Record<string, string> },
) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
}

describe('getLatestCommit', () => {
  const gitDir = join(__dirname, '.', 'fixtures', 'git');
  it('should return some values by default', () => {
    const { hash, timestamp } = getLatestCommit();

    assert.strictEqual(hash().length, 8, 'The hash length is wrong');
    assert.ok(typeof timestamp() === 'number', 'The timestamp type is wrong');
  });

  it('should return the latest commit hash and committer timestamp', () => {
    const { hash, timestamp } = getLatestCommit(gitDir);

    assert.strictEqual(hash(), '634cad6d', 'The hash is wrong');
    assert.strictEqual(timestamp(), 1711385030000, 'The timestamp is wrong');
  });

  it('uses the committer timestamp instead of the author timestamp', () => {
    const repositoryDirectory = mkdtempSync(
      join(tmpdir(), 'get-latest-commit-'),
    );

    try {
      runGit(['init', '--quiet'], { cwd: repositoryDirectory });
      runGit(
        [
          '-c',
          'user.name=Test User',
          '-c',
          'user.email=test@example.com',
          '-c',
          'commit.gpgsign=false',
          'commit',
          '--allow-empty',
          '--quiet',
          '-m',
          'initial',
        ],
        {
          cwd: repositoryDirectory,
          env: {
            GIT_AUTHOR_DATE: '2024-03-25T12:43:50-04:00',
            GIT_COMMITTER_DATE: '2024-03-25T13:43:50-04:00',
          },
        },
      );

      const { timestamp } = getLatestCommit(join(repositoryDirectory, '.git'));

      assert.strictEqual(timestamp(), 1711388630000);
    } finally {
      rmSync(repositoryDirectory, { recursive: true, force: true });
    }
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
