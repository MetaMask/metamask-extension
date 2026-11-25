import { renderSummary } from './report.mts';
import {
  DEFAULT_CONFIG,
  decide,
  scoreBatch,
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
      /\| chrome \| uiStartup \| loud slower \| \+54\.0 ms \[\+5\d\.\d, \+5\d\.\d\] n=5 \(\+2\.52% \[/,
    );
  });
});
