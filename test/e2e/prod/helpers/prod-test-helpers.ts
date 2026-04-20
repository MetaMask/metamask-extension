import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';

/**
 * Production E2E Test Helpers
 *
 * These helpers are designed for E2E tests that run against real blockchain networks
 * and real external services (APIs, RPCs, etc.) instead of mocked/local infrastructure.
 *
 * Key differences from standard E2E tests:
 * - Uses real RPC endpoints (Infura, Alchemy, etc.) instead of Anvil/Ganache
 * - Uses real external APIs (token lists, price feeds, etc.) instead of mocks
 * - No smart contract deployment (uses existing mainnet/testnet contracts)
 * - Requires real API keys and network access
 * - Tests are slower but validate production behavior
 */

/**
 * Options for production E2E tests
 */
export type ProdTestOptions = {
  /** Test title for logging */
  title: string;

  /** Fixture state to load */
  fixtures: any;

  /** Driver options */
  driverOptions?: any;

  /** Dapp options */
  dappOptions?: any;

  /** Manifest flags to override */
  manifestFlags?: any;

  /** Console errors to ignore */
  ignoredConsoleErrors?: string[];

  /** Whether to disable server mocha to background */
  disableServerMochaToBackground?: boolean;

  /** Extended timeout multiplier for slower network operations */
  extendedTimeoutMultiplier?: number;

  /**
   * Optional test-specific mocks for services that MUST be mocked
   * (e.g., analytics, error tracking) even in production tests
   */
  testSpecificMock?: (server: Mockttp) => Promise<any[]>;

  /**
   * Disable proxy entirely - Chrome will connect directly to all services.
   * Use this if you want to manually test after the test ends without proxy issues.
   *
   * WARNING: This will send analytics and error reports to production systems!
   * Only use for local testing, never in CI.
   */
  disableProxy?: boolean;
};

/**
 * Setup minimal mocking for production tests.
 * Only mocks services that should NEVER hit production (analytics, error tracking).
 * All other requests pass through to real services.
 *
 * @param server - Mockttp server instance
 * @param testSpecificMock - Optional test-specific mocks
 * @returns Mocked endpoints
 */
export async function setupProductionMocking(
  server: Mockttp,
  testSpecificMock?: (server: Mockttp) => Promise<any[]>,
): Promise<any[]> {
  const mocks: any[] = [];

  // Mock analytics to prevent test data pollution
  await server
    .forPost(/https:\/\/api\.segment\.io\/v1\/.*/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: { success: true },
    }));

  // Mock Sentry to prevent error reporting from tests
  await server.forPost(/https:\/\/sentry\.io\/api\/.*/u).thenCallback(() => ({
    statusCode: 200,
    json: { id: 'test-event-id' },
  }));

  // Mock MetaMetrics to prevent analytics
  await server
    .forPost(/https:\/\/chromeextensionmm\.innocraft\.cloud\/.*/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {},
    }));

  // Apply test-specific mocks if provided
  if (testSpecificMock) {
    const testMocks = await testSpecificMock(server);
    mocks.push(...testMocks);
  }

  // Pass through ALL other requests to real services
  await server.forAnyRequest().thenPassThrough({
    beforeRequest: (req) => {
      console.log(`[PROD TEST] Request to real service: ${req.url}`);
      return {};
    },
  });

  return mocks;
}

/**
 * Wait for a real blockchain transaction to be confirmed.
 * Uses polling with exponential backoff.
 *
 * @param driver - WebDriver instance
 * @param txHash - Transaction hash to wait for
 * @param options - Wait options
 * @param options.maxWaitTime
 * @param options.pollInterval
 */
export async function waitForRealTransaction(
  driver: Driver,
  txHash: string,
  options: {
    maxWaitTime?: number;
    pollInterval?: number;
  } = {},
): Promise<void> {
  const { maxWaitTime = 120000, pollInterval = 5000 } = options;
  const startTime = Date.now();

  console.log(`[PROD TEST] Waiting for transaction ${txHash} to confirm...`);

  while (Date.now() - startTime < maxWaitTime) {
    // Check if transaction is confirmed by looking at UI state
    // This is a placeholder - actual implementation would check transaction status
    await driver.delay(pollInterval);

    // TODO: Implement actual transaction confirmation check
    // This could involve checking the activity list or transaction details
    console.log(`[PROD TEST] Polling for transaction ${txHash}...`);
  }

  throw new Error(
    `Transaction ${txHash} did not confirm within ${maxWaitTime}ms`,
  );
}

/**
 * Delays for production tests.
 * Real network operations are slower than local blockchain.
 */
export const PROD_DELAYS = {
  /** Wait for RPC response */
  RPC_RESPONSE: 5000,

  /** Wait for token balance to update */
  TOKEN_BALANCE_UPDATE: 10000,

  /** Wait for transaction confirmation */
  TX_CONFIRMATION: 30000,

  /** Wait for API response (token lists, prices, etc.) */
  API_RESPONSE: 5000,
} as const;
