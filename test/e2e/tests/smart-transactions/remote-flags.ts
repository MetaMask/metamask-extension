import { MockttpServer } from 'mockttp';

/**
 * Mocks remote feature flags for smart transactions usage in tests.
 *
 * @param mockServer - Mock server instance used to stub the flags request.
 */
export async function mockSmartTransactionsRemoteFlags(
  mockServer: MockttpServer,
): Promise<void> {
  await mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            smartTransactionsNetworks: {
              '0x1': {
                extensionActive: true,
              },
            },
          },
        ],
      };
    });
}
