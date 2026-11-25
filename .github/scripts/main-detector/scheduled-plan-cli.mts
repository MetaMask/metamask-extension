// origin: ai-synthesis
/**
 * Usage: node .github/scripts/main-detector/scheduled-plan-cli.mts --kind daily|drift --rate 2 --iterations 20 [--head SHA] [--base SHA] [--canary] [--depth 1500] [--main-ref origin/main] [--github-output FILE]
 * Plans a scheduled run that slows Chrome's CPU. The head is the newest
 * first-parent commit on main with a build. The base is --base, else the
 * pinned reference of `drift-reference.json` for `drift`, else the commit the
 * last successful scheduled `daily` run measured, else the head's nearest
 * ancestor with a build. Writes `proceed`, `kind`, `plan`, `power_user_plan`
 * (daily only), `skip_record` and `message` to --github-output.
 * Needs a checkout with first-parent history of main and the `gh` CLI.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { REPOSITORY } from './build-source.mts';
import {
  buildScheduledPlan,
  parseDriftReference,
  previousMeasured,
  type MeasureResolution,
  type RunInfo,
} from './scheduled.mts';

const run = (command: string, args: string[]) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();

const script = (name: string) => fileURLToPath(new URL(name, import.meta.url));

// The detector's own CLIs, run as the workflow runs them.
const runScript = (name: string, args: string[]) =>
  run(process.execPath, [script(name), ...args]);

function scheduledRuns(): RunInfo[] {
  const text = run('gh', [
    'api',
    `repos/${REPOSITORY}/actions/workflows/main-detector.yml/runs?event=schedule&status=success&per_page=30`,
    '--jq',
    '.workflow_runs[] | [.id, .event, .conclusion, .display_title] | @tsv',
  ]);
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [id, event, conclusion, title] = line.split('\t');
      return { id: Number(id), event, conclusion, title };
    });
}

function artifactNamesOf(runId: number): string[] {
  return run('gh', [
    'api',
    `repos/${REPOSITORY}/actions/runs/${runId}/artifacts?per_page=100`,
    '--jq',
    '.artifacts[] | select(.expired | not) | .name',
  ])
    .split('\n')
    .filter(Boolean);
}

type Resolved = { status: string } & Partial<MeasureResolution>;

function resolve(head: string, depth: string, base?: string): Resolved {
  runScript('resolve-cli.mts', [
    ...['--head', head, '--depth', depth, '--out', 'resolve.json'],
    ...(base ? ['--base', base] : []),
  ]);
  return JSON.parse(fs.readFileSync('resolve.json', 'utf8'));
}

type Outputs = Record<string, string>;

function finish(file: string | undefined, outputs: Outputs): void {
  if (file) {
    fs.appendFileSync(
      file,
      Object.entries(outputs)
        .map(([name, value]) => `${name}=${value}\n`)
        .join(''),
    );
  }
  console.log(outputs.message ?? outputs.proceed);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      kind: { type: 'string' },
      rate: { type: 'string' },
      iterations: { type: 'string' },
      head: { type: 'string' },
      base: { type: 'string' },
      canary: { type: 'boolean', default: false },
      depth: { type: 'string', default: '1500' },
      'main-ref': { type: 'string', default: 'origin/main' },
      'github-output': { type: 'string' },
    },
  });
  const { kind, canary } = values;
  const rate = Number(values.rate);
  const iterations = Number(values.iterations);
  if (kind !== 'daily' && kind !== 'drift') {
    throw new Error('--kind must be daily or drift');
  }
  if (!Number.isFinite(rate) || rate < 1) {
    throw new Error('--rate must be a number of at least 1');
  }
  // The A/B sequence is ten long, so a multiple of ten keeps both builds equally often.
  if (
    !Number.isInteger(iterations) ||
    iterations < 10 ||
    iterations % 10 !== 0
  ) {
    throw new Error('--iterations must be a multiple of 10');
  }
  const output = values['github-output'];
  const common = { kind, iterations: String(iterations), rate: String(rate) };

  let base = values.base || undefined;
  let fromPreviousRun = false;
  if (!base && !canary) {
    if (kind === 'drift') {
      base = parseDriftReference(
        fs.readFileSync(script('drift-reference.json'), 'utf8'),
      );
    } else {
      base = await previousMeasured(scheduledRuns(), async (id) =>
        artifactNamesOf(id),
      );
      fromPreviousRun = base !== undefined;
    }
  }

  const candidates = values.head
    ? [values.head]
    : run('git', [
        'log',
        '--first-parent',
        '--format=%H',
        '-n10',
        values['main-ref'] as string,
      ]).split('\n');
  const notes: string[] = [];
  let resolved: Resolved | undefined;
  for (const candidate of candidates) {
    let result = resolve(candidate, values.depth as string, base);
    if (result.status === 'no-base' && fromPreviousRun) {
      // Only the daily run may fall back: a drift run against another base would say nothing about the reference.
      notes.push(
        `The commit the last throttled run measured (${base?.slice(0, 10)}) is out of reach or has no build, so the base is the nearest earlier build.`,
      );
      result = resolve(candidate, values.depth as string);
    }
    if (result.status !== 'no-build') {
      resolved = result;
      break;
    }
  }
  if (!resolved) {
    throw new Error(
      `None of the last ${candidates.length} commits on main has a build`,
    );
  }
  if (resolved.status === 'unchanged') {
    finish(output, {
      ...common,
      proceed: 'false',
      message: `Nothing new: the newest commit with a build, ${resolved.head?.sha.slice(0, 10)}, is the one the last run measured.`,
    });
    return;
  }
  if (resolved.status !== 'measure' || !resolved.head) {
    throw new Error(
      `Could not resolve a base for the head (${resolved.status})`,
    );
  }

  const headSha = resolved.head.sha;
  if (!canary) {
    runScript('compare-builds-cli.mts', [
      ...['--resolve', 'resolve.json', '--out', 'compare.json'],
    ]);
    if (JSON.parse(fs.readFileSync('compare.json', 'utf8')).identical) {
      finish(output, {
        ...common,
        proceed: 'false',
        // A daily run that skips still covers its head, so the next range starts there.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        skip_record: kind === 'daily' ? headSha : '',
        message: `Head ${headSha.slice(0, 10)} builds the same as base ${resolved.base?.sha.slice(0, 10)}: no change, no jobs run.`,
      });
      return;
    }
  }

  const plan = buildScheduledPlan(resolved as MeasureResolution, {
    rate,
    kind,
    canary,
  });
  const powerUser =
    kind === 'daily'
      ? JSON.stringify(
          buildScheduledPlan(resolved as MeasureResolution, {
            rate,
            kind: 'power-user',
            canary,
          }),
        )
      : '';
  finish(output, {
    ...common,
    proceed: 'true',
    plan: JSON.stringify(plan),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    power_user_plan: powerUser,
    message: [
      `Head ${headSha.slice(0, 10)} against base ${plan.baseSha.slice(0, 10)}, ${plan.rangeSize} commit${plan.rangeSize === 1 ? '' : 's'}.`,
      ...notes,
    ].join(' '),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
