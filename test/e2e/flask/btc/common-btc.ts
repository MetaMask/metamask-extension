import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, unlockWallet } from '../../helpers';
import { DEFAULT_BTC_ACCOUNT } from '../../constants';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { Driver } from '../../webdriver/driver';
import { createBtcAccount } from '../../accounts/common';

const GENERATE_MOCK_BTC_BALANCE_CALL = (
  address: string = DEFAULT_BTC_ACCOUNT,
): { data: { [address: string]: number } } => {
  return {
    data: {
      [address]: 9999,
    },
  };
};

export async function mockBtcBalanceQuote(
  mockServer: Mockttp,
  address: string = DEFAULT_BTC_ACCOUNT,
) {
  return await mockServer
    .forGet(/https:\/\/api\.blockchair\.com\/bitcoin\/addresses\/balances/u)
    .withQuery({
      addresses: address,
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: GENERATE_MOCK_BTC_BALANCE_CALL(address),
    }));
}

export async function mockRampsDynamicFeatureFlag(
  mockServer: Mockttp,
  subDomain: string,
) {
  return await mockServer
    .forGet(
      `https://on-ramp-content.${subDomain}.cx.metamask.io/regions/networks`,
    )
    .withQuery({
      context: 'extension',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        networks: [
          {
            active: true,
            chainId: MultichainNetworks.BITCOIN,
            chainName: 'Bitcoin',
            shortName: 'Bitcoin',
            nativeTokenSupported: true,
            isEvm: false,
          },
        ],
      },
    }));
}

export async function withBtcAccountSnap(
  {
    title,
    bitcoinSupportEnabled,
  }: { title?: string; bitcoinSupportEnabled?: boolean },
  test: (driver: Driver) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPreferencesControllerAndFeatureFlag({
          bitcoinSupportEnabled: bitcoinSupportEnabled ?? true,
        })
        .build(),
      title,
      dapp: true,
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockBtcBalanceQuote(mockServer),
        // See: PROD_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'api'),
        // See: UAT_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);
      await createBtcAccount(driver);
      await test(driver);
    },
  );
}
