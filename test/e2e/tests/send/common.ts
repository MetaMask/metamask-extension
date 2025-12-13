import { Mockttp } from 'mockttp';

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

const mockSendFeatureFlag = (mockServer: Mockttp, enabled: boolean) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            sendRedesign: {
              enabled,
            },
          },
        ],
      };
    });

export const mockSendRedesignFeatureFlag = (mockServer: Mockttp) =>
  mockSendFeatureFlag(mockServer, true);

export const mockLegacySendFeatureFlag = (mockServer: Mockttp) =>
  mockSendFeatureFlag(mockServer, false);
