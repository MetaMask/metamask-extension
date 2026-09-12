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

import {
  browserPid,
  isColdMode,
  resolveMeasurementPath,
} from './browser-process.ts'; // eslint-disable-line import-x/extensions -- Native Node TypeScript execution requires the extension.

/**
 * Execute a measurement command against its prepared runtime.
 * @param args - Arguments without the executable and script path.
 */
export async function runLoadingCohort(
  args: string[] = process.argv.slice(2),
): Promise<void> {
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
  const root = resolveMeasurementPath(process.cwd(), config.artifactsDir);
  const runtime = resolveMeasurementPath(process.cwd(), config.runtimeDir);
  const port = config.cdpPort;
  const { extensionId } = config;
  assert(Number.isInteger(port) && port > 0 && port < 65536);
  assert(/^[a-p]{32}$/u.test(extensionId));

  const repo = process.cwd();
  const harness = process.env.MM_HARNESS_BIN ?? 'mm-harness';
  const contract: { harnessVersion: string } = JSON.parse(
    execFileSync(harness, ['help', '--json'], { encoding: 'utf8' }),
  );
  assert(
    contract.harnessVersion === config.harnessVersion,
    'Harness baseline changed',
  );
  mkdirSync(root, { recursive: true });
  const [arm, mode, start, end, accountName] = args;
  assert(['before', 'after'].includes(arm));
  assert(
    ['immediate', 'delayed', 'warm', 'background_resume', 'account'].includes(
      mode,
    ),
  );
  async function run(command: string, commandArgs: string[], output: string) {
    const fd = openSync(output, 'wx');
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(command, commandArgs, {
          cwd: repo,
          stdio: ['ignore', fd, fd],
        });
        child.on('error', reject);
        child.on('exit', (code) =>
          code === 0
            ? resolve()
            : reject(new Error(`${command} exited ${code}: ${output}`)),
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
  const artifactPath = resolveMeasurementPath(root, `${arm}-artifact.json`);
  const artifact:
    | { file: string; version: string; sha256: string }
    | undefined = existsSync(artifactPath)
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
    const out = resolveMeasurementPath(root, `${arm}-${mode}-${index}`);
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
        resolveMeasurementPath(out, 'prepare-home.json'),
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
          resolveMeasurementPath(out, 'lock.json'),
        );
        writeFileSync(
          resolveMeasurementPath(out, 'prior-browser.pid'),
          await browserPid(port),
        );
        const pid = Number(
          readFileSync(
            resolveMeasurementPath(out, 'prior-browser.pid'),
            'utf8',
          ),
        );
        await run(
          harness,
          ['stop', '--adapter', 'extension', '--target', repo, '--json'],
          resolveMeasurementPath(out, 'stop.json'),
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
            resolveMeasurementPath(out, 'launch'),
            '--json',
          ],
          resolveMeasurementPath(out, 'launch.log'),
        );
        await run(
          harness,
          ['launch', '--verify', ...context, '--json'],
          resolveMeasurementPath(out, 'verify.log'),
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
          resolveMeasurementPath(out, 'open-account-menu.json'),
        );
      }
      await run(
        process.execPath,
        [
          path.join(repo, 'development/perps/loading/measure-loading.ts'),
          arm,
          mode,
          String(index),
          ...(accountName ? [accountName] : []),
        ],
        resolveMeasurementPath(out, 'measure.log'),
      );
      const result = JSON.parse(
        readFileSync(resolveMeasurementPath(out, 'measurements.json'), 'utf8'),
      );
      console.log(
        JSON.stringify({ arm, mode, index, metrics: result.metrics }),
      );
    } catch (error) {
      writeFileSync(
        resolveMeasurementPath(out, 'cohort-failure.json'),
        JSON.stringify({ error: String(error), arm, mode, index }, null, 2),
      );
      throw error;
    }
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.join(process.cwd(), 'development/perps/loading/run-loading-cohort.ts')
) {
  runLoadingCohort().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
