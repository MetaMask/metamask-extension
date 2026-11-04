import { Mockttp } from 'mockttp';
import { NetworkStatus } from '@metamask/network-controller';
import { Context } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  NETWORK_CLIENT_ID,
} from '../../constants';
import {
  ACCOUNTS_API_MAINNET_BALANCE,
  LOCALHOST_RPC_BALANCE,
  POLYGON_RPC_BALANCE,
  PRICE_API_MAINNET_BALANCE,
  STALE_FIXTURE_BALANCE,
  mockAccountsApiDown,
  mockPriceApiDown,
  mockUnprocessedChainBalances,
  weiHex,
} from './utils/assets-fallback-mocks';

const LOCALHOST_ASSET_ID = 'eip155:1337/slip44:1';
const MAINNET_ASSET_ID = 'eip155:1/slip44:60';
const POLYGON_ASSET_ID = 'eip155:137/slip44:60';

const LIST_TIMEOUT_MS = 30_000;

describe('Assets API fallbacks', function () {
  it('shows the RPC balance when the Accounts API returns 500', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withAccountTracker({
            accountsByChainId: {
              '0x539': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
            },
          })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                [LOCALHOST_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
              },
            },
          })
          .build(),
        title: (this as Context).test?.fullTitle(),
        // Fund the fixture account before the extension boots. The default
        // Anvil balance belongs to a different address, so an unread RPC
        // would stay at the stale fixture amount.
        afterLocalNodesStart: async ({
          localNodes,
        }: {
          localNodes: Anvil[];
        }) => {
          await localNodes[0].setAccountBalance(
            DEFAULT_FIXTURE_ACCOUNT,
            weiHex(BigInt(LOCALHOST_RPC_BALANCE)),
          );
        },
        testSpecificMock: (mockServer: Mockttp) =>
          mockAccountsApiDown(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const homepage = new HomePage(driver);
        await homepage.checkExpectedBalanceIsDisplayed({
          expectedBalance: LOCALHOST_RPC_BALANCE,
          timeout: LIST_TIMEOUT_MS,
        });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          'Ethereum',
          `${LOCALHOST_RPC_BALANCE} ETH`,
          { timeout: LIST_TIMEOUT_MS, amountTimeout: LIST_TIMEOUT_MS },
        );
      },
    );
  });

  it('shows token amounts without fiat when the Price API returns 500', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
            },
          })
          .withAssetsController(
            {
              assetsPrice: {},
              assetsBalance: {
                [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                  [MAINNET_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
                },
              },
            },
            { overwrite: true },
          )
          .build(),
        title: (this as Context).test?.fullTitle(),
        unifiedEvmAccountsApiBalances: {
          mainnetNativeEthHuman: PRICE_API_MAINNET_BALANCE,
        },
        testSpecificMock: (mockServer: Mockttp) => mockPriceApiDown(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          'Ethereum',
          `${PRICE_API_MAINNET_BALANCE} ETH`,
          { timeout: LIST_TIMEOUT_MS, amountTimeout: LIST_TIMEOUT_MS },
        );
        await tokensTab.checkNoConversionRateDisplayed(LIST_TIMEOUT_MS);
      },
    );
  });

  it('keeps the Accounts API balance on processed chains and uses RPC for unprocessed chains', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true, '0x89': true } })
          .withNetworkController({
            networksMetadata: {
              mainnet: { EIPS: {}, status: NetworkStatus.Available },
              'polygon-mainnet': {
                EIPS: {},
                status: NetworkStatus.Available,
              },
            },
          })
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: { assetsAccountsApiV6: true },
          })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
              '0x89': {
                [DEFAULT_FIXTURE_ACCOUNT]: {
                  balance: weiHex(BigInt(STALE_FIXTURE_BALANCE)),
                },
              },
            },
          })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                [MAINNET_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
                [POLYGON_ASSET_ID]: { amount: STALE_FIXTURE_BALANCE },
              },
            },
          })
          .build(),
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockUnprocessedChainBalances(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          'Ethereum',
          `${ACCOUNTS_API_MAINNET_BALANCE} ETH`,
          { timeout: LIST_TIMEOUT_MS, amountTimeout: LIST_TIMEOUT_MS },
        );
        await tokensTab.checkTokenExistsInList(
          'POL',
          `${POLYGON_RPC_BALANCE} POL`,
          {
            timeout: LIST_TIMEOUT_MS,
            amountTimeout: LIST_TIMEOUT_MS,
          },
        );
      },
    );
  });
});
