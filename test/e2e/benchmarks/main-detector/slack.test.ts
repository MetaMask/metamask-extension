import type { BatchScores, Decision, Finding } from './score';
import { buildSlackMessage } from './slack';

const summary = (shiftPct: number) => ({
  shiftPct,
  lowerPct: shiftPct - 1,
  upperPct: shiftPct + 1,
  sdPct: 0.5,
  jobs: 5,
});

const batch = (logRatios: Record<string, number[]>): BatchScores => {
  const score = {
    jobsTotal: 5,
    jobsUsable: 5,
    measurable: true,
    logRatios,
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
  JSON.stringify(payload.attachments[0].blocks);

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

  it('colors and titles quiet and loud pings differently', () => {
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

    expect(quiet.attachments[0].color).not.toBe(loud.attachments[0].color);
    expect(quiet.text).toContain('Performance change');
    expect(loud.text).toContain('Large performance change');
  });

  it('reports pooled shift, per-job values and the breakdown', () => {
    const text = render(
      build({ ping: 'quiet', findings: [finding()], unmeasured: [] }),
    );

    expect(text).toContain('Chrome uiStartup: 2.5% slower');
    expect(text).toContain('Per job (3)');
    expect(text).toContain('loadScripts');
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

    expect(payload.text).toContain('Detector false alarm');
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
});
