import { Mockttp } from 'mockttp';
import { LEGACY_SEND_FEATURE_FLAG } from '../../../tests/send/common';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

export const mockBitcoinFeatureFlag = (mockServer: Mockttp) =>
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
            bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
            ...LEGACY_SEND_FEATURE_FLAG,
          },
        ],
      };
    });
