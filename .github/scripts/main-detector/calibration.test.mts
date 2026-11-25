import {
  binomialTail,
  buildCalibrationMessage,
  renderCalibration,
  summarizeCanaries,
  type DetectorResult,
} from './calibration.mts';
import type { BatchScores } from './score.mts';

// Five jobs whose shifts in ms have a sample standard deviation of `sdMs`.
const startupScore = (sdMs: number) => ({
  jobsTotal: 5,
  jobsUsable: 5,
  measurable: true,
  shifts: Object.fromEntries(
    ['uiStartup', 'load'].map((metric) => [
      metric,
      [sdMs, -sdMs, sdMs, -sdMs, 0].map((ms) => ({ logRatio: 0, ms })),
    ]),
  ),
  metrics: {},
});

const canary = (
  overrides: Partial<DetectorResult> & { sdMs?: number; canary?: boolean } = {},
): DetectorResult => {
  const { sdMs = 5, canary: isCanary = true, ...rest } = overrides;
  return {
    plan: {
      headSha: 'a'.repeat(40),
      headSubject: 'x',
      baseSha: 'a'.repeat(40),
      canary: isCanary,
      rangeSize: 1,
    },
    first: {
      chrome: startupScore(sdMs),
      firefox: startupScore(sdMs),
    } as BatchScores,
    decision: { ping: 'none', findings: [], unmeasured: [] },
    ...rest,
  };
};

const cufOutcome = (
  shift: number,
  verdict: 'block' | 'no-block' = 'no-block',
) => ({
  series: 'bridgeUserActions.bridge_load_page',
  deltaBlockMs: 33,
  verdict,
  jobs: 2,
  droppedPairs: 0,
  decision: {
    n: 20,
    shift,
    lower: shift - 10,
    k: 1,
    attainedLevel: 0.05,
    verdict,
  },
});

describe('binomialTail', () => {
  it('is the probability of k or more successes', () => {
    expect(binomialTail(10, 0, 0.05)).toBeCloseTo(1, 10);
    expect(binomialTail(10, 1, 0.05)).toBeCloseTo(1 - 0.95 ** 10, 10);
    expect(binomialTail(11, 3, 0.05)).toBeCloseTo(0.0152, 3);
    expect(binomialTail(10, 11, 0.05)).toBeCloseTo(0, 10);
  });
});

describe('summarizeCanaries', () => {
  it('counts only canary runs and says nothing about an empty week', () => {
    const none = summarizeCanaries([canary({ canary: false })]);
    expect(none).toMatchObject({ canaries: 0, ping: false, reasons: [] });
    expect(renderCalibration(none, '7 days')).toContain('nothing was checked');
    const old = canary();
    old.first = {} as BatchScores;
    expect(renderCalibration(summarizeCanaries([old]), '7 days')).toContain(
      '1 canary result was written before ms scoring',
    );
  });

  it('reports false pings without pinging while they stay within what the floors assume', () => {
    const report = summarizeCanaries([
      canary({ decision: { ping: 'quiet', findings: [], unmeasured: [] } }),
      ...Array.from({ length: 10 }, () => canary()),
    ]);
    expect(report).toMatchObject({ canaries: 11, falsePings: 1, ping: false });
  });

  it('pings when more canaries pinged than the assumed rate allows', () => {
    const pinged = { ping: 'quiet' as const, findings: [], unmeasured: [] };
    const report = summarizeCanaries([
      ...Array.from({ length: 3 }, () => canary({ decision: pinged })),
      ...Array.from({ length: 8 }, () => canary()),
    ]);
    expect(report.falsePings).toBe(3);
    expect(report.ping).toBe(true);
    expect(report.reasons[0]).toContain('3 of 11 canaries pinged');
  });

  it('counts a canary whose only finding is a critical user flow', () => {
    const report = summarizeCanaries([
      canary({
        cufs: {
          outcomes: [cufOutcome(40, 'block')],
          findings: ['bridgeUserActions.bridge_load_page'],
          unmeasured: [],
        },
      }),
    ]);
    expect(report.falsePings).toBe(1);
    expect(report.cufs[0]).toMatchObject({ falseFindings: 1, noiseMs: 40 });
  });

  it('pings when the noise of a batch shift has grown past a floor', () => {
    // Chrome load floor is 13.53 ms; a standard error of 5 / sqrt(5) is 2.2 ms,
    // and 40 / sqrt(5) is 17.9 ms.
    const quiet = summarizeCanaries([canary({ sdMs: 5 })]);
    expect(quiet.ping).toBe(false);
    const noisy = summarizeCanaries([canary({ sdMs: 40 })]);
    expect(noisy.ping).toBe(true);
    expect(noisy.reasons.join('\n')).toContain(
      'chrome load: the floor 13.5 ms',
    );
    expect(
      noisy.startup.find((s) => s.metric === 'load' && s.browser === 'chrome')
        ?.noiseMs,
    ).toBeCloseTo(17.9, 1);
  });

  it('pings when a critical user flow series shifts by more than its δ_block on an A/A', () => {
    const report = summarizeCanaries([
      canary({
        cufs: { outcomes: [cufOutcome(40)], findings: [], unmeasured: [] },
      }),
    ]);
    expect(report.reasons.join('\n')).toContain(
      'bridgeUserActions.bridge_load_page: δ_block 33 ms is below the noise',
    );
  });

  it('skips canary results written before ms scoring', () => {
    const old = canary();
    old.first = {
      chrome: { metrics: { uiStartup: { summary: { sdPct: 1, jobs: 5 } } } },
    } as unknown as BatchScores;
    expect(summarizeCanaries([old, canary()])).toMatchObject({
      canaries: 1,
      skipped: 1,
    });
  });
});

describe('buildCalibrationMessage', () => {
  it('names the window and each reason', () => {
    const report = summarizeCanaries([canary({ sdMs: 40 })]);
    const payload = buildCalibrationMessage(
      report,
      '2026-11-18..2026-11-25',
      'https://github.com/MetaMask/metamask-extension/actions/runs/1',
    );
    expect(payload.text).toContain('(calibration, 2026-11-18..2026-11-25)');
    expect(JSON.stringify(payload.blocks)).toContain('the floor 13.5 ms');
  });
});
