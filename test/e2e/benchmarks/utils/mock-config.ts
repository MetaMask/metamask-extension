import { Mockttp, MockedEndpoint } from 'mockttp';
import {
  mockBenchmarkEndpoints,
  getCommonMocks,
} from '../mocks/performance-mocks';

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
  return !isMainOrRelease;
}

/**
 * Returns the appropriate mock function based on the current branch.
 *
 * - PRs and local dev: full mock suite (mockBenchmarkEndpoints)
 * - main/release branches: real servers with common mocks for analytics,
 *   Sentry, and other noisy endpoints that should never hit live servers
 */
export function getTestSpecificMock(): (
  server: Mockttp,
) => Promise<MockedEndpoint[]> {
  if (shouldUseMockedRequests()) {
    return async (server: Mockttp) => mockBenchmarkEndpoints(server);
  }
  return async (server: Mockttp) => Promise.all(getCommonMocks(server));
}
