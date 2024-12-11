import { MockttpServer } from 'mockttp';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from './constants';

/**
 * Mock the security alerts API failing to test the fallback mechanism.
 *
 * @param mockServer - The mock server instance to set up the mock response.
 * @returns A promise that resolves when the mock setup is complete.
 */
export async function mockSecurityAlertsAPIFailed(mockServer: MockttpServer) {
  await mockServer
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .thenCallback(() => {
      return { statusCode: 500, message: 'Internal server error' };
    });
}
