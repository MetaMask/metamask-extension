import { Mockttp } from 'mockttp';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

export const mockStellarFeatureFlag = (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'flask',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            stellarAccounts: { enabled: true, minimumVersion: '0.0.1' },
            sendRedesign: {
              enabled: false,
            },
          },
        ],
      };
    });
