import type { SourceProvenance } from '../../../../shared/constants/benchmarks';

function nonEmpty(value: string | undefined): string | undefined {
  return value || undefined;
}

/**
 * Identify the source and build a result describes, from variables the
 * workflow sets. See `SourceProvenance` for what each field means.
 *
 * @param env - Environment to read; defaults to the process environment.
 * @returns Source provenance for the result being assembled.
 */
export function captureSourceProvenance(
  env: NodeJS.ProcessEnv = process.env,
): SourceProvenance {
  return {
    event: nonEmpty(env.GITHUB_EVENT_NAME),
    eventSha: nonEmpty(env.GITHUB_SHA),
    headSha: nonEmpty(env.HEAD_COMMIT_HASH),
    baseSha: nonEmpty(env.BENCHMARK_BASE_SHA),
    buildFromRun: nonEmpty(env.BENCHMARK_BUILDS_FROM_RUN),
    buildFromSha: nonEmpty(env.BENCHMARK_BUILDS_FROM_SHA),
    buildSourceHash: nonEmpty(env.BENCHMARK_BUILD_SOURCE_HASH),
  };
}
