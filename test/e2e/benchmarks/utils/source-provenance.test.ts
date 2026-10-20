import { captureSourceProvenance } from './source-provenance';

describe('captureSourceProvenance', () => {
  it('reads the identifiers the workflow sets', () => {
    expect(
      captureSourceProvenance({
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_SHA: 'merge-sha',
        HEAD_COMMIT_HASH: 'head-sha',
        BENCHMARK_BASE_SHA: 'base-sha',
        BENCHMARK_BUILDS_FROM_RUN: '123',
        BENCHMARK_BUILDS_FROM_SHA: 'donor-sha',
        BENCHMARK_BUILD_SOURCE_HASH: 'hash',
      }),
    ).toStrictEqual({
      event: 'pull_request',
      eventSha: 'merge-sha',
      headSha: 'head-sha',
      baseSha: 'base-sha',
      buildFromRun: '123',
      buildFromSha: 'donor-sha',
      buildSourceHash: 'hash',
    });
  });

  it('leaves unset and empty values undefined', () => {
    const source = captureSourceProvenance({
      GITHUB_SHA: '',
      BENCHMARK_BASE_SHA: '',
    });
    expect(Object.values(source).every((value) => value === undefined)).toBe(
      true,
    );
  });
});
