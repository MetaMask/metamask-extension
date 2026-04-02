import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

type Args = {
  iterations: number;
  out?: string;
  refLabel: string;
};

type PhaseSample = {
  addonSetupMs: number;
  builderBuildMs: number;
  getInternalIdMs: number;
  installExtensionMs: number;
  totalMs: number;
};

type ScenarioName = 'cold' | 'warmUnchanged' | 'warmManifestUpdate';

type PhaseSummary = {
  mean: number;
  median: number;
  p95: number;
};

type ScenarioResult = {
  samples: PhaseSample[];
  summary: Record<keyof PhaseSample, PhaseSummary>;
};

type BenchmarkResult = {
  gitRef: string;
  gitSha: string;
  iterations: number;
  scenarios: Record<ScenarioName, ScenarioResult>;
};

function parseArgs(argv: string[]): Args {
  let iterations = 3;
  let out: string | undefined;
  let refLabel = 'unknown';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--iterations') {
      iterations = Number(argv[index + 1]);
      index += 1;
    } else if (arg === '--out') {
      out = argv[index + 1];
      index += 1;
    } else if (arg === '--ref-label') {
      refLabel = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`Invalid iterations: ${iterations}`);
  }

  return { iterations, out, refLabel };
}

function removeXpiCaches() {
  for (const entry of fs.readdirSync(tmpdir())) {
    if (entry.startsWith('metamask-e2e-')) {
      fs.rmSync(join(tmpdir(), entry), { force: true, recursive: true });
    }
  }
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], percentileValue: number) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[index];
}

function summarizePhase(values: number[]): PhaseSummary {
  return {
    mean: mean(values),
    median: percentile(values, 50),
    p95: percentile(values, 95),
  };
}

function summarize(samples: PhaseSample[]) {
  return {
    addonSetupMs: summarizePhase(
      samples.map(({ addonSetupMs }) => addonSetupMs),
    ),
    builderBuildMs: summarizePhase(
      samples.map(({ builderBuildMs }) => builderBuildMs),
    ),
    getInternalIdMs: summarizePhase(
      samples.map(({ getInternalIdMs }) => getInternalIdMs),
    ),
    installExtensionMs: summarizePhase(
      samples.map(({ installExtensionMs }) => installExtensionMs),
    ),
    totalMs: summarizePhase(samples.map(({ totalMs }) => totalMs)),
  };
}

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

