import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import Homepage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { DAPP_PATH } from '../../constants';
import { proxyTronBlockchainCalls } from '../../tests/tron/mocks/local-tron-node-mocks';
import { TronNode } from '../../seeder/tron/node';
import { createTronDappUsdtNodeOptions } from '../../seeder/tron/profiles';
import { mockTronFeatureFlag } from './mocks/feature-flag';
import { prepareLocalTronDapp } from './local-tron-dapp';
import {
  mockExchangeRates,
  mockHistoricalPrices1d,
  mockHistoricalPrices7d,
  mockExchangeRatesV1,
  mockTokens,
  mockScanTransaction,
} from './mocks';

export const TRANSACTION_HASH_MOCK =
  '36c4096d30a82641ee9d8c12297ed330ddb0f8ae272dc2564995de7a4201a67e';

export const DEFAULT_MESSAGE_SIGNATURE =
  '0xa92e82ed84ec0b7a7f061948e27feb0d0ad2c2cb474aaa1a1660f13a76240aa709b248f83c17600a35a7f6ceca6d952483515196268a6306c9496a3e578fd7af1c';

export const withTronAccountSnap = async (
  {
    title,
    numberOfAccounts = 1,
    dappOptions,
  }: {
    title?: string;
    numberOfAccounts?: number;
    dappOptions?: {
      numberOfTestDapps?: number;
      customDappPaths?: string[];
    };
  },
  test: (driver: Driver) => Promise<void>,
) => {
  const resolvedDappOptions = dappOptions ?? {
    customDappPaths: [DAPP_PATH.TEST_DAPP_TRON],
  };

  await withFixtures(
    {
      forceBip44Version: false,
      fixtures: new FixtureBuilderV2()
        .withEnabledNetworks({
          tron: {
            [MultichainNetworks.TRON]: true,
            [MultichainNetworks.TRON_NILE]: true,
            [MultichainNetworks.TRON_SHASTA]: true,
          },
          eip155: {
            '0x539': true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: resolvedDappOptions,
      localNodeOptions: [
        'anvil',
        {
          type: 'tron',
          options: createTronDappUsdtNodeOptions(
            'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
          ),
        },
      ],
      afterLocalNodesStart: async ({
        localNodes,
      }: {
        localNodes: unknown[];
      }) => {
        const tronNode = localNodes.find(
          (node): node is TronNode => node instanceof TronNode,
        );
        if (!tronNode) {
          throw new Error('Tron local node was not started');
        }

        resolvedDappOptions.customDappPaths = [
          await prepareLocalTronDapp(tronNode),
        ];
      },
      testSpecificMock: async (
        mockServer: Mockttp,
        { localNodes }: { localNodes: unknown[] },
      ) => {
        const tronNode = localNodes.find(
          (node): node is TronNode => node instanceof TronNode,
        );
        if (!tronNode) {
          throw new Error('Tron local node was not started');
        }

        return [
          await mockTronFeatureFlag(mockServer),
          await mockExchangeRates(mockServer),
          await mockExchangeRatesV1(mockServer),
          await mockHistoricalPrices1d(mockServer),
          await mockHistoricalPrices7d(mockServer),
          await mockTokens(mockServer, tronNode),
          await mockScanTransaction(mockServer),
          ...(await proxyTronBlockchainCalls(
            mockServer,
            tronNode,
            'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
          )),
        ];
      },
    },
    async ({ driver }: { driver: Driver }) => {
      await login(driver);

      const accountListPage = new AccountListPage(driver);
      const homepage = new Homepage(driver);
      await homepage.checkExpectedBalanceIsDisplayed();

      for (let i = 0; i < numberOfAccounts; i++) {
        // For the first iteration open the account menu
        if (i === 0) {
          await homepage.headerNavbar.openAccountMenu();
        }

        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
      }

      await accountListPage.selectAccount('Account 1');

      await test(driver);
    },
  );
};
