import type { Mockttp, MockedEndpoint } from 'mockttp';

type SetupMockReturn = {
  mockedEndpoint: MockedEndpoint[];
  getPrivacyReport: () => string[];
};

/**
 * Setup E2E network mocks that just passes through requests
 *
 * @param server - The mock server used for network mocks.
 * @param testSpecificMock - Function for setting up test-specific network mocks.
 * @returns SetupMockReturn
 */
export async function setupMockingPassThrough(
  server: Mockttp,
  testSpecificMock: (server: Mockttp) => Promise<MockedEndpoint[]>,
): Promise<SetupMockReturn> {
  await server.forAnyRequest().thenPassThrough({
    beforeRequest: (req) => {
      console.log('Request going to a live server ============', req.url);
      return {};
    },
  });

  const mockedEndpoint = await testSpecificMock(server);

  return { mockedEndpoint, getPrivacyReport };
}

/**
 * This version does not support a privacy report.
 */
function getPrivacyReport(): string[] {
  return [];
}
