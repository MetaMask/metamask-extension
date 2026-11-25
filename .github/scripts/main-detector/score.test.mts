import {
  DEFAULT_CONFIG,
  classify,
  decide,
  jobShifts,
  needsConfirmation,
  scoreBatch,
  type BatchScores,
  type JobResult,
} from './score.mts';
import { summarizeShifts, tCritical95 } from './stats.mts';

// Ten sessions, alternating A and B, two page loads each. The first two sessions
// are warm-up and slower. `headFactor` scales the head (B) values.
function makeJob(headFactor: number, jitter = 0, success = true): JobResult {
  const sessions = Array.from({ length: 10 }, (_, index) => ({
    index,
    build: index % 2 === 0 ? ('A' as const) : ('B' as const),
    success,
    pageLoads: 2,
  }));
  const values = sessions.flatMap((session) => {
    const level = (session.index < 2 ? 1500 : 1000) + jitter;
    const value = session.build === 'B' ? level * headFactor : level;
    return [value, value];
  });
  return { sessions, samples: { uiStartup: values, load: values } };
}

// A job whose base builds take `baseMs` and whose head builds take `baseMs + shiftMs`,
// on both verdict metrics. The first two sessions are warm-up and slower.
function makeShiftedJob(baseMs: number, shiftMs: number): JobResult {
  const sessions = Array.from({ length: 10 }, (_, index) => ({
    index,
    build: index % 2 === 0 ? ('A' as const) : ('B' as const),
    success: true,
    pageLoads: 1,
  }));
  const values = sessions.map((session) => {
    const level = session.index < 2 ? baseMs * 1.5 : baseMs;
    return session.build === 'B' ? level + shiftMs : level;
  });
  return { sessions, samples: { uiStartup: values, load: values } };
}

// Five jobs of one batch, each shifted by `shiftMs` give or take 1 ms.
const makeShiftedJobs = (baseMs: number, shiftMs: number): JobResult[] =>
  [-1, 0.5, 0, -0.5, 1].map((spread) =>
    makeShiftedJob(baseMs, shiftMs + spread),
  );

// A job that follows an A/B sequence such as the harness runs, with the head (B)
// slower by headFactor. The first two sessions are warm-up and slower.
function makeSequencedJob(sequence: string, headFactor: number): JobResult {
  const sessions = [...sequence].map((letter, index) => ({
    index,
    build: letter as 'A' | 'B',
    success: true,
    pageLoads: 1,
  }));
  const values = sessions.map((session) => {
    const level = session.index < 2 ? 1500 : 1000;
    return session.build === 'B' ? level * headFactor : level;
  });
  return { sessions, samples: { uiStartup: values, load: values } };
}

function makeJobs(factors: number[]): JobResult[] {
  return factors.map((factor) => makeJob(factor));
}

const scores = (chrome: JobResult[], firefox = makeJobs([1, 1, 1, 1, 1])) =>
  ({
    chrome: scoreBatch('chrome', chrome, DEFAULT_CONFIG),
    firefox: scoreBatch('firefox', firefox, DEFAULT_CONFIG),
  }) as BatchScores;

describe('stats', () => {
  it('uses the one-sided 95% t value and falls back to the normal one', () => {
    expect(tCritical95(4)).toBe(2.132);
    expect(tCritical95(500)).toBe(1.645);
  });

  it('returns nothing for fewer than two jobs', () => {
    expect(summarizeShifts([{ logRatio: 0.01, ms: 10 }])).toBeUndefined();
  });

  it('summarizes equal shifts without spread', () => {
    const shift = { logRatio: Math.log(1.02), ms: 20 };
    const summary = summarizeShifts([shift, shift]);
    expect(summary?.shiftPct).toBeCloseTo(2, 5);
    expect(summary?.lowerPct).toBeCloseTo(2, 5);
    expect(summary?.sdPct).toBeCloseTo(0, 5);
    expect(summary?.shiftMs).toBeCloseTo(20, 5);
    expect(summary?.lowerMs).toBeCloseTo(20, 5);
    expect(summary?.sdMs).toBeCloseTo(0, 5);
  });

  it('bounds the ms shift with the same t value as the percent shift', () => {
    const summary = summarizeShifts(
      [10, 20, 30].map((ms) => ({ logRatio: ms / 1000, ms })),
    );
    // Mean 20, sd 10, t(2) = 2.92: margin = 2.92 * 10 / sqrt(3).
    expect(summary?.shiftMs).toBeCloseTo(20, 10);
    expect(summary?.lowerMs).toBeCloseTo(20 - (2.92 * 10) / Math.sqrt(3), 10);
    expect(summary?.upperMs).toBeCloseTo(20 + (2.92 * 10) / Math.sqrt(3), 10);
  });
});

