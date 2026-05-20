import path from 'node:path';
import type { Stats } from 'node:fs';
import {
  buildDelegatedEnv,
  cacheDir,
  bashMajorVersion,
  loadSkillSourceEnv,
  main,
  pickBash,
  pickSync,
  prependBashToPath,
  syncIn,
} from './skills-sync';

function statFor(files: string[]) {
  const existing = new Set(files);
  return ((candidate: string) => {
    if (!existing.has(candidate)) {
      throw new Error(`not found: ${candidate}`);
    }
    return { isFile: () => true } as Stats;
  }) as typeof import('node:fs').statSync;
}

describe('skills-sync wrapper', () => {
  const cwd = '/repo';
  const publicDir = '/skills/public';
  const privateDir = '/skills/private';
  const publicSync = path.join(publicDir, 'tools', 'sync');
  const cacheSync = path.join(cacheDir(cwd), 'tools', 'sync');
  const privateSync = path.join(privateDir, 'tools', 'sync');

  it('prefers public cache sync over private sync when only Consensys is configured', () => {
    expect(
      pickSync(
        cwd,
        {
          METAMASK_SKILLS_DIR: undefined,
          CONSENSYS_SKILLS_DIR: privateDir,
        },
        statFor([cacheSync, privateSync]),
      ),
    ).toStrictEqual({ sync: cacheSync });
  });

  it('falls back to private sync when no public source exists', () => {
    expect(
      pickSync(
        cwd,
        {
          METAMASK_SKILLS_DIR: undefined,
          CONSENSYS_SKILLS_DIR: privateDir,
        },
        statFor([privateSync]),
      ),
    ).toStrictEqual({ sync: privateSync });
  });

  it('returns null when no sync source exists', () => {
    expect(
      pickSync(
        cwd,
        {
          METAMASK_SKILLS_DIR: undefined,
          CONSENSYS_SKILLS_DIR: undefined,
        },
        statFor([]),
      ),
    ).toBeNull();
  });

  it('prefers an explicit public checkout over cache and private sources', () => {
    expect(
      pickSync(
        cwd,
        {
          METAMASK_SKILLS_DIR: publicDir,
          CONSENSYS_SKILLS_DIR: privateDir,
        },
        statFor([publicSync, cacheSync, privateSync]),
      ),
    ).toStrictEqual({ sync: publicSync });
  });

  it('loads source paths from .skills.local without overriding shell env', () => {
    const readFile = jest.fn(() =>
      [
        `METAMASK_SKILLS_DIR=${publicDir}`,
        `CONSENSYS_SKILLS_DIR=${privateDir}`,
      ].join('\n'),
    ) as unknown as typeof import('node:fs').readFileSync;

    expect(
      loadSkillSourceEnv(cwd, { METAMASK_SKILLS_DIR: '/env/public' }, readFile),
    ).toStrictEqual({
      METAMASK_SKILLS_DIR: '/env/public',
      CONSENSYS_SKILLS_DIR: privateDir,
    });
  });

  it('injects the public cache into delegated env when public env is unset', () => {
    expect(
      buildDelegatedEnv(
        cwd,
        {
          METAMASK_SKILLS_DIR: undefined,
          CONSENSYS_SKILLS_DIR: privateDir,
        },
        { PATH: '/bin' },
        statFor([cacheSync]),
      ),
    ).toMatchObject({
      PATH: '/bin',
      METAMASK_SKILLS_DIR: cacheDir(cwd),
      CONSENSYS_SKILLS_DIR: privateDir,
    });
  });

  it('uses Bash 4+ and ignores macOS Bash 3.2', () => {
    const spawn = jest.fn((candidate: string) => ({
      status: 0,
      stdout:
        candidate === '/opt/homebrew/bin/bash'
          ? 'GNU bash, version 5.3.9(1)-release'
          : 'GNU bash, version 3.2.57(1)-release',
      stderr: '',
    })) as unknown as typeof import('node:child_process').spawnSync;

    expect(pickBash({ BASH: '/bin/bash' }, spawn)).toBe(
      '/opt/homebrew/bin/bash',
    );
  });

  it('returns null when no supported Bash is available', () => {
    const spawn = jest.fn(() => ({
      status: 0,
      stdout: 'GNU bash, version 3.2.57(1)-release',
      stderr: '',
    })) as unknown as typeof import('node:child_process').spawnSync;

    expect(pickBash({ BASH: '/bin/bash' }, spawn)).toBeNull();
  });

  it('returns null for missing sync files and invalid Bash output', () => {
    const spawn = jest.fn(() => ({
      status: 0,
      stdout: 'not bash',
      stderr: '',
    })) as unknown as typeof import('node:child_process').spawnSync;

    expect(syncIn(publicDir, statFor([]))).toBeNull();
    expect(bashMajorVersion('/bin/sh', spawn)).toBeNull();
    expect(
      bashMajorVersion(
        '/missing/bash',
        jest.fn(() => ({
          status: 1,
        })) as unknown as typeof import('node:child_process').spawnSync,
      ),
    ).toBeNull();
  });

  it('prepends the selected Bash directory so delegated scripts use Bash 4+', () => {
    expect(
      prependBashToPath({ PATH: '/bin:/usr/bin' }, '/opt/homebrew/bin/bash')
        .PATH,
    ).toBe('/opt/homebrew/bin:/bin:/usr/bin');
  });

  it('does not change PATH when Bash is resolved from PATH', () => {
    const env = { PATH: '/bin:/usr/bin' };

    expect(prependBashToPath(env, 'bash')).toBe(env);
  });

  it('exits with a clear error when no source is available', () => {
    const write = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    expect(
      main(
        [],
        cwd,
        {},
        jest.fn() as unknown as typeof import('node:child_process').spawnSync,
        statFor([]),
        jest.fn(() => {
          throw new Error('missing');
        }) as unknown as typeof import('node:fs').readFileSync,
      ),
    ).toBe(1);
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('No skills source available.'),
    );
  });

  it('exits with a clear error when no supported Bash is available', () => {
    const write = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const spawn = jest.fn(() => ({
      status: 0,
      stdout: 'GNU bash, version 3.2.57(1)-release',
      stderr: '',
    })) as unknown as typeof import('node:child_process').spawnSync;

    expect(
      main(
        [],
        cwd,
        { PATH: '/bin', BASH: '/bin/bash' },
        spawn,
        statFor([cacheSync]),
        jest.fn(() => {
          throw new Error('missing');
        }) as unknown as typeof import('node:fs').readFileSync,
      ),
    ).toBe(1);
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('No supported Bash found.'),
    );
  });

  it('delegates to the selected sync script with Bash 4+', () => {
    const spawn = jest.fn((command: string, args: string[]) => {
      if (args[0] === '--version') {
        return {
          status: 0,
          stdout: 'GNU bash, version 5.3.9(1)-release',
          stderr: '',
        };
      }
      return { status: 0, stdout: '', stderr: '' };
    }) as unknown as typeof import('node:child_process').spawnSync;

    expect(
      main(
        ['--dry-run'],
        cwd,
        { PATH: '/bin', BASH: '/opt/homebrew/bin/bash' },
        spawn,
        statFor([cacheSync]),
        jest.fn(() => {
          throw new Error('missing');
        }) as unknown as typeof import('node:fs').readFileSync,
      ),
    ).toBe(0);
    expect(spawn).toHaveBeenLastCalledWith(
      '/opt/homebrew/bin/bash',
      [cacheSync, '--repo', 'metamask-extension', '--target', cwd, '--dry-run'],
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({
          METAMASK_SKILLS_DIR: cacheDir(cwd),
          PATH: `/opt/homebrew/bin${path.delimiter}/bin`,
        }),
      }),
    );
  });
});
