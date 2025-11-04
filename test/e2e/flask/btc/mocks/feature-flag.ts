import { Mockttp } from 'mockttp';
import { BIP44_STAGE_TWO } from '../../../tests/multichain-accounts/feature-flag-mocks';

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
          { bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
          ...BIP44_STAGE_TWO,
          }
        ],
      };
    });