describe('jobShifts', () => {
  it('drops warm-up sessions and compares head with base', () => {
    const shifts = jobShifts(makeJob(1.03), ['uiStartup'], 2);
    expect(shifts?.uiStartup.logRatio).toBeCloseTo(Math.log(1.03), 10);
    expect(shifts?.uiStartup.ms).toBeCloseTo(30, 10);
  });

  it('rejects a job with a failed session', () => {
    expect(jobShifts(makeJob(1, 0, false), ['uiStartup'], 2)).toBeUndefined();
  });

  it('rejects a job with too few sessions', () => {
    const job = makeJob(1);
    job.sessions = job.sessions.slice(0, 6);
    expect(jobShifts(job, ['uiStartup'], 2)).toBeUndefined();
  });

  it('ignores a missing sample instead of counting it as zero', () => {
    const job = makeJob(1.03);
    (job.samples.uiStartup as (number | null)[])[6] = null;
    const shifts = jobShifts(job, ['uiStartup'], 2);
    expect(shifts?.uiStartup.logRatio).toBeCloseTo(Math.log(1.03), 10);
  });

  it('scores a flipped job, where the head runs first, like a normal one', () => {
    const sequence = 'ABBABAABAB';
    const flipped = [...sequence]
      .map((letter) => (letter === 'A' ? 'B' : 'A'))
      .join('');
    for (const order of [sequence, flipped]) {
      const shifts = jobShifts(makeSequencedJob(order, 1.03), ['uiStartup'], 2);
      expect(shifts?.uiStartup.logRatio).toBeCloseTo(Math.log(1.03), 10);
      expect(shifts?.uiStartup.ms).toBeCloseTo(30, 10);
    }
  });

  it('attributes each session to its recorded build, not to its position', () => {
    // Every even index is the head here, the opposite of makeJob.
    const job = makeSequencedJob('BABABABABA', 1.03);
    expect(jobShifts(job, ['uiStartup'], 2)?.uiStartup.logRatio).toBeCloseTo(
      Math.log(1.03),
      10,
    );
  });

  it('skips metrics a build does not record', () => {
    expect(jobShifts(makeJob(1), ['firstReactRender'], 2)).toStrictEqual({});
  });
});

describe('classify', () => {
  // Bounds in ms; the percent fields do not take part in the verdict.
  const summary = (shiftMs: number, lowerMs: number, upperMs: number) => ({
    jobs: 5,
    shiftMs,
    lowerMs,
    upperMs,
    sdMs: 1,
    shiftPct: 0,
    lowerPct: 0,
    upperPct: 0,
    sdPct: 0,
  });

  // Chrome load: quiet from 13.53 ms, loud from 45.1 ms.
  const floor = DEFAULT_CONFIG.floors.chrome.load;

  it('is quiet at the floor with a positive lower bound', () => {
    expect(classify(summary(14, 4, 24), floor)).toStrictEqual({
      level: 'quiet',
      direction: 'slower',
    });
  });

  it('needs the lower bound above zero', () => {
    expect(classify(summary(14, -1, 29), floor).level).toBe('none');
  });

  it('needs the shift to reach the floor', () => {
    expect(classify(summary(13, 10, 16), floor).level).toBe('none');
  });

  it('is loud from the loud threshold, in either direction', () => {
    expect(classify(summary(46, 36, 56), floor).level).toBe('loud');
    expect(classify(summary(-46, -56, -36), floor)).toStrictEqual({
      level: 'loud',
      direction: 'faster',
    });
  });

  it('reports a speed-up whose upper bound stays below zero', () => {
    expect(classify(summary(-20, -30, -10), floor).direction).toBe('faster');
  });

  it('ignores the percent shift', () => {
    const huge = { ...summary(5, 1, 9), shiftPct: 50, lowerPct: 40 };
    expect(classify(huge, floor).level).toBe('none');
  });
});

