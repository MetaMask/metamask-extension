/**
 * Reads the per-job benchmark artifacts that main-detector-measure.yml uploads
 * as detector-b<batch>-<browser>-s<shard> folders.
 */
import fs from 'node:fs';
import path from 'node:path';
import { BROWSERS, DEFAULT_CONFIG, scoreBatch } from './score.mts';
import type { BatchScores, JobResult } from './score.mts';

function parseJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

/**
 * @param directory - One job's artifact folder.
 * @returns The job's sessions and samples, or an empty job when the folder,
 * the file or its A/B data is missing or unreadable.
 */
export function readJob(directory: string): JobResult {
  const unusable: JobResult = { sessions: [], samples: {} };
  if (!fs.existsSync(directory)) {
    return unusable;
  }
  const file = fs
    .readdirSync(directory)
    .find((name) => /^benchmark-.*\.json$/u.test(name));
  if (!file) {
    return unusable;
  }
  const parsed = parseJson(path.join(directory, file));
  const entry = Object.values((parsed ?? {}) as Record<string, unknown>)[0] as
    | {
        abPilot?: { sessions: JobResult['sessions'] };
        samples?: JobResult['samples'];
      }
    | undefined;
  return entry?.abPilot && entry.samples
    ? { sessions: entry.abPilot.sessions, samples: entry.samples }
    : unusable;
}

/**
 * @param root - Folder holding the downloaded artifacts.
 * @param batch - 1 for the first batch, 2 for the confirmation batch.
 * @param shards - Number of jobs per browser the batch should have.
 * @param optional - When true, a batch with no artifact folders was not run.
 */
export function loadBatch(
  root: string,
  batch: number,
  shards: number,
  optional = false,
): BatchScores | undefined {
  const folders = fs.existsSync(root) ? fs.readdirSync(root) : [];
  // A missing optional batch was not run; a missing required one scores as unusable jobs.
  if (
    optional &&
    !folders.some((name) => name.startsWith(`detector-b${batch}-`))
  ) {
    return undefined;
  }
  const scores = {} as BatchScores;
  for (const browser of BROWSERS) {
    const jobs = Array.from({ length: shards }, (_, shard) =>
      readJob(path.join(root, `detector-b${batch}-${browser}-s${shard + 1}`)),
    );
    scores[browser] = scoreBatch(browser, jobs, DEFAULT_CONFIG);
  }
  return scores;
}
