import type { MockedEndpoint, Mockttp } from 'mockttp';
import { NetworkReport } from './benchmarks/types-generated';

type SetupMockReturn = {
  mockedEndpoint: MockedEndpoint[];
  getPrivacyReport: () => string[];
  getNetworkReport: () => NetworkReport;
  clearNetworkReport: () => void;
};

/**
 * Setup E2E network mocks that just passes through requests
 *
 * @param server - The mock server used for network mocks.
 * @param testSpecificMock - Function for setting up test-specific network mocks.
 * @param _options - Not used in this version
 * @param _withSolanaWebSocket - Not used in this version
 * @returns SetupMockReturn
 */
export async function setupMockingPassThrough(
  server: Mockttp,
  testSpecificMock: (server: Mockttp) => Promise<MockedEndpoint[]>,
  _options = undefined,
  _withSolanaWebSocket = undefined,
): Promise<SetupMockReturn> {
  let numNetworkReqs = 0;

  await server.forAnyRequest().thenPassThrough({
    beforeRequest: (req) => {
      // console.log('Request going to a live server ============', req.url);
      return {};
    },
  });

  const mockedEndpoint = await testSpecificMock(server);

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
