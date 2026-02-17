import type { MockedEndpoint, Mockttp } from 'mockttp';
import type { NetworkReport } from './benchmarks/utils/types';

type SetupMockReturn = {
  mockedEndpoint: MockedEndpoint[];
  getPrivacyReport: () => string[];
  getNetworkReport: () => NetworkReport;
  clearNetworkReport: () => void;
};

/**
 * A callback that can intercept a request inside `thenPassThrough()`.
 * Return an object with a `response` property to short-circuit the
 * request. Return `null` or `undefined` to let it pass through.
 */
export type PassThroughInterceptor = (req: {
  url: string;
  method: string;
}) => { response: Record<string, unknown> } | null | undefined;

/**
 * Attach a request interceptor to the mock server that will be
 * evaluated inside the pass-through `beforeRequest` callback.
 * Call this from `testSpecificMock` before `setupMockingPassThrough`
 * registers the catch-all handler.
 *
 * @param server - The mock server
 * @param interceptor - The interceptor function
 */
export function setPassThroughInterceptor(
  server: Mockttp,
  interceptor: PassThroughInterceptor,
): void {
  (server as unknown as Record<string, unknown>).__passThroughInterceptor =
    interceptor;
}

/**
 * Setup E2E network mocks that just passes through requests
 *
 * @param server - The mock server used for network mocks.
 * @param testSpecificMock - Optional function for setting up test-specific network mocks.
 * @param _options - Not used in this version
 * @param _withSolanaWebSocket - Not used in this version
 * @returns SetupMockReturn
 */
export async function setupMockingPassThrough(
  server: Mockttp,
  testSpecificMock?: (server: Mockttp) => Promise<MockedEndpoint[]>,
  _options = undefined,
  _withSolanaWebSocket = undefined,
): Promise<SetupMockReturn> {
  let numNetworkReqs = 0;

  const mockedEndpoint = testSpecificMock ? await testSpecificMock(server) : [];

  // Retrieve any interceptor set by testSpecificMock
  const interceptor = (server as unknown as Record<string, unknown>)
    .__passThroughInterceptor as PassThroughInterceptor | undefined;

  // Single catch-all: pass every request through to the live server,
  // but first check if a test-specific interceptor wants to handle it.
  await server
    .forAnyRequest()
    .asPriority(-1)
    .thenPassThrough({
      beforeRequest: (req) => {
        if (interceptor) {
          const result = interceptor(req);
          if (result?.response) {
            return result;
          }
        }
        return {};
      },
    });

  server.on('request-initiated', () => {
    numNetworkReqs += 1;
  });

  function getNetworkReport(): NetworkReport {
    return { numNetworkReqs };
  }

  function clearNetworkReport() {
    numNetworkReqs = 0;
  }

  return {
    mockedEndpoint,
    getPrivacyReport,
    getNetworkReport,
    clearNetworkReport,
  };
}

/**
 * This version does not support a privacy report.
 */
function getPrivacyReport(): string[] {
  return [];
}
