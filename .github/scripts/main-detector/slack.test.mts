import type { BatchScores, Decision, Finding } from './score.mts';
import { buildSlackMessage } from './slack.mts';

const summary = (shiftPct: number) => ({
  shiftPct,
  lowerPct: shiftPct - 1,
  upperPct: shiftPct + 1,
  sdPct: 0.5,
  shiftMs: shiftPct * 10,
  lowerMs: (shiftPct - 1) * 10,
  upperMs: (shiftPct + 1) * 10,
  sdMs: 5,
  jobs: 5,
});

// Each log ratio is a shift against a 1000 ms base.
const batch = (logRatios: Record<string, number[]>): BatchScores => {
  const shifts = Object.fromEntries(
    Object.entries(logRatios).map(([metric, ratios]) => [
      metric,
      ratios.map((logRatio) => ({
        logRatio,
        ms: 1000 * (Math.exp(logRatio) - 1),
      })),
    ]),
  );
  const score = {
    jobsTotal: 5,
    jobsUsable: 5,
    measurable: true,
    shifts,
    metrics: {},
  };
  return { chrome: score, firefox: score };
};

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  browser: 'chrome',
  metric: 'uiStartup',
  direction: 'slower',
  level: 'quiet',
  first: summary(2),
  second: summary(3),
  pooled: summary(2.5),
  ...overrides,
});

const build = (decision: Decision, rangeSize = 1, subject = 'feat: x (#42)') =>
  buildSlackMessage({
    plan: {
      headSha: 'a'.repeat(40),
      headSubject: subject,
      baseSha: 'b'.repeat(40),
      canary: false,
      rangeSize,
    },
    first: batch({ uiStartup: [0.02, 0.03], loadScripts: [0.01] }),
    second: batch({ uiStartup: [0.03], loadScripts: [0.02] }),
    decision,
    repository: 'MetaMask/metamask-extension',
    runUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
    author: 'someone',
  });

const render = (payload: ReturnType<typeof build>) =>
  JSON.stringify(payload.blocks);

