import type { Stats } from 'node:fs';
import {
  isGitDir,
  postinstall,
  shouldSkipPostinstall,
  warn,
} from './skills-postinstall';

function statGitDir(existing: boolean) {
  return jest.fn(() => {
    if (!existing) {
      throw new Error('missing');
    }
    return { isDirectory: () => true } as Stats;
  }) as unknown as typeof import('node:fs').statSync;
}

function spawnWithStatuses(statuses: number[]) {
  let index = 0;
  return jest.fn(() => {
    const status = statuses[index] ?? 0;
    index += 1;
    return {
      status,
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
      pid: 1,
      output: [],
      signal: null,
    };
  }) as unknown as typeof import('node:child_process').spawnSync;
}

describe('skills-postinstall', () => {
  const cacheDir = '.skills-cache/metamask-skills';

  it('skips when explicitly disabled or running in CI without force', () => {
    expect(shouldSkipPostinstall({ SKILLS_SKIP_POSTINSTALL: '1' })).toBe(true);
    expect(shouldSkipPostinstall({ CI: 'true' })).toBe(true);
    expect(
      shouldSkipPostinstall({ CI: 'true', SKILLS_FORCE_POSTINSTALL: '1' }),
    ).toBe(false);
  });

  it('detects whether the public cache is a git checkout', () => {
    expect(isGitDir(cacheDir, statGitDir(true))).toBe(true);
    expect(isGitDir(cacheDir, statGitDir(false))).toBe(false);
  });

  it('clones the public skills cache when cache is absent', () => {
    const mkdir = jest.fn();
    const spawn = spawnWithStatuses([0]);

    expect(
      postinstall({
        env: {},
        mkdir,
        spawn,
        stat: statGitDir(false),
      }),
    ).toBe(0);
    expect(mkdir).toHaveBeenCalledWith('.skills-cache', { recursive: true });
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      'git',
      [
        'clone',
        '--depth',
        '1',
        '--branch',
        'main',
        'https://github.com/MetaMask/skills.git',
        cacheDir,
      ],
      { stdio: 'ignore' },
    );
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('fetches and resets an existing cache', () => {
    const spawn = spawnWithStatuses([0, 0]);

    expect(postinstall({ env: {}, spawn, stat: statGitDir(true) })).toBe(0);
    expect(spawn).toHaveBeenNthCalledWith(
      1,
      'git',
      ['-C', cacheDir, 'fetch', '--depth', '1', 'origin', 'main'],
      { stdio: 'ignore' },
    );
    expect(spawn).toHaveBeenNthCalledWith(
      2,
      'git',
      ['-C', cacheDir, 'reset', '--hard', 'origin/main'],
      { stdio: 'ignore' },
    );
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('returns without side effects when postinstall is skipped', () => {
    const spawn = spawnWithStatuses([]);

    expect(postinstall({ env: { SKILLS_SKIP_POSTINSTALL: '1' }, spawn })).toBe(
      0,
    );
    expect(spawn).not.toHaveBeenCalled();
  });

  it('warns without failing when clone, fetch, or reset fails', () => {
    for (const { statuses, gitDir } of [
      { statuses: [1], gitDir: false },
      { statuses: [1], gitDir: true },
      { statuses: [0, 1], gitDir: true },
    ]) {
      const stderr = { write: jest.fn() };
      expect(
        postinstall({
          env: {},
          spawn: spawnWithStatuses(statuses),
          stat: statGitDir(gitDir),
          stderr,
        }),
      ).toBe(0);
      expect(stderr.write).toHaveBeenCalledWith(
        expect.stringContaining('skills postinstall:'),
      );
    }
  });

  it('warns without failing on unexpected filesystem errors', () => {
    const stderr = { write: jest.fn() };

    expect(
      postinstall({
        env: {},
        mkdir: jest.fn(() => {
          throw new Error('readonly');
        }) as unknown as typeof import('node:fs').mkdirSync,
        stat: statGitDir(false),
        stderr,
      }),
    ).toBe(0);
    expect(stderr.write).toHaveBeenCalledWith(
      expect.stringContaining('unexpected error: readonly'),
    );
  });

  it('formats warnings consistently', () => {
    const stderr = { write: jest.fn() };

    warn('install failed', stderr);

    expect(stderr.write).toHaveBeenCalledWith(
      'skills postinstall: install failed (run `yarn skills` for details)\n',
    );
  });
});
