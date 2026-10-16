#!/usr/bin/env tsx
import { createServer, type Server } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { isHeadless } from '../../helpers/env';

const CALIBRATION_SAMPLES = 6;
const WARMUP_SAMPLES = 1;

type CalibrationSample = {
  navigationLoadMs: number;
  scriptStartMs: number;
  cpuWorkMs: number;
  longTaskTotalDurationMs: number;
  tbtMs: number;
};

type CalibrationMetric = {
  mean: number;
  median: number;
  p90: number;
};

export type RunnerCalibration = {
  sampleCount: number;
  metrics: Record<keyof CalibrationSample, CalibrationMetric>;
};

const fixture = `<!doctype html>
<meta charset="utf-8">
<script>
  (() => {
    const longTasks = [];
    new PerformanceObserver((list) => {
      longTasks.push(...list.getEntries());
    }).observe({ type: 'longtask', buffered: true });

    setTimeout(() => {
      const scriptStartMs = performance.now();
      let accumulator = 0;
      const cpuStartMs = performance.now();
      for (let index = 0; index < 8_000_000; index += 1) {
        accumulator = (accumulator + Math.imul(index, 2654435761)) | 0;
      }
      const cpuWorkMs = performance.now() - cpuStartMs;

      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const longTaskTotalDurationMs = longTasks.reduce(
          (total, task) => total + task.duration,
          0,
        );
        const tbtMs = longTasks.reduce(
          (total, task) => total + Math.max(task.duration - 50, 0),
          0,
        );
        window.__runnerCalibration = {
          navigationLoadMs: navigation.loadEventEnd,
          scriptStartMs,
          cpuWorkMs,
          longTaskTotalDurationMs,
          tbtMs,
        };
        void accumulator;
      }, 0);
    }, 0);
  })();
</script>`;

function calculateMean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    Math.max(Math.ceil(sorted.length * percentile) - 1, 0),
    sorted.length - 1,
  );
  return sorted[index];
}

export function summarizeCalibration(
  samples: CalibrationSample[],
): RunnerCalibration {
  if (samples.length === 0) {
    throw new Error('Runner calibration requires at least one sample');
  }

  const metricNames = Object.keys(samples[0]) as (keyof CalibrationSample)[];
  const metrics = Object.fromEntries(
    metricNames.map((metricName) => {
      const values = samples.map((sample) => sample[metricName]);
      return [
        metricName,
        {
          mean: calculateMean(values),
          median: calculatePercentile(values, 0.5),
          p90: calculatePercentile(values, 0.9),
        },
      ];
    }),
  ) as RunnerCalibration['metrics'];

  return { sampleCount: samples.length, metrics };
}

function startFixtureServer(): Promise<{ server: Server; url: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((_request, response) => {
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      });
      response.end(fixture);
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine runner calibration server port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .option('out', {
      type: 'string',
      demandOption: true,
      description: 'Path to write runner calibration JSON',
    })
    .parse();
  const { server, url } = await startFixtureServer();
  const chromeArguments = [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-proxy-server',
    '--no-sandbox',
  ];
  if (isHeadless('SELENIUM')) {
    chromeArguments.push('--headless=new');
  }
  const options = new chrome.Options().addArguments(chromeArguments);
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(new chrome.ServiceBuilder())
    .build();

  try {
    const samples: CalibrationSample[] = [];
    for (let index = 0; index < CALIBRATION_SAMPLES; index += 1) {
      await driver.get(`${url}/?sample=${index}`);
      const sample = await driver.executeAsyncScript(
        `const done = arguments[arguments.length - 1];
         const poll = () => window.__runnerCalibration
           ? done(window.__runnerCalibration)
           : setTimeout(poll, 10);
         poll();`,
      );
      if (index >= WARMUP_SAMPLES) {
        samples.push(sample as CalibrationSample);
      }
    }

    const calibration = summarizeCalibration(samples);
    await fs.mkdir(path.dirname(argv.out), { recursive: true });
    await fs.writeFile(argv.out, `${JSON.stringify(calibration, null, 2)}\n`);
    console.log('Runner calibration:', JSON.stringify(calibration));
  } finally {
    await driver.quit();
    await closeServer(server);
  }
}

if (process.argv[1]?.endsWith('runner-calibration.ts')) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
