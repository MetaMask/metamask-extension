/** @jest-environment node */
import { spawnSync } from 'node:child_process';
import * as childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import {
  cpSync,
  realpathSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it as jestIt } from '@jest/globals';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
} from '../../../shared/lib/perps-formatters';
import { resolveMeasurementPath } from './browser-process';
import { summarizeLoading } from './summarize-loading';
import { measureLoading } from './measure-loading';
import { runLoadingCohort } from './run-loading-cohort';

jest.mock('node:child_process', () => ({
  ...jest.requireActual('node:child_process'),
  execFileSync: jest.fn(),
  spawn: jest.fn(),
}));

describe('loading cohort summary', () => {
  let root: string;
  const hash = 'a'.repeat(64);
  const samples = ['after-warm-1', 'after-warm-2', 'after-warm-3'];

  function write(relative: string, value: unknown) {
    writeFileSync(path.join(root, relative), JSON.stringify(value));
  }

  function summarize() {
    try {
      const report = summarizeLoading(root, root);
      return { status: report.complete ? 0 : 1, stderr: '' };
    } catch (error) {
      return { status: 1, stderr: String(error) };
    }
  }

  beforeEach(() => {
    root = realpathSync(
      mkdtempSync(path.join(process.cwd(), 'temp/perps-summary-test-')),
    );
    write('sample-manifest.json', {
      cohorts: [
        {
          arm: 'after',
          mode: 'warm',
          sourceRef: 'fixture-only',
          collectorSha256: hash,
          formatterSha256: hash,
          buildProvenanceSha256: hash,
          samples,
        },
      ],
    });
    samples.forEach((sample, index) => {
      mkdirSync(path.join(root, sample, 'recipe-run'), { recursive: true });
      write(`${sample}/recipe-run/summary.json`, { status: 'pass' });
      write(`${sample}/measurements.json`, {
        arm: 'after',
        mode: 'warm',
        build: { sourceRef: 'fixture-only', provenanceSha256: hash },
        collectorSha256: hash,
        formatterSha256: hash,
        metrics: { entryToRowsMs: 10 + index, entryToLiveMs: 20 + index },
        accuracy: [{ matched: true }],
        observation: {
          entry: 100,
          firstRows: 110 + index,
          ready: 120 + index,
          selectedAddress: '0xABC',
          managerAddress: '0xabc',
        },
      });
    });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('supports the Node CLI entrypoint', () => {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, 'summarize-loading.ts'), root],
      { encoding: 'utf8', cwd: process.cwd() },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).complete).toBe(true);
  });

  jestIt.each(['measure-loading', 'run-loading-cohort', 'summarize-loading'])(
    'does not invoke %s when imported by a same-named script elsewhere',
    (name) => {
      const importer = path.join(root, `${name}.ts`);
      writeFileSync(
        importer,
        `import ${JSON.stringify(path.join(__dirname, `${name}.ts`))};\nconsole.log('imported without running');\n`,
      );
      const result = spawnSync(process.execPath, [importer], {
        encoding: 'utf8',
        cwd: process.cwd(),
      });
      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toBe('imported without running');
    },
  );

  it('rejects paths and symlinks outside the artifact workspace', () => {
    expect(resolveMeasurementPath(root, 'nested/new.json')).toBe(
      path.join(root, 'nested/new.json'),
    );
    expect(() => resolveMeasurementPath(root, '../escape.json')).toThrow(
      'Measurement path leaves its workspace',
    );
    const outside = mkdtempSync(path.join(tmpdir(), 'perps-outside-test-'));
    try {
      symlinkSync(outside, path.join(root, 'outside'));
      expect(() => resolveMeasurementPath(root, 'outside/new.json')).toThrow(
        'Measurement symlink leaves its workspace',
      );
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('computes the declared median and excludes undeclared probes', () => {
    mkdirSync(path.join(root, 'after-warm-probe'));
    const result = summarize();
    expect(result.status).toBe(0);
    const report = JSON.parse(
      readFileSync(path.join(root, 'comparison.json'), 'utf8'),
    );
    expect(report.complete).toBe(true);
    expect(report.excluded).toStrictEqual(['after-warm-probe']);
    expect(report.groups[0].clickToRows).toStrictEqual({
      count: 3,
      median: 11,
      min: 10,
      max: 12,
    });
  });

  it('rejects different executable builds with the same source reference', () => {
    const file = `${samples[0]}/measurements.json`;
    const value = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    value.build.provenanceSha256 = 'b'.repeat(64);
    write(file, value);
    const result = summarize();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Unexpected executable build mixture');
  });

  it('fails an incomplete declared cohort and retains the failed sample', () => {
    write(`${samples[0]}/failure.json`, { error: 'synthetic failure' });
    const result = summarize();
    expect(result.status).toBe(1);
    const report = JSON.parse(
      readFileSync(path.join(root, 'comparison.json'), 'utf8'),
    );
    expect(report.complete).toBe(false);
    expect(report.failures).toStrictEqual([samples[0]]);
    expect(report.groups[0].clickToRows.count).toBe(2);
  });

  it('rejects duplicate cohort keys even when each cohort has valid provenance', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'sample-manifest.json'), 'utf8'),
    );
    const secondSamples = samples.map((sample, index) => {
      const name = `after-warm-${index + 4}`;
      cpSync(path.join(root, sample), path.join(root, name), {
        recursive: true,
      });
      const file = `${name}/measurements.json`;
      const value = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
      value.build.provenanceSha256 = 'b'.repeat(64);
      write(file, value);
      return name;
    });
    manifest.cohorts.push({
      ...manifest.cohorts[0],
      samples: secondSamples,
      buildProvenanceSha256: 'b'.repeat(64),
    });
    write('sample-manifest.json', manifest);
    const result = summarize();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Duplicate cohort key');
  });

  it('reports an absent declared sample directory as missing', () => {
    rmSync(path.join(root, samples[0]), { recursive: true });
    const report = summarizeLoading(root, root);
    expect(report.complete).toBe(false);
    expect(report.missing).toStrictEqual([samples[0]]);
  });

  it('rejects an external nested recipe-summary symlink', () => {
    const outside = mkdtempSync(path.join(tmpdir(), 'perps-summary-leaf-'));
    try {
      const destination = path.join(outside, 'summary.json');
      writeFileSync(destination, JSON.stringify({ status: 'pass' }));
      const summary = path.join(root, samples[0], 'recipe-run/summary.json');
      rmSync(summary);
      symlinkSync(destination, summary);
      expect(() => summarizeLoading(root, root)).toThrow(
        'Measurement symlink leaves its workspace',
      );
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('rejects a duration inconsistent with its raw timestamps', () => {
    const file = `${samples[0]}/measurements.json`;
    const value = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    value.metrics.entryToRowsMs = 0;
    write(file, value);
    expect(summarize().status).not.toBe(0);
  });
});

describe('loading measurement command boundaries', () => {
  let root: string;
  let configPath: string;
  let originalConfig: string | undefined;
  const extensionId = 'a'.repeat(32);
  const requests: { method: string; params: Record<string, unknown> }[] = [];
  const sockets: MockSocket[] = [];
  const originalWebSocket = globalThis.WebSocket;
  let visibility = 'visible';
  let invalidPrice = false;
  let cold = false;
  let browserStopped = false;
  let exitCode = 0;

  class MockSocket {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Match the WebSocket API.
    static OPEN = 1;

    readyState = 1;

    onopen: (() => void) | null = null;

    onclose: (() => void) | null = null;

    onmessage: ((event: { data: string }) => void) | null = null;

    constructor() {
      sockets.push(this);
      queueMicrotask(() => this.onopen?.());
    }

    send(data: string) {
      const message = JSON.parse(data);
      requests.push(message);
      let result: Record<string, unknown> = {};
      if (message.method === 'SystemInfo.getProcessInfo') {
        result = { processInfo: [{ type: 'browser', id: 101 }] };
      } else if (message.method === 'Target.createTarget') {
        result = { targetId: 'temporary' };
      } else if (message.method === 'Target.activateTarget') {
        visibility =
          message.params.targetId === 'temporary' ? 'hidden' : 'visible';
      } else if (message.method === 'Runtime.evaluate') {
        const { expression } = message.params;
        let value: unknown = true;
        if (expression === 'window.__perpsMeasure') {
          value = {
            entry: 100,
            firstRows: 110,
            ready: 120,
            unlocked: 90,
            unlock: 80,
            dataReady: 105,
            managerAddress: '0xabc',
            selectedAddress: '0xABC',
            rowProof: [
              {
                symbol: 'BTC',
                displayed: invalidPrice
                  ? '$999'
                  : formatPerpsFiat(12, { ranges: PRICE_RANGES_UNIVERSAL }),
                quote: { price: '12' },
              },
            ],
            visibility: [
              { state: 'hidden', at: 1 },
              { state: 'visible', at: 2 },
            ],
          };
        } else if (
          expression ===
          'globalThis.stateHooks?.store?.getState()?.metamask?.isUnlocked'
        ) {
          value = !cold;
        } else if (expression === 'document.visibilityState') {
          value = visibility;
        } else if (String(expression).startsWith('Math.max')) {
          value = 0;
        }
        result = {
          result:
            expression === 'globalThis' ? { objectId: 'global' } : { value },
        };
      }
      if (message.method === 'Network.enable') {
        queueMicrotask(() => {
          for (const event of [
            {
              method: 'Network.requestWillBeSent',
              params: {
                requestId: 'metadata',
                request: {
                  url: 'https://terminal.example/v1/perpetuals',
                  method: 'GET',
                },
                timestamp: 1,
                wallTime: 1,
              },
            },
            {
              method: 'Network.responseReceived',
              params: {
                requestId: 'metadata',
                response: { status: 200, fromDiskCache: false },
                timestamp: 2,
              },
            },
            {
              method: 'Network.loadingFinished',
              params: {
                requestId: 'metadata',
                encodedDataLength: 100,
                timestamp: 3,
              },
            },
          ]) {
            this.onmessage?.({ data: JSON.stringify(event) });
          }
        });
      }
      queueMicrotask(() =>
        this.onmessage?.({ data: JSON.stringify({ id: message.id, result }) }),
      );
    }

    close() {
      this.readyState = 3;
      this.onclose?.();
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    root = mkdtempSync(path.join(process.cwd(), 'temp/perps-command-test-'));
    mkdirSync(path.join(root, 'runtime/runtime-dist'), { recursive: true });
    writeFileSync(path.join(root, 'runtime/runtime-dist/manifest.json'), '{}');
    const provenance = {
      sourceRef: 'test-only',
      files: [
        {
          file: 'manifest.json',
          sha256: createHash('sha256').update('{}').digest('hex'),
        },
      ],
    };
    writeFileSync(
      path.join(root, 'after-build-provenance.json'),
      JSON.stringify(provenance),
    );
    configPath = path.join(root, 'config.json');
    writeFileSync(
      configPath,
      JSON.stringify({
        artifactsDir: root,
        runtimeDir: path.join(root, 'runtime'),
        cdpPort: 7661,
        extensionId,
        harnessVersion: '0.50.5',
        accounts: { 'quoted-account': "account');throw new Error('injected" },
      }),
    );
    originalConfig = process.env.PERPS_MEASUREMENT_CONFIG;
    process.env.PERPS_MEASUREMENT_CONFIG = configPath;
    requests.length = 0;
    sockets.length = 0;
    visibility = 'visible';
    invalidPrice = false;
    cold = false;
    browserStopped = false;
    exitCode = 0;
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url: string | URL | Request) => {
        if (browserStopped) {
          throw new Error('CDP stopped');
        }
        return {
          json: async () =>
            String(url).endsWith('/json/version')
              ? { webSocketDebuggerUrl: 'ws://127.0.0.1:7661/browser' }
              : [
                  {
                    id: 'page',
                    type: 'page',
                    url: `chrome-extension://${extensionId}/home.html`,
                    webSocketDebuggerUrl: 'ws://127.0.0.1:7661/page',
                  },
                ],
        } as Response;
      });
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      writable: true,
      value: MockSocket,
    });
    jest
      .spyOn(childProcess, 'execFileSync')
      .mockImplementation((file) =>
        file === 'git'
          ? 'test-head'
          : JSON.stringify({ harnessVersion: '0.50.5' }),
      );
    jest.spyOn(childProcess, 'spawn').mockImplementation((command, args) => {
      if (args?.[0] === 'stop') {
        browserStopped = true;
      }
      if (args?.[0] === 'runtime-launch') {
        browserStopped = false;
      }
      if (
        command === process.execPath &&
        args?.[0]?.endsWith('/measure-loading.ts')
      ) {
        const [, arm, mode, index] = args;
        writeFileSync(
          path.join(root, `${arm}-${mode}-${index}/measurements.json`),
          JSON.stringify({ metrics: { entryToRowsMs: 10 } }),
        );
      }
      const child = new EventEmitter();
      queueMicrotask(() => child.emit('exit', exitCode));
      return child as ReturnType<typeof childProcess.spawn>;
    });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalConfig === undefined) {
      delete process.env.PERPS_MEASUREMENT_CONFIG;
    } else {
      process.env.PERPS_MEASUREMENT_CONFIG = originalConfig;
    }
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      writable: true,
      value: originalWebSocket,
    });
    jest.restoreAllMocks();
    rmSync(root, { recursive: true, force: true });
  });

  jestIt.each(['warm', 'account', 'background_resume'])(
    'records matching prices and cleans up after a %s sample',
    async (mode) => {
      await measureLoading(['after', mode, '1', 'quoted-account']);
      const result = JSON.parse(
        readFileSync(
          path.join(root, `after-${mode}-1/measurements.json`),
          'utf8',
        ),
      );
      expect(result.metrics.entryToRowsMs).toBe(10);
      expect(result.accuracy[0].matched).toBe(true);
      expect(sockets.every((socket) => socket.readyState === 3)).toBe(true);
      expect(requests).toContainEqual(
        expect.objectContaining({
          method: 'Network.setCacheDisabled',
          params: { cacheDisabled: false },
        }),
      );
    },
  );

  it('passes account identifiers as CDP values without interpreting code', async () => {
    await measureLoading(['after', 'account', '1', 'quoted-account']);

    const call = requests.find(
      (request) =>
        request.method === 'Runtime.callFunctionOn' &&
        String(request.params.functionDeclaration).includes(
          'function(accountId)',
        ),
    );
    expect(call?.params.arguments).toStrictEqual([
      { value: "account');throw new Error('injected" },
    ]);
    expect(call?.params.functionDeclaration).not.toContain('injected');
  });

  jestIt.each(['immediate', 'delayed'])(
    'requires a replacement browser and uncached backend response for %s cold samples',
    async (mode) => {
      cold = true;
      mkdirSync(path.join(root, `after-${mode}-1`));
      writeFileSync(
        path.join(root, `after-${mode}-1/prior-browser.pid`),
        '100',
      );
      await measureLoading(['after', mode, '1']);
      const result = JSON.parse(
        readFileSync(
          path.join(root, `after-${mode}-1/measurements.json`),
          'utf8',
        ),
      );
      expect(result.beforePid).toBe('100');
      expect(result.afterPid).toBe('101');
      expect(result.requests).toContainEqual(
        expect.objectContaining({
          url: 'https://terminal.example/v1/perpetuals',
          status: 200,
          diskCache: false,
          bytes: 100,
        }),
      );
    },
  );

  it('stops and verifies browser replacement before collecting a cold cohort', async () => {
    jest.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('gone'), { code: 'ESRCH' });
    });
    await runLoadingCohort(['after', 'immediate', '1', '1']);
    const commands = jest
      .mocked(childProcess.spawn)
      .mock.calls.map(([, args]) => args?.[0]);
    expect(commands.slice(0, 5)).toStrictEqual([
      'call',
      'call',
      'stop',
      'runtime-launch',
      'launch',
    ]);
    expect(
      readFileSync(
        path.join(root, 'after-immediate-1/prior-browser.pid'),
        'utf8',
      ),
    ).toBe('101');
  });

  jestIt.each(['measurements.json', 'failure.json'])(
    'rejects an external %s leaf symlink without overwriting its destination',
    async (file) => {
      const outside = mkdtempSync(path.join(tmpdir(), 'perps-leaf-test-'));
      const destination = path.join(outside, 'untouched.json');
      writeFileSync(destination, 'unchanged');
      mkdirSync(path.join(root, 'after-warm-1'));
      symlinkSync(destination, path.join(root, 'after-warm-1', file));
      invalidPrice = file === 'failure.json';
      try {
        await expect(measureLoading(['after', 'warm', '1'])).rejects.toThrow(
          'Measurement symlink leaves its workspace',
        );
        expect(readFileSync(destination, 'utf8')).toBe('unchanged');
      } finally {
        rmSync(outside, { recursive: true, force: true });
      }
    },
  );

  it('retains evidence and restores cache settings when prices do not match', async () => {
    invalidPrice = true;
    await expect(measureLoading(['after', 'warm', '1'])).rejects.toThrow(
      'Displayed prices do not match',
    );
    expect(
      JSON.parse(
        readFileSync(path.join(root, 'after-warm-1/failure.json'), 'utf8'),
      ).error,
    ).toContain('Displayed prices do not match');
    expect(sockets.every((socket) => socket.readyState === 3)).toBe(true);
  });

  it('cleans up the temporary tab after a visibility transition', async () => {
    await measureLoading(['resume']);
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'Target.closeTarget',
        params: { targetId: 'temporary' },
      }),
    );
    expect(visibility).toBe('visible');
  });

  it('executes readiness and delayed-entry commands without starting a cohort', async () => {
    await measureLoading(['assert']);
    await measureLoading(['delay', 'delayed']);
    expect(childProcess.spawn).not.toHaveBeenCalled();
  });

  jestIt.each(['warm', 'account', 'background_resume'])(
    'runs one prepared %s cohort without relaunching the browser',
    async (mode) => {
      await runLoadingCohort(['after', mode, '1', '1', 'quoted-account']);
      const { calls } = jest.mocked(childProcess.spawn).mock;
      expect(calls.at(-1)?.[0]).toBe(process.execPath);
      expect(calls.some(([, args]) => args?.includes('runtime-launch'))).toBe(
        false,
      );
      expect(
        calls.some(([, args]) => args?.includes('--launch-existing-dist')),
      ).toBe(false);
      expect(calls).toHaveLength(mode === 'account' ? 3 : 2);
      await expect(
        runLoadingCohort(['after', mode, '1', '1', 'quoted-account']),
      ).rejects.toThrow('Never overwrite prior sample');
    },
  );

  it('preserves a failing cohort command instead of attempting later runtime actions', async () => {
    exitCode = 1;
    await expect(runLoadingCohort(['after', 'warm', '1', '1'])).rejects.toThrow(
      'exited 1',
    );
    expect(childProcess.spawn).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(
        readFileSync(
          path.join(root, 'after-warm-1/cohort-failure.json'),
          'utf8',
        ),
      ).error,
    ).toContain('exited 1');
  });
});