describe('buildSlackMessage', () => {
  it('links the commit and pull request and names the author', () => {
    const payload = build({
      ping: 'quiet',
      findings: [finding()],
      unmeasured: [],
    });

    expect(render(payload)).toContain(
      'https://github.com/MetaMask/metamask-extension/pull/42|#42',
    );
    expect(render(payload)).toContain('by someone');
  });

  it('words quiet and loud pings differently', () => {
    const quiet = build({
      ping: 'quiet',
      findings: [finding()],
      unmeasured: [],
    });
    const loud = build({
      ping: 'loud',
      findings: [finding({ level: 'loud' })],
      unmeasured: [],
    });

    expect(quiet.text).toContain('a performance change');
    expect(render(quiet)).toContain('large_yellow_circle');
    expect(loud.text).toContain('a large performance change');
    expect(render(loud)).toContain('red_circle');
  });

  it('reports pooled shift, per-job values and the breakdown', () => {
    const text = render(
      build({ ping: 'quiet', findings: [finding()], unmeasured: [] }),
    );

    expect(text).toContain(
      'Chrome, UI Startup* (`uiStartup`, time from opening the UI until it is ready): 27 ms slower (2.5%)',
    );
    expect(text).toContain('per job: +2.0, +3.0, +3.0 %');
    expect(text).toContain('Load Scripts');
    expect(text).toContain('Standard user');
    expect(text).toContain('startupStandardHome');
  });

  it('flags a breakdown metric that moved by more than 100%', () => {
    const decision: Decision = {
      ping: 'quiet',
      findings: [finding()],
      unmeasured: [],
    };
    const payload = buildSlackMessage({
      plan: {
        headSha: 'a'.repeat(40),
        headSubject: 'feat: x (#42)',
        baseSha: 'b'.repeat(40),
        canary: false,
        rangeSize: 1,
      },
      first: batch({ uiStartup: [0.02], firstReactRender: [4.3, 4.3] }),
      decision,
      repository: 'MetaMask/metamask-extension',
      runUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
      author: 'someone',
    });
    expect(render(payload)).toContain('First Render +7');
    expect(render(payload)).toContain('triangular_flag_on_post');
    expect(render(payload)).toContain('changed what the metric measures');
    expect(
      render(build({ ping: 'quiet', findings: [finding()], unmeasured: [] })),
    ).not.toContain('triangular_flag_on_post');
  });

  it('asks whether the metric still measures the same thing on a speed-up', () => {
    const faster = build({
      ping: 'loud',
      findings: [
        finding({
          direction: 'faster',
          level: 'loud',
          pooled: summary(-7),
        }),
      ],
      unmeasured: [],
    });
    const slower = build({
      ping: 'quiet',
      findings: [finding()],
      unmeasured: [],
    });

    expect(render(faster)).toContain('still measures the same thing');
    expect(render(slower)).not.toContain('still measures the same thing');
  });

  it('escapes commit text so it cannot ping a channel or fake a link', () => {
    const payload = buildSlackMessage({
      plan: {
        headSha: 'a'.repeat(40),
        headSubject: 'fix: <!channel> a < b <https://evil.test|click> (#7)',
        baseSha: 'b'.repeat(40),
        canary: false,
        rangeSize: 1,
      },
      first: batch({ uiStartup: [0.02] }),
      second: batch({ uiStartup: [0.03] }),
      decision: { ping: 'quiet', findings: [finding()], unmeasured: [] },
      repository: 'MetaMask/metamask-extension',
      runUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
      author: '<@U123> & co',
    });
    const text = render(payload);

    expect(text).not.toContain('<!channel>');
    expect(text).not.toContain('<https://evil.test');
    expect(text).toContain(
      '&lt;!channel&gt; a &lt; b &lt;https://evil.test|click&gt;',
    );
    expect(text).toContain('by &lt;@U123&gt; &amp; co');
    expect(text).toContain('pull/7|#7');
  });

  it('labels an injected dry run so it is not mistaken for a real change', () => {
    const payload = buildSlackMessage({
      plan: {
        headSha: 'a'.repeat(40),
        headSubject: 'feat: x (#42)',
        baseSha: 'b'.repeat(40),
        canary: false,
        injectMs: 40,
        rangeSize: 1,
      },
      first: batch({ uiStartup: [0.02] }),
      second: batch({ uiStartup: [0.03] }),
      decision: { ping: 'quiet', findings: [finding()], unmeasured: [] },
      repository: 'MetaMask/metamask-extension',
      runUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
      author: 'someone',
    });

    expect(payload.text).toContain('dry-run change injected');
    expect(render(payload)).toContain('slowed by 40 ms on purpose');
  });

  it('calls a canary ping a detector false alarm', () => {
    const payload = buildSlackMessage({
      plan: {
        headSha: 'a'.repeat(40),
        headSubject: 'feat: x (#42)',
        baseSha: 'a'.repeat(40),
        canary: true,
        rangeSize: 1,
      },
      first: batch({ uiStartup: [0.02] }),
      second: batch({ uiStartup: [0.03] }),
      decision: { ping: 'quiet', findings: [finding()], unmeasured: [] },
      repository: 'MetaMask/metamask-extension',
      runUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
      author: 'someone',
    });

    expect(payload.text).toContain('false alarm on the A/A canary');
    expect(render(payload)).toContain('same build, so this is noise');
  });

  it('notes a range of commits and unmeasured browsers', () => {
    const text = render(
      build(
        { ping: 'quiet', findings: [finding()], unmeasured: ['firefox'] },
        3,
      ),
    );

    expect(text).toContain('3 commits back');
    expect(text).toContain('Could not measure: Firefox');
  });

  // origin: ai-synthesis
  describe('critical user flows', () => {
    const slowCuf = {
      series: 'loadNewAccount.load_new_account',
      deltaBlockMs: 50,
      verdict: 'block' as const,
      jobs: 2,
      droppedPairs: 0,
      decision: {
        n: 10,
        shift: 70,
        lower: 61.5,
        k: 11,
        attainedLevel: 0.042,
        verdict: 'block' as const,
      },
    };
    const withCufs = (decision: Decision) =>
      buildSlackMessage({
        plan: {
          headSha: 'a'.repeat(40),
          headSubject: 'feat: x (#42)',
          baseSha: 'b'.repeat(40),
          canary: false,
          rangeSize: 1,
        },
        first: batch({ uiStartup: [0.02, 0.03] }),
        decision,
        repository: 'MetaMask/metamask-extension',
        runUrl: 'https://github.com/MetaMask/metamask-extension/actions/runs/1',
        author: 'someone',
        cufs: {
          outcomes: [slowCuf],
          findings: [slowCuf.series],
          unmeasured: ['assetDetails.tbt'],
        },
      });

    it('reports a slower flow when startup did not change, with no startup breakdown', () => {
      const payload = withCufs({ ping: 'none', findings: [], unmeasured: [] });

      expect(render(payload)).toContain('Critical user flow slower');
      expect(render(payload)).toContain(
        'shift +70.0 ms, lower bound +61.5 ms against δ_block 50 ms, 10 pairs from 2 jobs',
      );
      expect(render(payload)).toContain('critical user flow is slower');
      expect(render(payload)).toContain(
        'Could not measure critical user flows: assetDetails.tbt',
      );
      expect(render(payload)).not.toContain('Breakdown');
      expect(payload.text).toContain(
        'loadNewAccount.load_new_account +70.0 ms',
      );
    });

    it('keeps the startup findings and adds the flow beside them', () => {
      const payload = withCufs({
        ping: 'quiet',
        findings: [finding()],
        unmeasured: [],
      });

      expect(render(payload)).toContain('Breakdown');
      expect(render(payload)).toContain('Critical user flow slower');
      expect(payload.text).toContain('Chrome UI Startup');
    });
  });
});
