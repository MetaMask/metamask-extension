/**
 * Reads the per-job benchmark artifacts that main-detector-measure.yml uploads
 * as <prefix>-b<batch>-<browser>-s<shard> folders, `detector` for the commit
 * checks and `throttled` for the daily throttled run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONFIG, scoreBatch } from './score.mts';
import type { BatchScores, DetectorConfig, JobResult } from './score.mts';

function parseJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

type FlowEntry = {
  abPilot?: { sessions: JobResult['sessions'] };
  samples?: JobResult['samples'];
};

// origin: ai-reviewed
/**
 * @param directory - One job's artifact folder.
 * @returns Each flow's sessions and samples, by the flow's result key, for
 * every flow with A/B data; empty when the folder or the file is missing or
 * unreadable.
 */
export function readJobFlows(directory: string): Record<string, JobResult> {
  if (!fs.existsSync(directory)) {
    return {};
  }
  const file = fs
    .readdirSync(directory)
    .find((name) => /^benchmark-.*\.json$/u.test(name));
  if (!file) {
    return {};
  }
  const parsed = parseJson(path.join(directory, file));
  const flows: Record<string, JobResult> = {};
  for (const [flow, value] of Object.entries(
    (parsed ?? {}) as Record<string, FlowEntry | undefined>,
  )) {
    if (value?.abPilot && value.samples) {
      flows[flow] = {
        sessions: value.abPilot.sessions,
        samples: value.samples,
      };
    }
  }
  return flows;
}

/**
 * @param directory - One job's artifact folder.
 * @returns The job's sessions and samples, or an empty job when the folder,
 * the file or its A/B data is missing or unreadable. A startup job has one flow.
 */
export function readJob(directory: string): JobResult {
  return (
    Object.values(readJobFlows(directory))[0] ?? { sessions: [], samples: {} }
  );
}

/**
 * @param root - Folder holding the downloaded artifacts.
 * @param batch - 1 for the first batch, 2 for the confirmation batch.
 * @param shards - Number of jobs per browser the batch should have.
 * @param optional - When true, a batch with no artifact folders was not run.
 * @param options - The config to score with, whose browsers are the ones
 * scored, and the artifact name prefix.
 */
export function loadBatch(
  root: string,
  batch: number,
  shards: number,
  optional = false,
  options: { config?: DetectorConfig; prefix?: string } = {},
): BatchScores | undefined {
  const { config = DEFAULT_CONFIG, prefix = 'detector' } = options;
  const folders = fs.existsSync(root) ? fs.readdirSync(root) : [];
  // A missing optional batch was not run; a missing required one scores as unusable jobs.
  if (
    optional &&
    !folders.some((name) => name.startsWith(`${prefix}-b${batch}-`))
  ) {
    return undefined;
  }
  const scores = {} as BatchScores;
  for (const browser of config.browsers) {
    const jobs = Array.from({ length: shards }, (_, shard) =>
      readJob(path.join(root, `${prefix}-b${batch}-${browser}-s${shard + 1}`)),
    );
    scores[browser] = scoreBatch(browser, jobs, config);
  }
  return scores;
}
