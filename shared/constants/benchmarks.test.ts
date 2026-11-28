import { BENCHMARK_MOCK_MODE, resolveBenchmarkMockMode } from './benchmarks';

describe('resolveBenchmarkMockMode', () => {
  it('treats main as the live population', () => {
    expect(resolveBenchmarkMockMode('main')).toBe(BENCHMARK_MOCK_MODE.LIVE);
  });

  it('lets an explicit override beat the branch heuristic on main', () => {
    // The per-commit path relies on this: main measures mocked so the gate
    // compares one population, and the scheduled drift job passes `live`.
    expect(resolveBenchmarkMockMode('main', 'mocked')).toBe(
      BENCHMARK_MOCK_MODE.MOCKED,
    );
    expect(resolveBenchmarkMockMode('release/13.44.0', 'mocked')).toBe(
      BENCHMARK_MOCK_MODE.MOCKED,
    );
  });

  it('lets an explicit override beat the branch heuristic on a PR ref', () => {
    expect(resolveBenchmarkMockMode('45147/merge', 'live')).toBe(
      BENCHMARK_MOCK_MODE.LIVE,
    );
  });

  it('falls back to the branch heuristic when the override is absent or unrecognised', () => {
    // An empty string is what an unset workflow input expands to, and a typo
    // must not silently pick a population — both fall through to the branch.
    for (const override of [undefined, '', 'MOCKED', 'mock', 'true']) {
      expect(resolveBenchmarkMockMode('main', override)).toBe(
        BENCHMARK_MOCK_MODE.LIVE,
      );
      expect(resolveBenchmarkMockMode('45147/merge', override)).toBe(
        BENCHMARK_MOCK_MODE.MOCKED,
      );
    }
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
