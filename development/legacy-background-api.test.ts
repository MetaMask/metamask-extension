import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';

const REPOSITORY_ROOT_PATH = path.resolve(__dirname, '..');

const SCRIPT_PATH = path.join(__dirname, 'legacy-background-api.ts');
const TSX_PATH = path.join(REPOSITORY_ROOT_PATH, 'node_modules/.bin/tsx');
const SNAPSHOT_PATH = path.join(
  REPOSITORY_ROOT_PATH,
  'legacy-background-api-snapshot.json',
);

describe('legacy-background-api.ts', () => {
  it('succeeds when run with --help', async () => {
    const result = await runScript({ args: ['--help'] });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Checks or updates the snapshot');
  });

  it('succeeds when "check" is passed and the APIs are up to date', async () => {
    const result = await runScript({ args: ['check'] });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      'No changes detected in legacy background APIs, all good.',
    );
  });

  it('updates the snapshot with the current API members when "update" is passed', async () => {
    const originalSnapshot = readFileSync(SNAPSHOT_PATH, 'utf8');

    try {
      const result = await runScript({ args: ['update'] });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(
        'Updated legacy background API snapshot with current members',
      );
    } finally {
      writeFileSync(SNAPSHOT_PATH, originalSnapshot);
    }
  });
});

async function runScript({ args }: { args: string[] }): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(TSX_PATH, [SCRIPT_PATH, ...args], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}
