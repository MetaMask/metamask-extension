import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { DAPP_PATH } from '../../constants';
import {
  mockExchangeRates,
  mockFiatExchangeRates,
} from '../../tests/btc/mocks/price-api';
import {
  mockHorizonAccount,
  mockHorizonDefaultResponse,
  mockHorizonTestnetAccount,
  mockStellarFeatureFlag,
  mockStellarMessageScan,
  mockStellarStaticAssets,
  mockStellarTokens,
  mockStellarTransactionScan,
  mockStellarWalletIcons,
} from '../../tests/stellar/mocks';

export async function withStellarWalletSnap(
  {
    title,
    dappOptions,
  }: {
    title?: string;
    dappOptions?: {
      numberOfTestDapps?: number;
      customDappPaths?: string[];
    };
  },
  test: (driver: Driver) => Promise<void>,
) {
  await withFixtures(
    {
      forceBip44Version: false,
      fixtures: new FixtureBuilderV2()
        .withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
          stellar: {
            [MultichainNetworks.STELLAR]: true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: dappOptions ?? {
        customDappPaths: [DAPP_PATH.TEST_DAPP_STELLAR],
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockStellarFeatureFlag(mockServer),
        await mockHorizonAccount(mockServer),
        await mockHorizonTestnetAccount(mockServer),
        await mockHorizonDefaultResponse(mockServer),
        await mockStellarMessageScan(mockServer),
        await mockStellarTransactionScan(mockServer),
        await mockStellarTokens(mockServer),
        await mockStellarStaticAssets(mockServer),
        await mockStellarWalletIcons(mockServer),
        await mockExchangeRates(mockServer),
        await mockFiatExchangeRates(mockServer),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await login(driver);
      await test(driver);
    },
  );
}
