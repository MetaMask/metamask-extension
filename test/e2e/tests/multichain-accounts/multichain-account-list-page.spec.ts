import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import { Driver } from '../../webdriver/driver';
import {
  DAPP_PATH,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  HARDWARE_WALLET_ACCOUNT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { mockSnapSimpleKeyringAndSite } from '../account/snap-keyring-site-mocks';
import { MOCK_ETH_CONVERSION_RATE, mockPriceApi } from '../tokens/utils/mocks';

const MUSD_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

async function mockEthMainnetAndMusd(mockServer: Mockttp) {
  return [
    ...(await mockPriceApi(mockServer, MOCK_ETH_CONVERSION_RATE)),
    await mockServer
      .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
      .always()
      .thenJson(200, {
        fullSupport: [],
        partialSupport: { balances: [] },
      }),
    await mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const assetIds = url.searchParams.getAll('assetIds').join(',');
        const results = [];

        if (assetIds.includes('eip155:1')) {
          results.push({
            assetId: 'eip155:1/slip44:60',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        if (
          assetIds
            .toLowerCase()
            .includes(`eip155:1/erc20:${MUSD_ADDRESS.toLowerCase()}`)
        ) {
          results.push({
            assetId: `eip155:1/erc20:${MUSD_ADDRESS}`,
            name: 'MUSD',
            symbol: 'MUSD',
            decimals: 6,
          });
        }

        return { statusCode: 200, json: { data: results } };
      }),
  ];
}

describe('Multichain Accounts - Multichain accounts list page', function (this: Suite) {
  it('displays wallet and accounts for hardware wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withLedgerAccount()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withAssetsController(
            {
              assetsBalance: {
                [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                  'eip155:1337/slip44:1': {
                    amount: '0',
                  },
                },
                [HARDWARE_WALLET_ACCOUNT_ID]: {
                  'eip155:1337/slip44:1': {
                    amount: '0',
                  },
                },
              },
            },
            { overwrite: true },
          )
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          expectedBalance: '0',
          waitForNonEvmAccounts: false,
        });
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu('Ledger');

        // Ensure that accounts within the wallets are displayed
        // The balance is not loaded for a non-selected account (which was never selected before)
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Wallet 1',
          account: 'Account 1',
          balance: '$0.00',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Ledger',
          account: 'Ledger 1',
          balance: '$0.00',
        });
        await accountListPage.checkMultichainAccountNameDisplayed('Account 1');
        await accountListPage.checkMultichainAccountNameDisplayed('Ledger 1');
      },
    );
  });

  it('displays wallet for Snap Keyring', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .withKeyringControllerMultiSRP()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withSnapsPrivacyWarningAlreadyShown()
          .withCurrencyController({
            currencyRates: {
              ETH: {
                conversionDate: Date.now(),
                conversionRate: MOCK_ETH_CONVERSION_RATE,
                usdConversionRate: MOCK_ETH_CONVERSION_RATE,
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: {
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        testSpecificMock: async (mockServer: Mockttp) => [
          ...(await mockEthMainnetAndMusd(mockServer)),
          ...(await mockSnapSimpleKeyringAndSite(mockServer)),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { expectedBalance: '$85,025.00' });

        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);
        await snapSimpleKeyringPage.createNewAccount();

        // Check snap account is displayed after adding the snap account.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);

        // Ensure that wallet information is displayed
        await accountListPage.checkWalletDisplayedInAccountListMenu('Wallet 1');
        await accountListPage.checkWalletDisplayedInAccountListMenu(
          'MetaMask Simple Snap Keyring',
        );

        // Ensure that an SSK account within the wallet is displayed
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'Wallet 1',
          account: 'Account 1',
          balance: '$85,025.00',
        });
        await accountListPage.checkMultichainAccountBalanceDisplayed({
          wallet: 'MetaMask Simple Snap Keyring',
          account: 'Snap Account 1',
          balance: '$0.00',
        });
        await accountListPage.checkMultichainAccountNameDisplayed('Account 1');
        await accountListPage.checkMultichainAccountNameDisplayed(
          'Snap Account 1',
        );
      },
    );
  });
});
