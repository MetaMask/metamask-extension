import {
  DEFAULT_CONFIG,
  classify,
  decide,
  jobShifts,
  needsConfirmation,
  scoreBatch,
  throttledConfig,
  type BatchScores,
  type JobResult,
} from './score.mts';
import { summarizeJobShifts, summarizeShifts, tCritical95 } from './stats.mts';

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
    expect(summarizeShifts([0.01])).toBeUndefined();
  });

  it('summarizes equal shifts without spread', () => {
    const summary = summarizeShifts([Math.log(1.02), Math.log(1.02)]);
    expect(summary?.shiftPct).toBeCloseTo(2, 5);
    expect(summary?.lowerPct).toBeCloseTo(2, 5);
    expect(summary?.sdPct).toBeCloseTo(0, 5);
  });

  it('summarizes the shifts in ms beside the percent ones', () => {
    const shifts = [10, 12, 14].map((ms) => ({
      logRatio: Math.log(1 + ms / 1000),
      ms,
    }));
    const summary = summarizeJobShifts(shifts);
    expect(summary?.shiftMs).toBeCloseTo(12, 10);
    expect(summary?.lowerMs).toBeCloseTo(12 - (2.92 * 2) / Math.sqrt(3), 10);
    expect(summary?.upperMs).toBeCloseTo(12 + (2.92 * 2) / Math.sqrt(3), 10);
    expect(summary?.shiftPct).toBeCloseTo(1.2, 1);
  });

  it('returns no ms summary for fewer than two jobs', () => {
    expect(summarizeJobShifts([{ logRatio: 0.01, ms: 10 }])).toBeUndefined();
  });
});

describe('jobShifts', () => {
  it('drops warm-up sessions and compares head with base', () => {
    const shifts = jobShifts(makeJob(1.03), ['uiStartup'], 2);
    expect(shifts?.uiStartup.logRatio).toBeCloseTo(Math.log(1.03), 10);
  });

  it('measures the shift in ms as head mean less base mean', () => {
    // Base sessions run at 1000 ms after warm-up, head at 1030 ms.
    const shifts = jobShifts(makeJob(1.03), ['uiStartup'], 2);
    expect(shifts?.uiStartup.ms).toBeCloseTo(30, 8);
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
  // The percent fields are left at an unrelated value: the verdict is in ms.
  const summary = (shiftMs: number, lowerMs: number, upperMs: number) => ({
    jobs: 5,
    shiftPct: 0,
    lowerPct: 0,
    upperPct: 0,
    sdPct: 1,
    shiftMs,
    lowerMs,
    upperMs,
  });

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
    expect(classify(summary(13, 8, 18), floor).level).toBe('none');
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

  it('keeps a short series from pinging on a within-noise change', () => {
    // A series of about 30 ms with 3 ms of noise in a batch mean: a 4 ms
    // wobble is 13%, yet below an 8 ms floor, while 1.5% of 30 ms is 0.45 ms.
    const shortSeries = { floorMs: 8, loudMs: 15 };
    expect(classify(summary(4, 1, 7), shortSeries).level).toBe('none');
    expect(classify(summary(9, 5, 13), shortSeries).level).toBe('quiet');
    expect(classify(summary(16, 12, 20), shortSeries).level).toBe('loud');
  });

  it('decides on ms, not on percent', () => {
    // 20% of a short series is 4 ms, and 1% of a long one is 12 ms.
    const shortSeries = { floorMs: 8, loudMs: 15 };
    const percentHigh = { ...summary(4, 1, 7), shiftPct: 20 };
    const percentLow = { ...summary(12, 6, 18), shiftPct: 1 };
    expect(classify(percentHigh, shortSeries).level).toBe('none');
    expect(classify(percentLow, shortSeries).level).toBe('quiet');
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
    expect(noisy.chrome.metrics.uiStartup.summary?.shiftMs).toBeGreaterThan(
      DEFAULT_CONFIG.floors.chrome.uiStartup.floorMs,
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

  it('never raises a verdict for a metric with no floor', () => {
    const { uiStartup } = DEFAULT_CONFIG.floors.chrome;
    const config = {
      ...DEFAULT_CONFIG,
      floors: { chrome: { uiStartup }, firefox: {} },
    };
    const batch = scoreBatch(
      'chrome',
      makeJobs([1.06, 1.062, 1.058, 1.061]),
      config,
    );
    expect(batch.metrics.uiStartup.verdict.level).toBe('loud');
    expect(batch.metrics.load.summary?.shiftMs).toBeGreaterThan(50);
    expect(batch.metrics.load.verdict.level).toBe('none');
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

describe('throttled run', () => {
  const config = throttledConfig();
  const chromeOnly = (jobs: JobResult[], using = config) =>
    ({ chrome: scoreBatch('chrome', jobs, using) }) as BatchScores;
  // A job whose base sessions take `level` ms, the head `factor` times that.
  const jobAt = (level: number, factor: number): JobResult => {
    const job = makeJob(factor);
    const scale = level / 1000;
    return {
      ...job,
      samples: Object.fromEntries(
        Object.entries(job.samples).map(([name, values]) => [
          name,
          values.map((value) => value * scale),
        ]),
      ),
    };
  };
  // A real shift of 1%: 10 ms on a 1000 ms build, 20 ms when throttled 2x.
  const onePercent = [1.01, 1.011, 1.009, 1.0105, 1.0095];

  it('scores Chrome alone, against the same floors in ms', () => {
    expect(config.browsers).toStrictEqual(['chrome']);
    expect(config.floors.chrome).toBe(DEFAULT_CONFIG.floors.chrome);
    expect(DEFAULT_CONFIG.browsers).toStrictEqual(['chrome', 'firefox']);
  });

  it('uses the power-user floors for the power-user preset', () => {
    const powerUser = throttledConfig('startupPowerUserHome');
    expect(powerUser.floors.chrome.uiStartup.floorMs).toBe(16.75);
    expect(powerUser.floors.chrome.load.floorMs).toBe(11.7);
  });

  it('pings on a shift the throttle made large enough, not on the same shift unthrottled', () => {
    const throttled = chromeOnly(onePercent.map((f) => jobAt(2000, f)));
    expect(needsConfirmation(throttled)).toBe(true);
    const decision = decide(
      throttled,
      chromeOnly(onePercent.map((f) => jobAt(2000, f))),
      config,
    );
    expect(decision.ping).toBe('quiet');
    expect(decision.unmeasured).toStrictEqual([]);

    const normal = chromeOnly(onePercent.map((f) => jobAt(1000, f)));
    expect(needsConfirmation(normal)).toBe(false);
  });

  it('never asks about Firefox, so a missing Firefox batch is not unmeasured', () => {
    const first = chromeOnly(makeJobs([1, 1.001, 0.999, 1, 1.002]));
    expect(decide(first, undefined, config)).toStrictEqual({
      ping: 'none',
      findings: [],
      unmeasured: [],
    });
  });
});
