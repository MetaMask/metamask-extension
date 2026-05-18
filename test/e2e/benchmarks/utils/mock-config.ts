import { Mockttp, MockedEndpoint } from 'mockttp';
import {
  mockBenchmarkEndpoints,
  userStorageHostMock,
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
  // Use real server (no mocks) only for main/release/* branches
  return !isMainOrRelease;
}

/**
 * Returns the appropriate mock function based on the current branch.
 *
 * PRs and local dev: full mock suite (mockBenchmarkEndpoints).
 * main/release branches: no default mocks (pass-through). Individual tests
 * that need specific mocks (e.g. onboarding-import-wallet) should provide
 * their own testSpecificMock.
 *
 * Always registers `userStorageHostMock` so the user-storage / account sync
 * API never reaches a live server during benchmarks, regardless of branch.
 *
 * @returns A function that accepts a mockttp server and returns mocked endpoints.
 */
export function getTestSpecificMock(): (
  server: Mockttp,
) => Promise<MockedEndpoint[]> {
  if (shouldUseMockedRequests()) {
    return async (server: Mockttp) => {
      const endpoints = await mockBenchmarkEndpoints(server);
      await userStorageHostMock(server);
      return endpoints;
    };
  }
  return async (server: Mockttp) => {
    await userStorageHostMock(server);
    return [];
  };
}
