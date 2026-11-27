import {
  planConfig,
  planLabel,
  planPrefix,
  renderSummary,
  type PlanInfo,
} from './report.mts';
import {
  DEFAULT_CONFIG,
  scoreBatch,
  throttledConfig,
  type BatchScores,
} from './score.mts';

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
