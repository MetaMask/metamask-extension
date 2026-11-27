import type { SectionBlock } from '@slack/types';
import {
  assessHealth,
  assessSchedule,
  buildHeartbeatMessage,
  latestSlot,
  scheduledDue,
  type RunInfo,
} from './heartbeat.mts';

const run = (sha: string, conclusion: string | null = 'success'): RunInfo => ({
  sha,
  conclusion,
  url: `https://example.test/${sha}`,
});

describe('assessHealth', () => {
  it('is quiet when Main did not run', () => {
    expect(assessHealth([], []).status).toBe('quiet');
  });

  it('ignores cancelled Main runs', () => {
    expect(assessHealth([run('a', 'cancelled')], []).status).toBe('quiet');
  });

  it('is ok when every Main commit has a detector run', () => {
    const health = assessHealth(
      [run('a'), run('b', 'failure')],
      [run('a'), run('b')],
    );
    expect(health).toMatchObject({ status: 'ok', expected: 2 });
  });

  it('counts a commit once when Main ran twice for it', () => {
    expect(assessHealth([run('a'), run('a')], [run('a')]).expected).toBe(1);
  });

  it('reports commits with no detector run', () => {
    const health = assessHealth([run('a'), run('b')], [run('a')]);
    expect(health.status).toBe('problem');
    expect(health.missing.map((item) => item.sha)).toStrictEqual(['b']);
  });

  it('reports a commit whose detector runs all failed', () => {
    const health = assessHealth([run('a')], [run('a', 'failure')]);
    expect(health.status).toBe('problem');
    expect(health.failed.map((item) => item.sha)).toStrictEqual(['a']);
  });

  it('accepts a commit whose failed detector run was re-run successfully', () => {
    const health = assessHealth(
      [run('a')],
      [run('a', 'failure'), run('a', 'success')],
    );
    expect(health.status).toBe('ok');
  });

  it('does not count a running detector run as a failure', () => {
    const health = assessHealth([run('a')], [run('a', null)]);
    expect(health.status).toBe('ok');
  });

  for (const conclusion of [
    'cancelled',
    'timed_out',
    'startup_failure',
    'skipped',
  ]) {
    it(`reports a commit whose only detector run is ${conclusion}`, () => {
      const health = assessHealth([run('a')], [run('a', conclusion)]);
      expect(health.failed.map((item) => item.sha)).toStrictEqual(['a']);
    });
  }
});

describe('latestSlot', () => {
  const at = (iso: string) => Date.parse(iso);

  it('is today at 14:17 UTC once that time has passed, however late the run starts', () => {
    expect(latestSlot(at('2026-11-18T14:17:00Z'))).toBe(
      at('2026-11-18T14:17:00Z'),
    );
    expect(latestSlot(at('2026-11-18T15:00:00Z'))).toBe(
      at('2026-11-18T14:17:00Z'),
    );
  });

  it('is yesterday at 14:17 UTC before that time', () => {
    expect(latestSlot(at('2026-11-18T09:00:00Z'))).toBe(
      at('2026-11-17T14:17:00Z'),
    );
  });
});

describe('buildHeartbeatMessage', () => {
  it('lists each problem with a commit link', () => {
    const health = assessHealth(
      [run('a'.repeat(40)), run('b'.repeat(40))],
      [run('b'.repeat(40), 'failure')],
    );
    const text = JSON.stringify(
      buildHeartbeatMessage(health, 'MetaMask/metamask-extension', 'https://r'),
    );
    expect(text).toContain('health check failed');
    expect(text).toContain('No detector run');
    expect(text).toContain('Detector run failed');
    expect(text).toContain('commit/aaaaaaaa');
  });

  it('keeps every section within the Slack limit when many commits are missing', () => {
    const runs = Array.from({ length: 40 }, (_, i) =>
      run(String(i).padStart(40, '0')),
    );
    const message = buildHeartbeatMessage(
      assessHealth(runs, []),
      'MetaMask/metamask-extension',
      'https://r',
    );
    for (const block of (message.blocks ?? []) as SectionBlock[]) {
      if (block.type === 'section' && block.text) {
        expect(block.text.text.length).toBeLessThanOrEqual(3000);
      }
    }
    expect(JSON.stringify(message)).toContain('and 30 more');
  });
});

describe('scheduledDue', () => {
  // 2026-11-30 is a Monday.
  const at = (iso: string) => Date.parse(iso);

  it('expects the daily run on a weekday other than Monday', () => {
    expect(
      scheduledDue(at('2026-11-30T11:17:00Z'), at('2026-12-01T11:17:00Z')),
    ).toStrictEqual(['throttled']);
  });

  it('expects drift and calibration on Monday as well', () => {
    expect(
      scheduledDue(at('2026-11-29T11:17:00Z'), at('2026-11-30T11:17:00Z')),
    ).toStrictEqual(['throttled', 'drift', 'calibration']);
  });
});

describe('assessSchedule', () => {
  const scheduled = (
    kind: 'throttled' | 'drift' | 'calibration',
    conclusion: string | null,
  ) => ({ kind, conclusion, url: `https://example.test/${kind}` });

  it('reports a due run that did not start, and one that failed', () => {
    const result = assessSchedule(
      ['throttled', 'drift', 'calibration'],
      [scheduled('throttled', 'success'), scheduled('drift', 'failure')],
    );
    expect(result.scheduleMissing).toStrictEqual(['calibration']);
    expect(result.scheduleFailed.map((run) => run.kind)).toStrictEqual([
      'drift',
    ]);
  });

  it('counts a running scheduled run as started', () => {
    expect(
      assessSchedule(['throttled'], [scheduled('throttled', null)]),
    ).toStrictEqual({ scheduleMissing: [], scheduleFailed: [] });
  });

  it('makes a day with no Main runs a problem when a scheduled run failed', () => {
    const health = assessHealth(
      [],
      [],
      assessSchedule(['drift'], [scheduled('drift', 'failure')]),
    );
    expect(health.status).toBe('problem');
    const text = JSON.stringify(
      buildHeartbeatMessage(health, 'MetaMask/metamask-extension', 'url'),
    );
    expect(text).toContain('Scheduled run failed');
  });
});
