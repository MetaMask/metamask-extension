import {
  planConfig,
  planLabel,
  planPrefix,
  renderSummary,
  type PlanInfo,
} from './report.mts';
import {
  DEFAULT_CONFIG,
  decide,
  scoreBatch,
  throttledConfig,
  type BatchScores,
  type JobResult,
} from './score.mts';

// Ten sessions of one page load each: the base takes `baseMs`, the head `baseMs + shiftMs`.
function makeJob(baseMs: number, shiftMs: number): JobResult {
  const sessions = Array.from({ length: 10 }, (_, index) => ({
    index,
    build: index % 2 === 0 ? ('A' as const) : ('B' as const),
    success: true,
    pageLoads: 1,
  }));
  const values = sessions.map((session) =>
    session.build === 'B' ? baseMs + shiftMs : baseMs,
  );
  return { sessions, samples: { uiStartup: values, load: values } };
}

const scores = (baseMs: number, shiftMs: number): BatchScores => {
  const jobs = [-1, 0.5, 0, -0.5, 1].map((spread) =>
    makeJob(baseMs, shiftMs + spread),
  );
  return {
    chrome: scoreBatch('chrome', jobs, DEFAULT_CONFIG),
    firefox: scoreBatch(
      'firefox',
      jobs.map(() => makeJob(baseMs, 0)),
      DEFAULT_CONFIG,
    ),
  };
};

const plan: PlanInfo = {
  headSha: 'a'.repeat(40),
  headSubject: 'feat: x (#42)',
  baseSha: 'b'.repeat(40),
  canary: false,
  rangeSize: 12,
};
const throttled: PlanInfo = { ...plan, cpuThrottleRate: 2 };

describe('plan helpers', () => {
  it('leave a commit check as it was', () => {
    expect(planLabel(plan)).toBeUndefined();
    expect(planConfig(plan)).toBe(DEFAULT_CONFIG);
    expect(planPrefix(plan)).toBe('detector');
  });

  it('name the range, the config and the artifacts of a throttled run', () => {
    expect(planLabel(throttled)).toBe('throttled, bbbbbbb..aaaaaaa');
    expect(planConfig(throttled)).toStrictEqual(throttledConfig());
    expect(planPrefix(throttled)).toBe('throttled');
  });

  // origin: ai-synthesis
  it('tell the daily, power-user and drift runs apart', () => {
    const powerUser: PlanInfo = {
      ...throttled,
      kind: 'power-user',
      preset: 'startupPowerUserHome',
    };
    const drift: PlanInfo = { ...throttled, kind: 'drift' };

    expect(planLabel(powerUser)).toBe('throttled power-user, bbbbbbb..aaaaaaa');
    expect(planLabel(drift)).toBe('drift, bbbbbbb..aaaaaaa');
    expect(new Set([throttled, powerUser, drift].map(planPrefix)).size).toBe(3);
    expect(planConfig(powerUser)).toStrictEqual(
      throttledConfig('startupPowerUserHome'),
    );
    expect(planConfig(drift)).toStrictEqual(throttledConfig());
  });
});

describe('renderSummary', () => {
  it('prints the measured shift in ms with the percent beside it', () => {
    // 54 ms on a base of 2146 ms, twice the old Chrome uiStartup median.
    const first = scores(2146, 54);
    const second = scores(2146, 54);
    const decision = decide(first, second, DEFAULT_CONFIG);
    const text = renderSummary({
      plan: {
        headSha: 'a'.repeat(40),
        headSubject: 'feat: x (#42)',
        baseSha: 'b'.repeat(40),
        canary: false,
        rangeSize: 1,
      },
      first,
      second,
      decision,
      config: DEFAULT_CONFIG,
    });

    expect(decision.ping).toBe('loud');
    expect(text).toContain('Head minus base [95% bounds] (percent)');
    expect(text).toMatch(
      /\| chrome \| uiStartup \| loud slower \| \+54\.0 ms \[\+5\d\.\d, \+5\d\.\d\] n=5 \(\+2\.52% \[/u,
    );
  });

  // origin: ai-synthesis
  it('titles a throttled run by its range and lists only Chrome', () => {
    const config = throttledConfig();
    const first = {
      chrome: scoreBatch('chrome', [], config),
    } as BatchScores;
    const decision = { ping: 'none' as const, findings: [], unmeasured: [] };
    const summary = renderSummary({
      plan: throttled,
      first,
      decision,
      config,
    });

    expect(summary).toContain(
      '## Main performance detector (throttled, bbbbbbb..aaaaaaa)',
    );
    expect(summary).toContain("Chrome's CPU was slowed 2 times");
    expect(summary).toContain('a range of 12 commits');
    expect(summary).toContain('13.5 ms chrome load');
    expect(summary).not.toContain('firefox');
  });
});
