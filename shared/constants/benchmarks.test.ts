import { BENCHMARK_MOCK_MODE, resolveBenchmarkMockMode } from './benchmarks';

describe('resolveBenchmarkMockMode', () => {
  it('treats main as the live population', () => {
    expect(resolveBenchmarkMockMode('main')).toBe(BENCHMARK_MOCK_MODE.LIVE);
  });

  it('treats release branches as the live population', () => {
    expect(resolveBenchmarkMockMode('release/13.42.0')).toBe(
      BENCHMARK_MOCK_MODE.LIVE,
    );
  });

  it('treats pull request merge refs as the mocked population', () => {
    // On `pull_request` events GITHUB_REF_NAME is `<number>/merge`, never the
    // head branch name — the gate's enforcement hinges on this resolving to
    // `mocked`.
    expect(resolveBenchmarkMockMode('45147/merge')).toBe(
      BENCHMARK_MOCK_MODE.MOCKED,
    );
  });

  it('treats feature branches as the mocked population', () => {
    expect(resolveBenchmarkMockMode('jongsun/ci/some-change')).toBe(
      BENCHMARK_MOCK_MODE.MOCKED,
    );
  });

  it('does not mistake a branch merely prefixed with main for main', () => {
    expect(resolveBenchmarkMockMode('maintenance/cleanup')).toBe(
      BENCHMARK_MOCK_MODE.MOCKED,
    );
  });

  it('defaults to the mocked population when the branch is unset', () => {
    // Local dev has no GITHUB_REF_NAME; mocked is both the safe default and
    // what the harness already does there.
    expect(resolveBenchmarkMockMode(undefined)).toBe(
      BENCHMARK_MOCK_MODE.MOCKED,
    );
    expect(resolveBenchmarkMockMode('')).toBe(BENCHMARK_MOCK_MODE.MOCKED);
  });
});
