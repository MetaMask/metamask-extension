import {
  buildScheduledPlan,
  parseDriftReference,
  measuredArtifactName,
  parseMeasuredArtifact,
  previousMeasured,
  type MeasureResolution,
  type RunInfo,
} from './scheduled.mts';

const sha = (letter: string) => letter.repeat(40);

describe('measured artifact', () => {
  it('round-trips the commit through its name', () => {
    expect(parseMeasuredArtifact(measuredArtifactName(sha('a')))).toBe(
      sha('a'),
    );
  });

  it('ignores every other artifact', () => {
    for (const name of [
      'throttled-result',
      'throttled-b1-chrome-s1',
      'throttled-measured-',
      'throttled-measured-main',
      `throttled-measured-${'A'.repeat(40)}`,
      `detector-measured-${sha('a')}`,
    ]) {
      expect(parseMeasuredArtifact(name)).toBeUndefined();
    }
  });
});

describe('previousMeasured', () => {
  const run = (id: number, overrides: Partial<RunInfo> = {}): RunInfo => ({
    id,
    title: 'Main performance detector latest-main (throttled)',
    event: 'schedule',
    conclusion: 'success',
    ...overrides,
  });
  const artifacts: Record<number, string[]> = {
    5: ['throttled-result', measuredArtifactName(sha('e'))],
    4: [],
    3: [measuredArtifactName(sha('c'))],
    2: [measuredArtifactName(sha('b'))],
  };
  const artifactNamesOf = async (id: number) => artifacts[id] ?? [];

  it('takes the newest run that recorded a commit, skipping runs that recorded none', async () => {
    expect(
      await previousMeasured([run(4), run(3), run(2)], artifactNamesOf),
    ).toBe(sha('c'));
    expect(await previousMeasured([run(5), run(3)], artifactNamesOf)).toBe(
      sha('e'),
    );
  });

  it('does not count a failed run, a dispatch, a throttled A/A run or a commit check', async () => {
    const runs = [
      run(5, { conclusion: 'failure' }),
      run(5, { event: 'workflow_dispatch' }),
      run(5, { title: 'Main performance detector latest-main (throttled aa)' }),
      run(5, { title: `Main performance detector ${sha('f')}` }),
      run(3),
    ];
    expect(await previousMeasured(runs, artifactNamesOf)).toBe(sha('c'));
  });

  it('has no previous commit on the first run, or when only a failed run exists', async () => {
    expect(await previousMeasured([], artifactNamesOf)).toBeUndefined();
    expect(
      await previousMeasured(
        [run(5, { conclusion: 'failure' })],
        artifactNamesOf,
      ),
    ).toBeUndefined();
  });

  it('stops after the limit', async () => {
    expect(
      await previousMeasured([run(4), run(4), run(3)], artifactNamesOf, 2),
    ).toBeUndefined();
  });
});

describe('buildScheduledPlan', () => {
  const build = (letter: string) => ({
    sha: sha(letter),
    run: `run-${letter}`,
    version: `1.${letter}`,
  });
  const resolved: MeasureResolution = {
    status: 'measure',
    head: build('c'),
    base: build('a'),
    range: [sha('c'), sha('b')],
    subjects: { [sha('c')]: 'feat: x (#1)', [sha('b')]: 'fix: y (#2)' },
  };

  it('compares the head with the base over the range', () => {
    expect(
      buildScheduledPlan(resolved, { rate: 2, kind: 'daily' }),
    ).toStrictEqual({
      headSha: sha('c'),
      headSubject: 'feat: x (#1)',
      baseSha: sha('a'),
      canary: false,
      rangeSize: 2,
      headRun: 'run-c',
      headVersion: '1.c',
      baseRun: 'run-a',
      baseVersion: '1.a',
      cpuThrottleRate: 2,
      kind: 'daily',
    });
  });

  it('compares the head with itself for an A/A canary', () => {
    expect(
      buildScheduledPlan(resolved, {
        rate: 2,
        kind: 'daily',
        canary: true,
      }),
    ).toMatchObject({
      baseSha: sha('c'),
      baseRun: 'run-c',
      canary: true,
      rangeSize: 1,
    });
  });

  it('measures the power-user preset for the power-user run', () => {
    expect(
      buildScheduledPlan(resolved, { rate: 2, kind: 'power-user' }),
    ).toMatchObject({ kind: 'power-user', preset: 'startupPowerUserHome' });
    expect(
      buildScheduledPlan(resolved, { rate: 2, kind: 'drift' }),
    ).not.toHaveProperty('preset');
  });
});

describe('parseDriftReference', () => {
  it('reads the pinned commit', () => {
    expect(parseDriftReference(JSON.stringify({ commit: sha('d') }))).toBe(
      sha('d'),
    );
  });

  it('rejects anything but a full commit sha', () => {
    for (const text of ['{}', '{"commit":"main"}', '{"commit":"abc123"}']) {
      expect(() => parseDriftReference(text)).toThrow('40 hex digits');
    }
  });
});
