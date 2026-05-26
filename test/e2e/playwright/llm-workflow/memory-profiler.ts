#!/usr/bin/env node
import path from 'path';
import { createWriteStream, promises as fs } from 'fs';
import type { CDPSession, Page } from '@playwright/test';
import {
  allocatePort,
  KnowledgeStore,
  setKnowledgeStore,
  type SessionLaunchResult,
  type WorkflowContext,
} from '@metamask/client-mcp-core';
import {
  ASSET_ROUTE,
  DEFAULT_ROUTE,
  SEND_ROUTE,
  SETTINGS_ROUTE,
} from '../../../../ui/helpers/constants/routes';
import { createMetaMaskE2EContext } from './capabilities/factory';
import { MetaMaskSessionManager } from './metamask-provider';
import { resolveRepoRoot } from './resolve-repo-root';

const DEFAULT_PASSWORD = 'correct horse battery staple';
const DEFAULT_ARTIFACT_DIR = 'test-artifacts/memory';
const DEFAULT_ITERATIONS = 5;
const DEFAULT_WAIT_AFTER_FLOW_MS = 500;

export type MemoryFlow =
  | 'idle'
  | 'home'
  | 'send-route'
  | 'send-open-back'
  | 'settings-route'
  | 'asset-route'
  | 'route-cycle';

export type HeapSnapshotMode = 'none' | 'baseline' | 'final' | 'both' | 'each';

export type MemorySampleMode = 'each' | 'final';

export type MemoryProbeMode = 'full' | 'cdp' | 'heap';

export type MemoryProfilerOptions = {
  iterations: number;
  flow: MemoryFlow;
  stateMode: 'default' | 'onboarding' | 'custom';
  fixturePreset?: string;
  extensionPath?: string;
  artifactDir: string;
  outputPath: string;
  snapshotMode: HeapSnapshotMode;
  sampleMode: MemorySampleMode;
  probeMode: MemoryProbeMode;
  unlock: boolean;
  password: string;
  collectGarbage: boolean;
  waitAfterFlowMs: number;
  intervalMs: number;
  slowMo: number;
  maxUsedHeapGrowthBytes?: number;
  maxJsHeapGrowthBytes?: number;
  maxDomNodesGrowth?: number;
  maxJsEventListenersGrowth?: number;
  help: boolean;
};

export type RuntimeHeapUsage = {
  usedSize: number;
  totalSize: number;
  embedderHeapUsedSize?: number;
  backingStorageSize?: number;
};

export type DomCounters = {
  documents: number;
  nodes: number;
  jsEventListeners: number;
};

export type MemorySample = {
  label: string;
  timestamp: string;
  url: string;
  runtimeHeap: RuntimeHeapUsage | null;
  performance: Record<string, number>;
  domCounters: DomCounters | null;
  liveDomElementCount: number | null;
};

export type MemoryDeltaSummary = {
  runtimeUsedSize: number | null;
  runtimeTotalSize: number | null;
  jsHeapUsedSize: number | null;
  jsHeapTotalSize: number | null;
  nodes: number | null;
  documents: number | null;
  jsEventListeners: number | null;
  liveDomElements: number | null;
};

export type ThresholdEvaluation = {
  name:
    | 'runtimeUsedSize'
    | 'jsHeapUsedSize'
    | 'nodes'
    | 'jsEventListeners';
  limit: number;
  actual: number | null;
  unit: 'bytes' | 'count';
  passed: boolean;
};

export type HeapSnapshotArtifact = {
  label: string;
  path: string;
};

export type MemoryReport = {
  schemaVersion: 1;
  createdAt: string;
  options: Omit<MemoryProfilerOptions, 'help' | 'password'>;
  session: {
    sessionId: string;
    extensionId: string;
    stateMode: MemoryProfilerOptions['stateMode'];
  };
  samples: MemorySample[];
  snapshots: HeapSnapshotArtifact[];
  summary: {
    baseline: MemorySample | null;
    final: MemorySample | null;
    deltas: MemoryDeltaSummary;
    thresholds: ThresholdEvaluation[];
  };
};

type MutableMemoryProfilerOptions = MemoryProfilerOptions;

type PortAllocation = Awaited<ReturnType<typeof allocatePort>>;

