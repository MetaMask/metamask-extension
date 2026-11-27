import type { AnyBlock } from '@slack/types';
import type { SlackPayload } from './slack.mts';

export type RunInfo = {
  sha: string;
  // Null while a run is still going.
  conclusion: string | null;
  url: string;
};

export type Health = {
  status: 'quiet' | 'ok' | 'problem';
  // Distinct main commits that should have a detector run.
  expected: number;
  // Commits with no detector run at all.
  missing: RunInfo[];
  // Commits whose detector runs all ended without success.
  failed: RunInfo[];
  // Scheduled runs due in the window that did not start.
  scheduleMissing: string[];
  // Scheduled runs that ended without success.
  scheduleFailed: ScheduledRun[];
};

export type ScheduledRun = {
  kind: ScheduledKind;
  conclusion: string | null;
  url: string;
};

export type ScheduledKind = 'throttled' | 'drift' | 'calibration';

// Keep in step with the crons in main-detector.yml: [kind, UTC weekday or null for daily, UTC hour].
const SCHEDULES: [ScheduledKind, number | null, number][] = [
  ['throttled', null, 7],
  ['drift', 1, 8],
  ['calibration', 1, 9],
];

/**
 * The scheduled runs whose start time falls in [from, to).
 *
 * @param from - Window start, milliseconds since the epoch.
 * @param to - Window end, milliseconds since the epoch.
 */
export function scheduledDue(from: number, to: number): ScheduledKind[] {
  const due: ScheduledKind[] = [];
  for (let day = from - (from % DAY_MS); day < to; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    for (const [kind, onWeekday, hour] of SCHEDULES) {
      const start = day + hour * 60 * 60 * 1000;
      if (
        (onWeekday === null || onWeekday === weekday) &&
        start >= from &&
        start < to
      ) {
        due.push(kind);
      }
    }
  }
  return due;
}

/**
 * Compares the scheduled runs due in a window with the ones that ran. A run
 * still going counts as started.
 *
 * @param due - Kinds due, from {@link scheduledDue}.
 * @param runs - Scheduled detector runs started in the window.
 */
export function assessSchedule(
  due: ScheduledKind[],
  runs: ScheduledRun[],
): Pick<Health, 'scheduleMissing' | 'scheduleFailed'> {
  const scheduleMissing: string[] = [];
  const scheduleFailed: ScheduledRun[] = [];
  for (const kind of due) {
    const ofKind = runs.filter((run) => run.kind === kind);
    if (ofKind.length === 0) {
      scheduleMissing.push(kind);
    } else if (
      ofKind.every(
        (run) => run.conclusion !== null && run.conclusion !== 'success',
      )
    ) {
      scheduleFailed.push(ofKind[0]);
    }
  }
  return { scheduleMissing, scheduleFailed };
}

/**
 * Compares the Main runs that finished in a window with the detector runs for
 * the same commits. No Main runs (weekends, holidays) is quiet, not a problem.
 *
 * @param mainRuns - Completed Main push runs on main in the window.
 * @param detectorRuns - Detector runs started for those commits or later.
 */
export function assessHealth(
  mainRuns: RunInfo[],
  detectorRuns: RunInfo[],
  schedule: Pick<Health, 'scheduleMissing' | 'scheduleFailed'> = {
    scheduleMissing: [],
    scheduleFailed: [],
  },
): Health {
  // A cancelled Main run never finished its builds, so the detector skips it.
  const expected = new Map<string, RunInfo>();
  for (const run of mainRuns) {
    if (run.conclusion !== 'cancelled') {
      expected.set(run.sha, run);
    }
  }

  const bySha = new Map<string, RunInfo[]>();
  for (const run of detectorRuns) {
    bySha.set(run.sha, [...(bySha.get(run.sha) ?? []), run]);
  }

  const missing: RunInfo[] = [];
  const failed: RunInfo[] = [];
  for (const [sha, mainRun] of expected) {
    const runs = bySha.get(sha);
    if (!runs) {
      missing.push(mainRun);
    } else if (
      runs.every(
        (run) => run.conclusion !== null && run.conclusion !== 'success',
      )
    ) {
      failed.push(runs[0]);
    }
  }

  const scheduleProblem =
    schedule.scheduleMissing.length > 0 || schedule.scheduleFailed.length > 0;
  let status: Health['status'] = 'ok';
  if (missing.length > 0 || failed.length > 0 || scheduleProblem) {
    status = 'problem';
  } else if (expected.size === 0) {
    status = 'quiet';
  }
  return { status, expected: expected.size, missing, failed, ...schedule };
}

// Keep in step with the cron in main-detector-heartbeat.yml.
const SLOT_HOUR_UTC = 14;
const SLOT_MINUTE_UTC = 17;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The latest scheduled heartbeat time at or before now. Anchoring the window
 * to it keeps consecutive days contiguous however late a run starts.
 *
 * @param now - Milliseconds since the epoch.
 */
export function latestSlot(now: number): number {
  const date = new Date(now);
  const slot = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    SLOT_HOUR_UTC,
    SLOT_MINUTE_UTC,
  );
  return slot <= now ? slot : slot - DAY_MS;
}

// A Slack section holds at most 3000 characters; a day of failures can exceed it.
export const MAX_LISTED = 10;

const list = (runs: RunInfo[], repository: string) => {
  const lines = runs
    .slice(0, MAX_LISTED)
    .map(
      (run) =>
        `• <https://github.com/${repository}/commit/${run.sha}|${run.sha.slice(0, 7)}> (<${run.url}|run>)`,
    );
  if (runs.length > MAX_LISTED) {
    lines.push(`• and ${runs.length - MAX_LISTED} more`);
  }
  return lines.join('\n');
};

/**
 * Slack message for a failed health check, in the style of the detector's
 * ping message.
 *
 * @param health - Result of {@link assessHealth}.
 * @param repository - `owner/name` of the repository.
 * @param runUrl - The heartbeat run that found the problem.
 */
export function buildHeartbeatMessage(
  health: Health,
  repository: string,
  runUrl: string,
): SlackPayload {
  const section = (text: string): AnyBlock => ({
    type: 'section',
    text: { type: 'mrkdwn', text },
  });
  const blocks: AnyBlock[] = [
    section(
      `:rotating_light: *Performance detector: health check failed* on \`${repository}\`\n\nMain finished ${health.expected} commit(s) in the last day. The detector is not running as it should, so a performance change could go unreported.`,
    ),
  ];
  if (health.missing.length > 0) {
    blocks.push(
      section(
        `:no_entry: *No detector run* (the workflow did not start)\n${list(health.missing, repository)}`,
      ),
    );
  }
  if (health.failed.length > 0) {
    blocks.push(
      section(
        `:x: *Detector run failed or never finished*\n${list(health.failed, repository)}`,
      ),
    );
  }
  if (health.scheduleMissing.length > 0) {
    blocks.push(
      section(
        `:no_entry: *Scheduled run did not start*\n${health.scheduleMissing.map((kind) => `• ${kind}`).join('\n')}`,
      ),
    );
  }
  if (health.scheduleFailed.length > 0) {
    blocks.push(
      section(
        `:x: *Scheduled run failed*\n${health.scheduleFailed.map((run) => `• ${run.kind} (<${run.url}|run>)`).join('\n')}`,
      ),
    );
  }
  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `<${runUrl}|View health check>` }],
  });
  return {
    text: `Performance detector health check failed: ${health.missing.length + health.scheduleMissing.length} not started, ${health.failed.length + health.scheduleFailed.length} failed`,
    blocks,
  };
}
