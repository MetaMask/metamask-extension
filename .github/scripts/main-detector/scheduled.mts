// origin: ai-synthesis
/**
 * Plans the scheduled runs of the main detector that slow Chrome's CPU: which
 * commit each measures (the head) and which it compares with (the base). The
 * daily run's base is the commit the previous successful scheduled daily run
 * measured, so each commit lands in exactly one range, and the first run uses
 * the head's parent. The weekly drift run's base is a pinned reference build.
 */
import type { PlanInfo } from './report.mts';
import type { BuildRef, ResolveResult } from './resolve.mts';

// A run records the commit it measured as the name of an empty-looking artifact,
// which the next run reads from the artifact list without downloading anything.
const MEASURED_PREFIX = 'throttled-measured-';

/**
 * @param sha - The head commit a throttled run measured.
 * @returns The name of the artifact that records it.
 */
export const measuredArtifactName = (sha: string): string =>
  `${MEASURED_PREFIX}${sha}`;

/**
 * @param name - An artifact name.
 * @returns The commit it records, or `undefined` for any other artifact.
 */
export function parseMeasuredArtifact(name: string): string | undefined {
  const sha = name.startsWith(MEASURED_PREFIX)
    ? name.slice(MEASURED_PREFIX.length)
    : '';
  return /^[0-9a-f]{40}$/u.test(sha) ? sha : undefined;
}

export type RunInfo = {
  id: number;
  title: string;
  event: string;
  conclusion: string | null;
};

// The run title ends in "(throttled)" for the daily run and for a manual one.
// Only the schedule counts, since a dispatch may use another rate or head.
const isScheduledThrottledRun = (run: RunInfo) =>
  run.event === 'schedule' &&
  run.conclusion === 'success' &&
  run.title.endsWith('(throttled)');

/**
 * @param runs - Runs of the detector workflow, newest first.
 * @param artifactNamesOf - Lists a run's artifact names.
 * @param limit - How many scheduled throttled runs to look through.
 * @returns The commit the newest successful scheduled throttled run measured.
 * A run that found nothing new, or whose artifacts expired, records none and
 * is passed over.
 */
export async function previousMeasured(
  runs: RunInfo[],
  artifactNamesOf: (runId: number) => Promise<string[]>,
  limit = 10,
): Promise<string | undefined> {
  for (const run of runs.filter(isScheduledThrottledRun).slice(0, limit)) {
    for (const name of await artifactNamesOf(run.id)) {
      const sha = parseMeasuredArtifact(name);
      if (sha) {
        return sha;
      }
    }
  }
  return undefined;
}

/**
 * @param text - The content of `drift-reference.json`.
 * @returns The pinned commit the weekly drift run compares the newest main with.
 */
export function parseDriftReference(text: string): string {
  const { commit } = JSON.parse(text) as { commit?: unknown };
  if (typeof commit !== 'string' || !/^[0-9a-f]{40}$/u.test(commit)) {
    throw new Error('drift-reference.json needs a "commit" of 40 hex digits');
  }
  return commit;
}

// What the plan job of main-detector.yml hands to the jobs after it.
export type ScheduledPlan = PlanInfo & {
  headRun: string;
  headVersion: string;
  baseRun: string;
  baseVersion: string;
  cpuThrottleRate: number;
  kind: 'daily' | 'power-user' | 'drift';
};

export type PlanOptions = {
  // How many times slower Chrome runs.
  rate: number;
  kind: ScheduledPlan['kind'];
  // Compare the head with itself, to measure the false positive rate (FPR).
  canary?: boolean;
};

export type MeasureResolution = Extract<
  ResolveResult,
  { status: 'measure' }
> & {
  subjects: Record<string, string>;
};

/**
 * @param resolved - The resolved head and base, with the subject of each commit.
 * @param options - The rate, which run this is and whether it is a canary.
 */
export function buildScheduledPlan(
  resolved: MeasureResolution,
  options: PlanOptions,
): ScheduledPlan {
  const { head, subjects } = resolved;
  const canary = options.canary ?? false;
  const base: BuildRef = canary ? head : resolved.base;
  return {
    headSha: head.sha,
    headSubject: subjects[head.sha],
    baseSha: base.sha,
    canary,
    rangeSize: canary ? 1 : resolved.range.length,
    headRun: head.run,
    headVersion: head.version,
    baseRun: base.run,
    baseVersion: base.version,
    cpuThrottleRate: options.rate,
    kind: options.kind,
    ...(options.kind === 'power-user' && { preset: 'startupPowerUserHome' }),
  };
}
