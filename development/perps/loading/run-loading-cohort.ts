import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  openSync,
  closeSync,
  existsSync,
} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const { browserPid, isColdMode }: typeof import('./browser-process') =
  await import(new URL('./browser-process.ts', import.meta.url).href);

const configPath = process.env.PERPS_MEASUREMENT_CONFIG;
assert(
  configPath,
  'Set PERPS_MEASUREMENT_CONFIG to the non-secret measurement config',
);
const config: {
  harnessVersion: string;
  artifactsDir: string;
  runtimeDir: string;
  cdpPort: number;
  extensionId: string;
  accounts?: Record<string, string>;
} = JSON.parse(readFileSync(configPath, 'utf8'));
const root = path.resolve(config.artifactsDir);
const runtime = path.resolve(config.runtimeDir);
const port = config.cdpPort;
const { extensionId } = config;
assert(Number.isInteger(port) && port > 0 && port < 65536);
assert(/^[a-p]{32}$/u.test(extensionId));

const repo = process.cwd();
const harness = process.env.MM_HARNESS_BIN ?? 'mm-harness';
const contract: { harnessVersion: string } = JSON.parse(
  execFileSync(harness, ['help', '--json'], { encoding: 'utf8' }),
);
assert.equal(
  contract.harnessVersion,
  config.harnessVersion,
  'Harness baseline changed',
);
mkdirSync(root, { recursive: true });
const [arm, mode, start, end, accountName] = process.argv.slice(2);
assert(['before', 'after'].includes(arm));
assert(
  ['immediate', 'delayed', 'warm', 'background_resume', 'account'].includes(
    mode,
  ),
);
async function run(command: string, args: string[], output: string) {
  const fd = openSync(output, 'wx');
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: repo,
        stdio: ['ignore', fd, fd],
      });
      child.on('error', reject);
      child.on('exit', (code) =>
        code === 0
          ? resolve()
          : reject(Error(`${command} exited ${code}: ${output}`)),
      );
    });
  } finally {
    closeSync(fd);
  }
}
assert(
  Number.isInteger(Number(start)) &&
    Number.isInteger(Number(end)) &&
    Number(start) > 0 &&
    Number(end) >= Number(start),
  'Provide a positive inclusive sample range',
);
if (mode === 'account') {
  assert(
    accountName && Object.hasOwn(config.accounts ?? {}, accountName),
    'Account flow requires an existing label in config.accounts',
  );
  assert(
    start === end,
    'Account changes must alternate targets; run one sample at a time',
  );
}
const artifactPath = path.join(root, `${arm}-artifact.json`);
const artifact: { file: string; version: string; sha256: string } | undefined =
  existsSync(artifactPath)
    ? JSON.parse(readFileSync(artifactPath, 'utf8'))
    : undefined;
if (artifact) {
  assert(existsSync(artifact.file));
  assert(/^\d+\.\d+\.\d+$/u.test(artifact.version));
  assert(/^[a-f0-9]{64}$/u.test(artifact.sha256));
}
const context = [
  '--adapter',
  'extension',
  '--target',
  repo,
  '--cdp-port',
  String(port),
];
for (let index = Number(start); index <= Number(end); index++) {
  const out = path.join(root, `${arm}-${mode}-${index}`);
  assert(!existsSync(out), 'Never overwrite prior sample');
  mkdirSync(out);
  try {
    await run(
      harness,
      [
        'call',
        'ui.navigate',
        'page=home',
        '--target',
        repo,
        '--cdp-port',
        String(port),
        '--json',
      ],
      path.join(out, 'prepare-home.json'),
    );
    if (isColdMode(mode)) {
      await run(
        harness,
        [
          'call',
          'metamask.wallet.lock',
          '--target',
          repo,
          '--cdp-port',
          String(port),
          '--json',
        ],
        path.join(out, 'lock.json'),
      );
      writeFileSync(
        path.join(out, 'prior-browser.pid'),
        await browserPid(port),
      );
      const pid = Number(
        readFileSync(path.join(out, 'prior-browser.pid'), 'utf8'),
      );
      await run(
        harness,
        ['stop', '--adapter', 'extension', '--target', repo, '--json'],
        path.join(out, 'stop.json'),
      );
      let alive = true;
      try {
        process.kill(pid, 0);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
          alive = false;
        } else {
          throw error;
        }
      }
      assert(!alive, 'Previous browser survived stop');
      let cdpAlive = true;
      try {
        await fetch(`http://127.0.0.1:${port}/json/version`, {
          signal: AbortSignal.timeout(2000),
        });
      } catch {
        cdpAlive = false;
      }
      assert(!cdpAlive, 'Previous CDP still reachable');
      await run(
        harness,
        [
          'runtime-launch',
          ...context,
          ...(artifact
            ? [
                '--artifact-file',
                artifact.file,
                '--artifact-version',
                artifact.version,
                '--artifact-sha256',
                artifact.sha256,
                '--artifact-cache',
                path.join(root, `${arm}-artifact-cache`),
              ]
            : []),
          '--chrome-user-data-dir',
          path.join(runtime, 'chrome-profile'),
          '--artifacts-dir',
          path.join(out, 'launch'),
          '--json',
        ],
        path.join(out, 'launch.log'),
      );
      await run(
        harness,
        ['launch', '--verify', ...context, '--json'],
        path.join(out, 'verify.log'),
      );
    } else if (mode === 'account') {
      assert(accountName, 'Existing account name required');
      await run(
        harness,
        [
          'call',
          'ui.press',
          'test_id=account-menu-icon',
          '--target',
          repo,
          '--cdp-port',
          String(port),
          '--json',
        ],
        path.join(out, 'open-account-menu.json'),
      );
    }
    await run(
      process.execPath,
      [
        fileURLToPath(new URL('./measure-loading.ts', import.meta.url)),
        arm,
        mode,
        String(index),
        ...(accountName ? [accountName] : []),
      ],
      path.join(out, 'measure.log'),
    );
    const result = JSON.parse(
      readFileSync(path.join(out, 'measurements.json'), 'utf8'),
    );
    console.log(JSON.stringify({ arm, mode, index, metrics: result.metrics }));
  } catch (error) {
    writeFileSync(
      path.join(out, 'cohort-failure.json'),
      JSON.stringify({ error: String(error), arm, mode, index }, null, 2),
    );
    throw error;
  }
}