describe('measured ms shift', () => {
  // The base medians of the 100 A/A runs the floors were set from.
  const series = [
    { browser: 'chrome', metric: 'load', median: 902 },
    { browser: 'chrome', metric: 'uiStartup', median: 1073 },
    { browser: 'firefox', metric: 'load', median: 1744 },
    { browser: 'firefox', metric: 'uiStartup', median: 2075 },
  ] as const;

  const verdictAt = (
    browser: 'chrome' | 'firefox',
    metric: 'load' | 'uiStartup',
    baseMs: number,
    shiftMs: number,
  ) =>
    scoreBatch(browser, makeShiftedJobs(baseMs, shiftMs), DEFAULT_CONFIG)
      .metrics[metric].verdict;

  it.each(series)(
    'decides $browser $metric at its old median as the percentage floors did',
    ({ browser, metric, median }) => {
      const { floorMs, loudMs } = DEFAULT_CONFIG.floors[browser][metric];
      expect(verdictAt(browser, metric, median, floorMs * 0.9).level).toBe(
        'none',
      );
      expect(verdictAt(browser, metric, median, floorMs * 1.05)).toStrictEqual({
        level: 'quiet',
        direction: 'slower',
      });
      expect(verdictAt(browser, metric, median, loudMs * 1.05)).toStrictEqual({
        level: 'loud',
        direction: 'slower',
      });
      expect(verdictAt(browser, metric, median, -loudMs * 1.05)).toStrictEqual({
        level: 'loud',
        direction: 'faster',
      });
    },
  );

  it('judges a real 54 ms shift as 54 ms when both builds run 2x slower than the old median', () => {
    // 54 ms is 2.7% of a 2000 ms base. Scaled by the old 1073 ms median that
    // read as 29 ms, quiet; measured, it reaches the 53.65 ms loud floor.
    const verdict = verdictAt('chrome', 'uiStartup', 2 * 1073, 54);
    expect(verdict).toStrictEqual({ level: 'loud', direction: 'slower' });
    const batch = scoreBatch(
      'chrome',
      makeShiftedJobs(2 * 1073, 54),
      DEFAULT_CONFIG,
    );
    expect(batch.metrics.uiStartup.summary?.shiftMs).toBeCloseTo(54, 10);
    expect(batch.metrics.uiStartup.summary?.shiftPct).toBeLessThan(3);
  });

  it('does not let a runner twice as fast turn a 14 ms shift into a ping', () => {
    // 14 ms is 2.8% of a 500 ms base: 30 ms on the old 1073 ms median, quiet.
    // Measured it is below the 16.095 ms floor.
    expect(verdictAt('chrome', 'uiStartup', 500, 14).level).toBe('none');
  });

  it('pings and confirms a 54 ms shift on slow runners through decide', () => {
    const slow = () => scores(makeShiftedJobs(2 * 1073, 54));
    expect(needsConfirmation(slow())).toBe(true);
    expect(decide(slow(), slow(), DEFAULT_CONFIG).ping).toBe('loud');
  });
});

