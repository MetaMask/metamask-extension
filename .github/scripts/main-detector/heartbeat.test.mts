import {
  assessHealth,
  buildHeartbeatMessage,
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

  it('does not count a cancelled or running detector run as a failure', () => {
    const health = assessHealth(
      [run('a'), run('b')],
      [run('a', 'cancelled'), run('b', null)],
    );
    expect(health.status).toBe('ok');
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
});
