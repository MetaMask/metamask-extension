import { MockttpServer } from 'mockttp';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

/**
 * Mocks remote feature flags for smart transactions usage in tests.
 * Uses the same pattern as bridge-test-utils mockFeatureFlags() so the flags
 * response (and thus SSE) is applied the same way as in bridge tests.
 *
 * @param mockServer - Mock server instance used to stub the flags request.
 */
export async function mockSmartTransactionsRemoteFlags(
  mockServer: MockttpServer,
): Promise<void> {
  await mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            bridgeConfig: {
              ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
              sse: {
                enabled: true,
                minimumVersion: '0.0.0',
              },
            },
            smartTransactionsNetworks: {
              '0x1': {
                extensionActive: true,
              },
            },
            extensionUxPna25: true,
          },
        ],
      };
    });
}