describe('detector decisions', () => {
  const same = [1, 1.001, 0.999, 1, 1.002];

  it('asks for no confirmation on an unchanged build', () => {
    expect(needsConfirmation(scores(makeJobs(same)))).toBe(false);
  });

  it('asks for confirmation on a clear shift and confirms it with a second batch', () => {
    const slower = [1.03, 1.032, 1.028, 1.031, 1.029];
    const first = scores(makeJobs(slower));
    expect(needsConfirmation(first)).toBe(true);
    const decision = decide(first, scores(makeJobs(slower)), DEFAULT_CONFIG);
    expect(decision.ping).toBe('quiet');
    expect(decision.findings.map((finding) => finding.browser)).toStrictEqual([
      'chrome',
      'chrome',
    ]);
    expect(decision.findings[0].direction).toBe('slower');
  });

  it('does not ping when the second batch shows no shift', () => {
    const first = scores(makeJobs([1.03, 1.032, 1.028, 1.031, 1.029]));
    const decision = decide(first, scores(makeJobs(same)), DEFAULT_CONFIG);
    expect(decision.ping).toBe('none');
    expect(decision.unmeasured).toStrictEqual([]);
  });

  it('does not ping when the second batch moves the same way but its own bound includes zero', () => {
    const first = scores(makeJobs([1.03, 1.032, 1.028, 1.031, 1.029]));
    const noisy = scores(makeJobs([1.12, 0.98, 1.04, 1, 1]));
    expect(noisy.chrome.metrics.uiStartup.summary?.shiftPct).toBeGreaterThan(
      1.5,
    );
    expect(decide(first, noisy, DEFAULT_CONFIG).ping).toBe('none');
  });

  it('is loud when the confirmed shift reaches the loud threshold', () => {
    const big = [1.06, 1.062, 1.058, 1.061, 1.059];
    const decision = decide(
      scores(makeJobs(big)),
      scores(makeJobs(big)),
      DEFAULT_CONFIG,
    );
    expect(decision.ping).toBe('loud');
  });

  it('applies a higher floor to Firefox than to Chrome', () => {
    const shifted = makeJobs([1.017, 1.018, 1.016, 1.017, 1.019]);
    const decision = decide(
      scores(makeJobs(same), shifted),
      scores(makeJobs(same), shifted),
      DEFAULT_CONFIG,
    );
    expect(decision.ping).toBe('none');
    expect(needsConfirmation(scores(shifted))).toBe(true);
  });

  it('reports a browser with too few usable jobs as unmeasured', () => {
    const decision = decide(
      scores(makeJobs(same), [makeJob(1), makeJob(1, 0, false)]),
      undefined,
      DEFAULT_CONFIG,
    );
    expect(decision.unmeasured).toStrictEqual(['firefox']);
  });

  it('does not count jobs without the verdict metrics as usable', () => {
    const renamed = makeJobs(same).map((job) => ({ ...job, samples: {} }));
    const first = scores(makeJobs(same), renamed);
    expect(first.firefox.jobsUsable).toBe(0);
    expect(first.firefox.measurable).toBe(false);
    expect(decide(first, undefined, DEFAULT_CONFIG).unmeasured).toStrictEqual([
      'firefox',
    ]);
  });

  it('treats a job with only some verdict metrics as unusable', () => {
    const partial = makeJobs(same).map((job) => ({
      ...job,
      samples: { uiStartup: job.samples.uiStartup },
    }));
    expect(scores(partial).chrome.measurable).toBe(false);
  });

  it('reports a confirmation batch without summaries as unmeasured', () => {
    const slower = [1.03, 1.032, 1.028, 1.031, 1.029];
    const second = scores(makeJobs(slower));
    second.chrome.metrics.uiStartup.summary = undefined;
    const decision = decide(scores(makeJobs(slower)), second, DEFAULT_CONFIG);
    expect(decision.unmeasured).toStrictEqual(['chrome']);
  });

  it('reports a needed confirmation that could not be measured', () => {
    const first = scores(makeJobs([1.03, 1.032, 1.028, 1.031, 1.029]));
    const decision = decide(first, undefined, DEFAULT_CONFIG);
    expect(decision.unmeasured).toStrictEqual(['chrome']);
    expect(decision.ping).toBe('none');
  });

  it('does not confirm a result that points the other way from the first batch', () => {
    const first = scores(makeJobs([1.02, 1.021, 1.019, 1.02, 1.0205]));
    const second = scores(makeJobs([0.9, 0.901, 0.899, 0.9, 0.9005]));
    expect(needsConfirmation(first)).toBe(true);
    expect(decide(first, second, DEFAULT_CONFIG).ping).toBe('none');
  });

  it('confirms a speed-up in the same way', () => {
    const faster = [0.97, 0.968, 0.972, 0.969, 0.971];
    const decision = decide(
      scores(makeJobs(faster)),
      scores(makeJobs(faster)),
      DEFAULT_CONFIG,
    );
    expect(decision.ping).toBe('quiet');
    expect(decision.findings[0].direction).toBe('faster');
  });
});