async function main() {
  const { iterations, out, refLabel } = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const requireFromTarget = createRequire(path.join(root, 'package.json'));

  process.env.SELENIUM_BROWSER = 'firefox';
  process.env.HEADLESS = 'false';

  const { Builder } = requireFromTarget(
    'selenium-webdriver',
  ) as typeof import('selenium-webdriver');
  const FirefoxDriver = requireFromTarget('./test/e2e/webdriver/firefox') as {
    prototype: {
      getInternalId(...args: unknown[]): Promise<string>;
      installExtension(...args: unknown[]): Promise<string>;
    };
  };
  const { buildWebDriver } = requireFromTarget('./test/e2e/webdriver') as {
    buildWebDriver(options?: Record<string, unknown>): Promise<{
      driver: { quit(): Promise<void> };
    }>;
  };
  const { setManifestFlags } = (await import(
    pathToFileURL(join(root, 'test/e2e/set-manifest-flags.ts')).href
  )) as {
    setManifestFlags(flags?: Record<string, unknown>): Promise<void>;
  };

  let currentSample: Omit<PhaseSample, 'addonSetupMs' | 'totalMs'> | null =
    null;

  const originalBuilderBuild = Builder.prototype.build;
  const originalInstallExtension = FirefoxDriver.prototype.installExtension;
  const originalGetInternalId = FirefoxDriver.prototype.getInternalId;

  Builder.prototype.build = function patchedBuild(...args: unknown[]) {
    const start = performance.now();
    try {
      return originalBuilderBuild.apply(this, args);
    } finally {
      if (currentSample) {
        currentSample.builderBuildMs += performance.now() - start;
      }
    }
  };

  FirefoxDriver.prototype.installExtension =
    async function patchedInstallExtension(...args: unknown[]) {
      const start = performance.now();
      try {
        return await originalInstallExtension.apply(this, args);
      } finally {
        if (currentSample) {
          currentSample.installExtensionMs += performance.now() - start;
        }
      }
    };

  FirefoxDriver.prototype.getInternalId = async function patchedGetInternalId(
    ...args: unknown[]
  ) {
    const start = performance.now();
    try {
      return await originalGetInternalId.apply(this, args);
    } finally {
      if (currentSample) {
        currentSample.getInternalIdMs += performance.now() - start;
      }
    }
  };

  async function measureBuildWebDriver(): Promise<PhaseSample> {
    currentSample = {
      builderBuildMs: 0,
      getInternalIdMs: 0,
      installExtensionMs: 0,
    };
    const start = performance.now();
    const { driver } = await buildWebDriver();
    const totalMs = performance.now() - start;
    await driver.quit();
    const sample = {
      ...currentSample,
      addonSetupMs: Math.max(
        0,
        totalMs -
          currentSample.builderBuildMs -
          currentSample.installExtensionMs -
          currentSample.getInternalIdMs,
      ),
      totalMs,
    };
    currentSample = null;
    return sample;
  }

  async function primeAndMeasure(
    initialFlags: Record<string, unknown>,
    measuredFlags: Record<string, unknown>,
  ) {
    removeXpiCaches();
    await setManifestFlags(initialFlags);
    await measureBuildWebDriver();
    await setManifestFlags(measuredFlags);
    return await measureBuildWebDriver();
  }

  const scenarios: Record<ScenarioName, PhaseSample[]> = {
    cold: [],
    warmManifestUpdate: [],
    warmUnchanged: [],
  };

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const seed = `${refLabel}-${iteration}`;

    removeXpiCaches();
    await setManifestFlags({ xpiBenchmarkVariant: `cold-${seed}` });
    scenarios.cold.push(await measureBuildWebDriver());

    scenarios.warmUnchanged.push(
      await primeAndMeasure(
        { xpiBenchmarkVariant: `warm-hit-${seed}` },
        { xpiBenchmarkVariant: `warm-hit-${seed}` },
      ),
    );

    scenarios.warmManifestUpdate.push(
      await primeAndMeasure(
        { xpiBenchmarkVariant: `warm-before-${seed}` },
        { xpiBenchmarkVariant: `warm-after-${seed}` },
      ),
    );
  }

  const gitSha = requireFromTarget('node:child_process')
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root })
    .toString()
    .trim();

  const result: BenchmarkResult = {
    gitRef: refLabel,
    gitSha,
    iterations,
    scenarios: {
      cold: {
        samples: scenarios.cold,
        summary: summarize(scenarios.cold),
      },
      warmManifestUpdate: {
        samples: scenarios.warmManifestUpdate,
        summary: summarize(scenarios.warmManifestUpdate),
      },
      warmUnchanged: {
        samples: scenarios.warmUnchanged,
        summary: summarize(scenarios.warmUnchanged),
      },
    },
  };

  console.log(`Firefox buildWebDriver benchmark for ${refLabel} (${gitSha})`);
  console.log(
    'Scenario'.padEnd(22) +
      'metric'.padStart(10) +
      'builder.build'.padStart(16) +
      'addonSetup'.padStart(16) +
      'installExtension'.padStart(20) +
      'getInternalId'.padStart(16) +
      'total'.padStart(12),
  );

  for (const [name, scenario] of Object.entries(result.scenarios) as [
    ScenarioName,
    ScenarioResult,
  ][]) {
    for (const metric of ['mean', 'median', 'p95'] as const) {
      console.log(
        (metric === 'mean' ? name : '').padEnd(22) +
          metric.padStart(10) +
          formatMs(scenario.summary.builderBuildMs[metric]).padStart(16) +
          formatMs(scenario.summary.addonSetupMs[metric]).padStart(16) +
          formatMs(scenario.summary.installExtensionMs[metric]).padStart(20) +
          formatMs(scenario.summary.getInternalIdMs[metric]).padStart(16) +
          formatMs(scenario.summary.totalMs[metric]).padStart(12),
      );
    }
  }

  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