const VALID_FLOWS: MemoryFlow[] = [
  'idle',
  'home',
  'send-route',
  'send-open-back',
  'settings-route',
  'asset-route',
  'route-cycle',
];

const VALID_SNAPSHOT_MODES: HeapSnapshotMode[] = [
  'none',
  'baseline',
  'final',
  'both',
  'each',
];

const VALID_SAMPLE_MODES: MemorySampleMode[] = ['each', 'final'];

const VALID_PROBE_MODES: MemoryProbeMode[] = ['full', 'cdp', 'heap'];

export function parseMemoryProfilerArgs(
  argv: string[],
): MemoryProfilerOptions {
  const options: MutableMemoryProfilerOptions = {
    iterations: DEFAULT_ITERATIONS,
    flow: 'route-cycle',
    stateMode: 'default',
    artifactDir: DEFAULT_ARTIFACT_DIR,
    outputPath: '',
    snapshotMode: 'none',
    sampleMode: 'each',
    probeMode: 'full',
    unlock: true,
    password: DEFAULT_PASSWORD,
    collectGarbage: true,
    waitAfterFlowMs: DEFAULT_WAIT_AFTER_FLOW_MS,
    intervalMs: 0,
    slowMo: 0,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--':
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--iterations':
        options.iterations = parsePositiveInteger(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--flow':
        options.flow = parseChoice(
          readArgValue(argv, (index += 1), arg),
          VALID_FLOWS,
          arg,
        );
        break;
      case '--state':
        options.stateMode = parseChoice(
          readArgValue(argv, (index += 1), arg),
          ['default', 'onboarding', 'custom'],
          arg,
        );
        break;
      case '--preset':
        options.fixturePreset = readArgValue(argv, (index += 1), arg);
        break;
      case '--extension-path':
        options.extensionPath = path.resolve(
          readArgValue(argv, (index += 1), arg),
        );
        break;
      case '--artifact-dir':
        options.artifactDir = readArgValue(argv, (index += 1), arg);
        break;
      case '--output':
        options.outputPath = readArgValue(argv, (index += 1), arg);
        break;
      case '--snapshot':
        options.snapshotMode = parseChoice(
          readArgValue(argv, (index += 1), arg),
          VALID_SNAPSHOT_MODES,
          arg,
        );
        break;
      case '--sample':
      case '--sample-mode':
        options.sampleMode = parseChoice(
          readArgValue(argv, (index += 1), arg),
          VALID_SAMPLE_MODES,
          arg,
        );
        break;
      case '--probe':
      case '--probe-mode':
        options.probeMode = parseChoice(
          readArgValue(argv, (index += 1), arg),
          VALID_PROBE_MODES,
          arg,
        );
        break;
      case '--unlock':
        options.unlock = true;
        break;
      case '--no-unlock':
        options.unlock = false;
        break;
      case '--password':
        options.password = readArgValue(argv, (index += 1), arg);
        break;
      case '--gc':
        options.collectGarbage = true;
        break;
      case '--no-gc':
        options.collectGarbage = false;
        break;
      case '--wait-after-flow':
        options.waitAfterFlowMs = parseNonNegativeInteger(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--interval':
        options.intervalMs = parseNonNegativeInteger(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--slow-mo':
        options.slowMo = parseNonNegativeInteger(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--max-used-heap-growth':
        options.maxUsedHeapGrowthBytes = parseByteSize(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--max-js-heap-growth':
        options.maxJsHeapGrowthBytes = parseByteSize(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--max-dom-nodes-growth':
        options.maxDomNodesGrowth = parseNonNegativeInteger(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      case '--max-js-event-listeners-growth':
        options.maxJsEventListenersGrowth = parseNonNegativeInteger(
          readArgValue(argv, (index += 1), arg),
          arg,
        );
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  options.artifactDir = resolveOutputPath(options.artifactDir);
  options.outputPath = options.outputPath
    ? resolveOutputPath(options.outputPath)
    : createDefaultOutputPath(options.artifactDir);

  return options;
}

export function createMemoryReport({
  createdAt,
  launchResult,
  options,
  samples,
  snapshots,
}: {
  createdAt: string;
  launchResult: SessionLaunchResult;
  options: MemoryProfilerOptions;
  samples: MemorySample[];
  snapshots: HeapSnapshotArtifact[];
}): MemoryReport {
  const baseline = samples[0] ?? null;
  const final = samples[samples.length - 1] ?? null;
  const deltas = calculateDeltas(baseline, final);
  const { help: _help, password: _password, ...serializedOptions } = options;

  return {
    schemaVersion: 1,
    createdAt,
    options: serializedOptions,
    session: {
      sessionId: launchResult.sessionId,
      extensionId: launchResult.extensionId,
      stateMode: options.stateMode,
    },
    samples,
    snapshots,
    summary: {
      baseline,
      final,
      deltas,
      thresholds: evaluateThresholds(options, deltas),
    },
  };
}

export function calculateDeltas(
  baseline: MemorySample | null,
  final: MemorySample | null,
): MemoryDeltaSummary {
  return {
    runtimeUsedSize: delta(
      baseline?.runtimeHeap?.usedSize,
      final?.runtimeHeap?.usedSize,
    ),
    runtimeTotalSize: delta(
      baseline?.runtimeHeap?.totalSize,
      final?.runtimeHeap?.totalSize,
    ),
    jsHeapUsedSize: delta(
      baseline?.performance.JSHeapUsedSize,
      final?.performance.JSHeapUsedSize,
    ),
    jsHeapTotalSize: delta(
      baseline?.performance.JSHeapTotalSize,
      final?.performance.JSHeapTotalSize,
    ),
    nodes: delta(baseline?.domCounters?.nodes, final?.domCounters?.nodes),
    documents: delta(
      baseline?.domCounters?.documents,
      final?.domCounters?.documents,
    ),
    jsEventListeners: delta(
      baseline?.domCounters?.jsEventListeners,
      final?.domCounters?.jsEventListeners,
    ),
    liveDomElements: delta(
      baseline?.liveDomElementCount,
      final?.liveDomElementCount,
    ),
  };
}

export function evaluateThresholds(
  options: Pick<
    MemoryProfilerOptions,
    | 'maxUsedHeapGrowthBytes'
    | 'maxJsHeapGrowthBytes'
    | 'maxDomNodesGrowth'
    | 'maxJsEventListenersGrowth'
  >,
  deltas: MemoryDeltaSummary,
): ThresholdEvaluation[] {
  const thresholds: ThresholdEvaluation[] = [];

  if (options.maxUsedHeapGrowthBytes !== undefined) {
    thresholds.push(
      createThresholdEvaluation({
        name: 'runtimeUsedSize',
        limit: options.maxUsedHeapGrowthBytes,
        actual: deltas.runtimeUsedSize,
        unit: 'bytes',
      }),
    );
  }

  if (options.maxJsHeapGrowthBytes !== undefined) {
    thresholds.push(
      createThresholdEvaluation({
        name: 'jsHeapUsedSize',
        limit: options.maxJsHeapGrowthBytes,
        actual: deltas.jsHeapUsedSize,
        unit: 'bytes',
      }),
    );
  }

  if (options.maxDomNodesGrowth !== undefined) {
    thresholds.push(
      createThresholdEvaluation({
        name: 'nodes',
        limit: options.maxDomNodesGrowth,
        actual: deltas.nodes,
        unit: 'count',
      }),
    );
  }

  if (options.maxJsEventListenersGrowth !== undefined) {
    thresholds.push(
      createThresholdEvaluation({
        name: 'jsEventListeners',
        limit: options.maxJsEventListenersGrowth,
        actual: deltas.jsEventListeners,
        unit: 'count',
      }),
    );
  }

  return thresholds;
}

function createThresholdEvaluation({
  name,
  limit,
  actual,
  unit,
}: Pick<ThresholdEvaluation, 'name' | 'limit' | 'actual' | 'unit'>) {
  return {
    name,
    limit,
    actual,
    unit,
    passed: actual !== null && actual <= limit,
  };
}

export function parseByteSize(value: string, optionName = 'value'): number {
  const match = value
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(b|kb|kib|mb|mib|gb|gib)?$/iu);

  if (!match) {
    throw new Error(
      `${optionName} must be a byte size such as 5000000, 25mb, or 25MiB`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? 'b';
  const multiplier =
    {
      b: 1,
      kb: 1000,
      kib: 1024,
      mb: 1000 * 1000,
      mib: 1024 * 1024,
      gb: 1000 * 1000 * 1000,
      gib: 1024 * 1024 * 1024,
    }[unit] ?? 1;

  return Math.round(amount * multiplier);
}

export async function collectMemorySample({
  page,
  label,
  collectGarbage,
  probeMode,
}: {
  page: Page;
  label: string;
  collectGarbage: boolean;
  probeMode: MemoryProbeMode;
}): Promise<MemorySample> {
  return await withCdpSession(page, async (cdp) => {
    if (collectGarbage) {
      await cdp.send('HeapProfiler.enable');
      await cdp.send('HeapProfiler.collectGarbage');
    }

    const [
      runtimeHeap,
      performanceMetrics,
      domCounters,
      liveDomElementCount,
    ] = await Promise.all([
      getRuntimeHeapUsage(cdp),
      getPerformanceMetrics(cdp),
      shouldCollectDomCounters(probeMode)
        ? getDomCounters(cdp)
        : Promise.resolve(null),
      shouldCollectLiveDomElementCount(probeMode)
        ? getLiveDomElementCount(page)
        : Promise.resolve(null),
    ]);

    return {
      label,
      timestamp: new Date().toISOString(),
      url: page.url(),
      runtimeHeap,
      performance: performanceMetrics,
      domCounters,
      liveDomElementCount,
    };
  });
}

export async function writeHeapSnapshot({
  page,
  snapshotPath,
}: {
  page: Page;
  snapshotPath: string;
}): Promise<void> {
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });

  await withCdpSession(page, async (cdp) => {
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');

    const stream = createWriteStream(snapshotPath, { encoding: 'utf8' });
    const finished = new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    cdp.on('HeapProfiler.addHeapSnapshotChunk', (event: unknown) => {
      const { chunk } = event as { chunk?: string };
      if (chunk) {
        stream.write(chunk);
      }
    });

    try {
      await cdp.send('HeapProfiler.takeHeapSnapshot', {
        reportProgress: false,
      });
    } finally {
      stream.end();
    }

    await finished;
  });
}

export async function runMemoryProfiler(
  options: MemoryProfilerOptions,
): Promise<MemoryReport> {
  const repoRoot = resolveRepoRoot();
  const sessionManager = new MetaMaskSessionManager();
  const snapshots: HeapSnapshotArtifact[] = [];
  const samples: MemorySample[] = [];
  let launchResult: SessionLaunchResult | undefined;

  setKnowledgeStore(new KnowledgeStore());

  const [anvilAlloc, fixtureAlloc, mockAlloc] = await Promise.all([
    allocatePort(),
    allocatePort(),
    allocatePort(),
  ]);

  await Promise.all([
    releasePort(anvilAlloc),
    releasePort(fixtureAlloc),
    releasePort(mockAlloc),
  ]);

  const context = createMetaMaskE2EContext({
    config: {
      ports: {
        anvil: anvilAlloc.port,
        fixtureServer: fixtureAlloc.port,
      },
      artifactsDir: path.relative(repoRoot, options.artifactDir),
    },
    mockServer: {
      port: mockAlloc.port,
    },
  });

  sessionManager.setWorkflowContext(context as WorkflowContext);

  try {
    launchResult = await sessionManager.launch({
      stateMode: options.stateMode,
      fixturePreset: options.fixturePreset,
      extensionPath: options.extensionPath,
      slowMo: options.slowMo,
      goal: 'Collect browser heap telemetry for leak investigation',
      flowTags: ['memory', options.flow],
    });

    const page = sessionManager.getPage();

    if (options.unlock) {
      await unlockIfNeeded(page, options.password);
    }

    await runFlowIteration({
      page,
      extensionId: launchResult.extensionId,
      flow: 'home',
      waitAfterFlowMs: options.waitAfterFlowMs,
    });

    if (shouldCaptureSnapshot(options.snapshotMode, 'baseline')) {
      const snapshotPath = createSnapshotPath(options, 'baseline');
      await writeHeapSnapshot({ page, snapshotPath });
      snapshots.push({ label: 'baseline', path: snapshotPath });
    }

    samples.push(
      await collectMemorySample({
        page,
        label: 'baseline',
        collectGarbage: options.collectGarbage,
        probeMode: options.probeMode,
      }),
    );

    for (let iteration = 1; iteration <= options.iterations; iteration += 1) {
      await runFlowIteration({
        page,
        extensionId: launchResult.extensionId,
        flow: options.flow,
        waitAfterFlowMs: options.waitAfterFlowMs,
      });

      if (options.sampleMode === 'each') {
        samples.push(
          await collectMemorySample({
            page,
            label: `iteration-${iteration}`,
            collectGarbage: options.collectGarbage,
            probeMode: options.probeMode,
          }),
        );
      }

      if (shouldCaptureSnapshot(options.snapshotMode, 'each')) {
        const snapshotPath = createSnapshotPath(
          options,
          `iteration-${iteration}`,
        );
        await writeHeapSnapshot({ page, snapshotPath });
        snapshots.push({
          label: `iteration-${iteration}`,
          path: snapshotPath,
        });
      }

      if (options.intervalMs > 0 && iteration < options.iterations) {
        await page.waitForTimeout(options.intervalMs);
      }
    }

    if (options.sampleMode === 'final') {
      samples.push(
        await collectMemorySample({
          page,
          label: 'final',
          collectGarbage: options.collectGarbage,
          probeMode: options.probeMode,
        }),
      );
    }

    if (shouldCaptureSnapshot(options.snapshotMode, 'final')) {
      const snapshotPath = createSnapshotPath(options, 'final');
      await writeHeapSnapshot({ page, snapshotPath });
      snapshots.push({ label: 'final', path: snapshotPath });
    }

    const report = createMemoryReport({
      createdAt: new Date().toISOString(),
      launchResult,
      options,
      samples,
      snapshots,
    });

    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
    await fs.writeFile(options.outputPath, `${JSON.stringify(report, null, 2)}\n`);

    return report;
  } finally {
    await sessionManager.cleanup();
  }
}

export function formatBytes(value: number | null): string {
  if (value === null) {
    return 'n/a';
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
}

export function getHelpText(): string {
  return `Usage: yarn llm:memory -- [options]

Collect MetaMask extension memory telemetry through Chrome DevTools Protocol.

Options:
  --iterations <n>              Number of flow iterations. Default: ${DEFAULT_ITERATIONS}
  --flow <name>                 idle, home, send-route, send-open-back, settings-route, asset-route, route-cycle
  --state <mode>                default, onboarding, custom. Default: default
  --preset <name>               Fixture preset when --state custom is used
  --extension-path <path>       Extension build path. Default: dist/chrome
  --artifact-dir <path>         Artifact directory. Default: ${DEFAULT_ARTIFACT_DIR}
  --output <path>               JSON report path
  --snapshot <mode>             none, baseline, final, both, each. Default: none
  --sample <mode>               each, final. Default: each
  --probe <mode>                full, cdp, heap. Default: full
  --unlock / --no-unlock        Unlock the default wallet before profiling. Default: unlock
  --password <password>         Wallet password. Default: MetaMask E2E password
  --gc / --no-gc                Run HeapProfiler.collectGarbage before sampling. Default: gc
  --wait-after-flow <ms>        Delay after each flow iteration. Default: ${DEFAULT_WAIT_AFTER_FLOW_MS}
  --interval <ms>               Delay between iterations. Default: 0
  --slow-mo <ms>                Playwright slowMo launch option. Default: 0
  --max-used-heap-growth <size> Fail if Runtime.getHeapUsage usedSize grows above size
  --max-js-heap-growth <size>   Fail if Performance JSHeapUsedSize grows above size
  --max-dom-nodes-growth <n>    Fail if Memory.getDOMCounters nodes grow above count
  --max-js-event-listeners-growth <n>
                                Fail if Memory.getDOMCounters listeners grow above count
  --help                        Show this help text

Examples:
  yarn llm:memory -- --iterations 25 --flow route-cycle --snapshot final
  yarn llm:memory -- --iterations 50 --max-used-heap-growth 25MiB
  yarn llm:memory -- --iterations 50 --flow send-open-back --sample final --probe cdp
`;
}

async function main(): Promise<void> {
  const options = parseMemoryProfilerArgs(process.argv.slice(2));

  if (options.help) {
    console.log(getHelpText());
    return;
  }

  const report = await runMemoryProfiler(options);
  const failedThresholds = report.summary.thresholds.filter(
    (threshold) => !threshold.passed,
  );

  console.log(`Memory report: ${options.outputPath}`);
  console.log(
    `Runtime used heap delta: ${formatBytes(report.summary.deltas.runtimeUsedSize)}`,
  );
  console.log(
    `Performance JS heap delta: ${formatBytes(report.summary.deltas.jsHeapUsedSize)}`,
  );
  console.log(`DOM node delta: ${report.summary.deltas.nodes ?? 'n/a'}`);
  console.log(
    `JS event listener delta: ${
      report.summary.deltas.jsEventListeners ?? 'n/a'
    }`,
  );
  console.log(
    `Live DOM element delta: ${report.summary.deltas.liveDomElements ?? 'n/a'}`,
  );

  if (report.snapshots.length > 0) {
    console.log(
      `Heap snapshots: ${report.snapshots
        .map((snapshot) => snapshot.path)
        .join(', ')}`,
    );
  }

  if (failedThresholds.length > 0) {
    for (const threshold of failedThresholds) {
      console.error(
        `Memory threshold failed: ${threshold.name} grew by ${formatThresholdValue(
          threshold,
          threshold.actual,
        )}, limit ${formatThresholdValue(threshold, threshold.limit)}`,
      );
    }
    process.exitCode = 1;
  }
}

function formatThresholdValue(
  threshold: Pick<ThresholdEvaluation, 'unit'>,
  value: number | null,
): string {
  if (threshold.unit === 'bytes') {
    return formatBytes(value);
  }

  return value === null ? 'n/a' : `${value}`;
}

function readArgValue(
  argv: string[],
  valueIndex: number,
  optionName: string,
): string {
  const value = argv[valueIndex];

  if (!value || value.startsWith('--')) {
    throw new Error(`${optionName} requires a value`);
  }

  return value;
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = parseNonNegativeInteger(value, optionName);

  if (parsed < 1) {
    throw new Error(`${optionName} must be greater than 0`);
  }

  return parsed;
}

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${optionName} must be a non-negative integer`);
  }

  return parsed;
}

function parseChoice<Choice extends string>(
  value: string,
  choices: readonly Choice[],
  optionName: string,
): Choice {
  if (!choices.includes(value as Choice)) {
    throw new Error(`${optionName} must be one of: ${choices.join(', ')}`);
  }

  return value as Choice;
}

function resolveOutputPath(outputPath: string): string {
  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(resolveRepoRoot(), outputPath);
}

function createDefaultOutputPath(artifactDir: string): string {
  return path.join(artifactDir, `memory-profile-${Date.now()}.json`);
}

function delta(
  baselineValue: number | null | undefined,
  finalValue: number | null | undefined,
): number | null {
  if (typeof baselineValue !== 'number' || typeof finalValue !== 'number') {
    return null;
  }

  return finalValue - baselineValue;
}

async function getRuntimeHeapUsage(
  cdp: CDPSession,
): Promise<RuntimeHeapUsage | null> {
  try {
    return (await cdp.send('Runtime.getHeapUsage')) as RuntimeHeapUsage;
  } catch {
    return null;
  }
}

async function getPerformanceMetrics(
  cdp: CDPSession,
): Promise<Record<string, number>> {
  try {
    await cdp.send('Performance.enable');
    const result = (await cdp.send('Performance.getMetrics')) as {
      metrics: { name: string; value: number }[];
    };

    return Object.fromEntries(
      result.metrics.map(({ name, value }) => [name, value]),
    );
  } catch {
    return {};
  }
}

async function getDomCounters(cdp: CDPSession): Promise<DomCounters | null> {
  try {
    return (await cdp.send('Memory.getDOMCounters')) as DomCounters;
  } catch {
    return null;
  }
}

async function getLiveDomElementCount(page: Page): Promise<number | null> {
  try {
    return await page.locator('body *').count();
  } catch {
    return null;
  }
}

function shouldCollectDomCounters(probeMode: MemoryProbeMode): boolean {
  return probeMode === 'full' || probeMode === 'cdp';
}

function shouldCollectLiveDomElementCount(
  probeMode: MemoryProbeMode,
): boolean {
  return probeMode === 'full';
}

async function withCdpSession<Result>(
  page: Page,
  callback: (cdp: CDPSession) => Promise<Result>,
): Promise<Result> {
  const cdp = await page.context().newCDPSession(page);

  try {
    return await callback(cdp);
  } finally {
    await cdp.detach().catch(() => undefined);
  }
}

function shouldCaptureSnapshot(
  mode: HeapSnapshotMode,
  point: 'baseline' | 'final' | 'each',
): boolean {
  if (mode === 'each') {
    return true;
  }

  if (mode === 'both') {
    return point === 'baseline' || point === 'final';
  }

  return mode === point;
}

function createSnapshotPath(
  options: Pick<MemoryProfilerOptions, 'artifactDir'>,
  label: string,
): string {
  return path.join(
    options.artifactDir,
    `heap-${label}-${Date.now()}.heapsnapshot`,
  );
}

async function unlockIfNeeded(page: Page, password: string): Promise<boolean> {
  const passwordInput = page.locator('[data-testid="unlock-password"]');
  const isLocked = await passwordInput
    .isVisible({ timeout: 1500 })
    .catch(() => false);

  if (!isLocked) {
    return false;
  }

  await passwordInput.fill(password);
  await page.locator('[data-testid="unlock-submit"]').click();
  await page
    .locator('[data-testid="account-menu-icon"]')
    .waitFor({ state: 'visible', timeout: 30000 });

  return true;
}

async function runFlowIteration({
  page,
  extensionId,
  flow,
  waitAfterFlowMs,
}: {
  page: Page;
  extensionId: string;
  flow: MemoryFlow;
  waitAfterFlowMs: number;
}): Promise<void> {
  switch (flow) {
    case 'idle':
      await page.waitForTimeout(waitAfterFlowMs);
      return;
    case 'home':
      await navigateExtensionRoute(page, extensionId, DEFAULT_ROUTE);
      break;
    case 'send-route':
      await navigateExtensionRoute(page, extensionId, SEND_ROUTE);
      await navigateExtensionRoute(page, extensionId, DEFAULT_ROUTE);
      break;
    case 'send-open-back':
      await runSendOpenBackFlow(page);
      break;
    case 'settings-route':
      await navigateExtensionRoute(page, extensionId, SETTINGS_ROUTE);
      await navigateExtensionRoute(page, extensionId, DEFAULT_ROUTE);
      break;
    case 'asset-route':
      await navigateExtensionRoute(page, extensionId, `${ASSET_ROUTE}/0x539`);
      await navigateExtensionRoute(page, extensionId, DEFAULT_ROUTE);
      break;
    case 'route-cycle':
      await navigateExtensionRoute(page, extensionId, SETTINGS_ROUTE);
      await navigateExtensionRoute(page, extensionId, SEND_ROUTE);
      await navigateExtensionRoute(page, extensionId, `${ASSET_ROUTE}/0x539`);
      await navigateExtensionRoute(page, extensionId, DEFAULT_ROUTE);
      break;
    default:
      throw new Error('Unsupported memory flow');
  }

  if (waitAfterFlowMs > 0) {
    await page.waitForTimeout(waitAfterFlowMs);
  }
}

async function runSendOpenBackFlow(page: Page): Promise<void> {
  const sendButton = page
    .locator('[data-testid="eth-overview-send"], [data-testid="coin-overview-send"]')
    .first();
  await sendButton.waitFor({ state: 'visible', timeout: 30000 });
  await sendButton.click();

  const backButton = page.locator('[aria-label="go to previous page"]').first();
  await backButton.waitFor({ state: 'visible', timeout: 30000 });
  await backButton.click();
  await sendButton.waitFor({ state: 'visible', timeout: 30000 });
}

export async function navigateExtensionRoute(
  page: Page,
  extensionId: string,
  route: string,
): Promise<void> {
  await page.goto(`chrome-extension://${extensionId}/home.html#${route}`);
  await page.waitForLoadState('domcontentloaded');
}

function releasePort(alloc: PortAllocation): Promise<void> {
  return new Promise<void>((resolve) => alloc.server.close(() => resolve()));
}

if (require.main === module) {
  main().catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });
}
