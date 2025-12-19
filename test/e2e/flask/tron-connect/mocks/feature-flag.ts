import { Mockttp } from 'mockttp';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

export const mockTronFeatureFlag = (mockServer: Mockttp) =>
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
            tronAccounts: { enabled: true, minimumVersion: '7.61.0' },
            tronStaking: false,
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: '12.19.0',
            },
            sendRedesign: {
              enabled: false,
            }
          },
        ],
      };
    });
