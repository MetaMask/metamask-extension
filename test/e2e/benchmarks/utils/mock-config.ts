import { Mockttp, MockedEndpoint } from 'mockttp';
import { mockBenchmarkEndpoints } from '../mocks/performance-mocks';

/**
 * Check if mocked requests should be used for performance benchmarks.
 *
 * Uses GITHUB_REF_NAME (already available in CI) to determine mode:
 * - Push to main or release/* branches → use real server requests
 * - Everything else (PRs, local dev, etc.) → use mocked HTTP responses
 *
 * @returns true if mocks should be used, false for real server requests
 */
export function shouldUseMockedRequests(): boolean {
  const branch = process.env.GITHUB_REF_NAME || '';
  const isMainOrRelease = branch === 'main' || branch.startsWith('release/');
  // Use real server (no mocks) only for main/release/* branches
  return !isMainOrRelease;
}

/**
 * Returns the appropriate mock function based on the current branch.
 *
 * - For PRs and feature branches: returns mockBenchmarkEndpoints function
 * - For main/release/* branches: returns a no-op function (no mocking, use real servers)
 *
 * Always returns a callable function so callers never receive undefined.
 */
export function getTestSpecificMock(): (
  server: Mockttp,
) => Promise<MockedEndpoint[]> {
  if (shouldUseMockedRequests()) {
    return async (server: Mockttp) => mockBenchmarkEndpoints(server);
  }
  return async () => [];
}
