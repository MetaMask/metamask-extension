import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  EXPECTED_BTC_ADDRESSES_BY_INDEX,
  EXPECTED_BTC_SCRIPT_PUBKEYS_BY_INDEX,
} from '../../constants';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  addAccounts,
  waitUntilAccountTreeSyncIdle,
} from '../../page-objects/flows/add-account.flow';
import AccountListPage from '../../page-objects/pages/accounts/list-page';
import HomePage from '../../page-objects/pages/home/homepage';
import AccountAddressListPage from '../../page-objects/pages/accounts/address-list-page';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { Driver } from '../../webdriver/driver';
import { BitcoinNode } from '../../seeder/bitcoin/node';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { proxyBitcoinBlockchainCalls } from './mocks/local-bitcoin-node-mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

async function mockFeatureFlags(mockServer: Mockttp) {
  return mockServer
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({
      client: 'extension',
      distribution: 'main',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        ...getProductionRemoteFlagApiResponse(),
        // Account discovery queries popular EVM chains, while these Bitcoin
        // tests only mock Bitcoin. Disable failover to avoid unrelated hosts.
        { corePlatformRpcFailoverMode: 'disabled' },
      ],
    }));
}

async function mockBtcAccountDerivationMocks(
  mockServer: Mockttp,
  bitcoinNode: BitcoinNode,
) {
  return [
    await mockFeatureFlags(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    ...(await mockTokensV2SupportedNetworks(mockServer)),
    await mockTokensV3Assets(mockServer),
    ...(await proxyBitcoinBlockchainCalls(mockServer, bitcoinNode)),
  ];
}

describe('Bitcoin account derivation', function (this: Suite) {
  this.timeout(240_000);

  it("shows Account 1's Bitcoin address on the Receive page", async function () {
    let bitcoinNode: BitcoinNode;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: [{ type: 'bitcoin' }],
        afterLocalNodesStart: ({ localNodes }: { localNodes: unknown[] }) => {
          bitcoinNode = localNodes.find(
            (node): node is BitcoinNode => node instanceof BitcoinNode,
          ) as BitcoinNode;
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockBtcAccountDerivationMocks(mockServer, bitcoinNode),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');

        const homepage = new HomePage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.checkPageIsLoaded();
        await homepage.clickOnReceiveButton('default');

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkAddressIsDisplayed(
          shortenAddress(EXPECTED_BTC_ADDRESSES_BY_INDEX[0]),
        );
      },
    );
  });

  it('derives Bitcoin addresses while adding multichain accounts from Account 1 to Account 8', async function () {
    let bitcoinNode: BitcoinNode;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: [{ type: 'bitcoin' }],
        afterLocalNodesStart: ({ localNodes }: { localNodes: unknown[] }) => {
          bitcoinNode = localNodes.find(
            (node): node is BitcoinNode => node instanceof BitcoinNode,
          ) as BitcoinNode;
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockBtcAccountDerivationMocks(mockServer, bitcoinNode),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.waitUntilSyncingIsCompleted();

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expectedAddress = EXPECTED_BTC_ADDRESSES_BY_INDEX[index];

          if (index > 0) {
            await waitUntilAccountTreeSyncIdle(driver);
            await accountList.addMultichainAccount();
            await accountList.checkMultichainAccountNameDisplayed(accountLabel);
          }

          await accountList.openMultichainAccountMenu({ accountLabel });
          await accountList.clickMultichainAccountMenuItem('Addresses');
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkAddressIsDisplayedForNetwork({
            networkAddress: shortenAddress(expectedAddress),
            networkName: 'Bitcoin',
          });
          await addressList.clickCopyButtonForNetworkAndAssertClipboard({
            expectedAddress,
            networkName: 'Bitcoin',
          });
          await addressList.goBack();
        }

        await accountList.closeMultichainAccountsPage();
      },
    );
  });

  it('aligns Bitcoin addresses for 8 existing multichain account groups', async function () {
    let bitcoinNode: BitcoinNode;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: [{ type: 'bitcoin' }],
        afterLocalNodesStart: ({ localNodes }: { localNodes: unknown[] }) => {
          bitcoinNode = localNodes.find(
            (node): node is BitcoinNode => node instanceof BitcoinNode,
          ) as BitcoinNode;
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockBtcAccountDerivationMocks(mockServer, bitcoinNode),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await addAccounts({
          driver,
          count: 7,
          onBeforeAdd: () => waitUntilAccountTreeSyncIdle(driver),
          onAfterAdd: ({ label }) =>
            new AccountListPage(driver).checkMultichainAccountNameDisplayed(
              label,
            ),
        });
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.waitUntilSyncingIsCompleted();

        for (let index = 0; index < 8; index += 1) {
          const expectedAddress = EXPECTED_BTC_ADDRESSES_BY_INDEX[index];
          await accountList.openMultichainAccountMenu({
            accountLabel: `Account ${index + 1}`,
          });
          await accountList.clickMultichainAccountMenuItem('Addresses');
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkAddressIsDisplayedForNetwork({
            networkAddress: shortenAddress(expectedAddress),
            networkName: 'Bitcoin',
          });
          await addressList.clickCopyButtonForNetworkAndAssertClipboard({
            expectedAddress,
            networkName: 'Bitcoin',
          });
          await addressList.goBack();
        }

        await accountList.closeMultichainAccountsPage();
      },
    );
  });

  it('discovers Bitcoin accounts through Account 5 when each account has assets', async function () {
    let bitcoinNode: BitcoinNode;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        localNodeOptions: [
          {
            type: 'bitcoin',
            options: {
              accounts: EXPECTED_BTC_ADDRESSES_BY_INDEX.slice(0, 5).map(
                (address, index) => ({
                  address,
                  scriptPubKey: EXPECTED_BTC_SCRIPT_PUBKEYS_BY_INDEX[index],
                }),
              ),
            },
          },
        ],
        afterLocalNodesStart: ({ localNodes }: { localNodes: unknown[] }) => {
          bitcoinNode = localNodes.find(
            (node): node is BitcoinNode => node instanceof BitcoinNode,
          ) as BitcoinNode;
        },
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockBtcAccountDerivationMocks(mockServer, bitcoinNode),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.checkPageIsLoaded();
        await homepage.checkHasAccountSyncingSyncedAtLeastOnce();
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.waitUntilSyncingIsCompleted();

        for (let index = 0; index < 5; index += 1) {
          const expectedAddress = EXPECTED_BTC_ADDRESSES_BY_INDEX[index];
          await accountList.openMultichainAccountMenu({
            accountLabel: `Account ${index + 1}`,
          });
          await accountList.clickMultichainAccountMenuItem('Addresses');
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkAddressIsDisplayedForNetwork({
            networkAddress: shortenAddress(expectedAddress),
            networkName: 'Bitcoin',
          });
          await addressList.clickCopyButtonForNetworkAndAssertClipboard({
            expectedAddress,
            networkName: 'Bitcoin',
          });
          await addressList.goBack();
        }

        await accountList.checkMultichainAccountNameNotDisplayed('Account 6');
        await accountList.closeMultichainAccountsPage();
      },
    );
  });
});
