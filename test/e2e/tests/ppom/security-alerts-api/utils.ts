import { MockttpServer } from 'mockttp';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../constants';

/**
 * Mocks a security alert validation request to the server.
 *
 * @param server - The MockttpServer instance to mock the request on.
 * @param request - The request payload to be validated.
 * @param response - The response payload to be returned.
 */
export async function mockSecurityAlertValidateRequest(
  server: MockttpServer,
  request: Record<string, unknown>,
  response: Record<string, unknown>,
): Promise<void> {
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .withJsonBodyIncluding(request)
    .thenJson((response.statusCode as number) ?? 201, response);
}
