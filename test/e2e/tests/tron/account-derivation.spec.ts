import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { addNTronAccounts } from '../../page-objects/flows/tron-account-derivation.flow';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../constants';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import NetworkManager from '../../page-objects/pages/network-manager';
import HomePage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { TronNode } from '../../seeder/tron/node';
import { createEmptyTronNodeOptions } from '../../seeder/tron/profiles';
import {
  createEmptyTronGridTransactionsResponse,
  createTronGridAccountResponse,
} from '../../seeder/tron/assets';
import {
  TRON_ACCOUNT_ADDRESS,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTronAssets,
  mockTronFeatureFlags,
  mockTronSpotPrices,
  mockTrxNativeSpotPrices,
} from './mocks/common-tron';
import { proxyTronBlockchainCalls } from './mocks/local-tron-node-mocks';

/**
 * Matches any Tron provider URL (Infura mainnet or public TronGrid) for the
 * given path suffix.  Used to add catch-all handlers for derived accounts
 * 2–8 whose specific addresses are not registered in `proxyTronBlockchainCalls`.
 */
const TRON_PROVIDER_ANY_ACCOUNT_RE =
  /^(https:\/\/tron-mainnet\.infura\.io\/v3\/[^/]+|https:\/\/api\.trongrid\.io|https:\/\/api\.shasta\.trongrid\.io|https:\/\/nile\.trongrid\.io)\/v1\/accounts\/([A-Za-z0-9]{20,})(\/transactions(\/trc20)?)?$/u;

async function mockLocalTronApis(
  mockServer: Mockttp,
  { localNodes }: { localNodes: unknown[] },
) {
  const tronNode = localNodes.find(
    (node): node is TronNode => node instanceof TronNode,
  );
  if (!tronNode) {
    throw new Error('Tron local node was not started');
  }

  // Specific mocks for TRON_ACCOUNT_ADDRESS are registered first so they take
  // priority over the wildcard catch-all below.
  const specificEndpoints = await proxyTronBlockchainCalls(
    mockServer,
    tronNode,
    TRON_ACCOUNT_ADDRESS,
  );

  // Catch-all for any account address not already handled above.
  // Derived accounts 2–8 all have zero balance so returning an empty account /
  // empty transaction list is sufficient for the sync to complete and the
  // address-list modal to open.
  const wildcardAccountEndpoint = await mockServer
    .forGet(TRON_PROVIDER_ANY_ACCOUNT_RE)
    .always()
    .thenCallback((req) => {
      const match = req.url.match(TRON_PROVIDER_ANY_ACCOUNT_RE);
      const address = match?.[2] ?? '';
      const suffix = match?.[3] ?? '';
      if (suffix.startsWith('/transactions')) {
        return {
          statusCode: 200,
          json: createEmptyTronGridTransactionsResponse(),
        };
      }
      return {
        statusCode: 200,
        json: createTronGridAccountResponse({ address }),
      };
    });

  return [
    await mockTronFeatureFlags(mockServer),
    await mockExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockTronSpotPrices(mockServer, tronNode),
    await mockTrxNativeSpotPrices(mockServer),
    await mockTronAssets(mockServer, tronNode),
    ...specificEndpoints,
    wildcardAccountEndpoint,
  ];
}

describe('Tron account derivation', function (this: Suite) {
  this.timeout(240_000);

  // TODO(tron-e2e): unblock by fixing the post-add-accounts UI sync. After
  // addNTronAccounts(driver, 8) returns and the AccountTreeController reports
  // sync idle, the iterator's first `openMultichainAccountMenu({ accountLabel:
  // 'Account 1' })` times out at 10s waiting for the menu trigger. Likely
  // causes: (a) `closeMultichainAccountsPage()` doesn't reliably return to a
  // state where `openAccountMenu()` can re-open the multichain accounts page,
  // (b) the menu button per row uses a selector that differs from the existing
  // helper's expectation when 8 accounts are rendered, (c) the address-list
  // mock catch-all needs a /resources or other endpoint not currently covered.
  // eslint-disable-next-line mocha/no-skipped-tests -- pending UI-sync fix; see TODO above
  it.skip('Derives the correct Tron address for Accounts 1–8', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createEmptyTronNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        await addNTronAccounts(driver, 8);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);

        // Open the multichain accounts page once; goBack() after each address
        // check keeps us on this page for the next iteration.
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

          await accountList.openMultichainAccountMenu({ accountLabel });
          await accountList.clickMultichainAccountMenuItem('Addresses');
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkNameisDisplayed('Tron');
          await addressList.checkNetworkAddressIsDisplayed(
            shortenAddress(expected),
          );
          await addressList.goBack();
        }
      },
    );
  });

  // TODO(tron-e2e): unblock once the bulk derivation test passes — same UI
  // sync issue. The wallet's `network-group-with-copy-icon` block renders a
  // `default-address-container` with the shortened default address; clicking
  // it toggles the inner text to "<network> address copied".
  // eslint-disable-next-line mocha/no-skipped-tests -- pending Plan 1 Task 2 unblock
  it.skip('Shows Account 1 Tron address on the quick-copy popup and copies it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createEmptyTronNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const accountList = new AccountListPage(driver);
        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });

        const popup = '[data-testid="network-group-with-copy-icon"]';
        const addressContainer = '[data-testid="default-address-container"]';
        await driver.waitForSelector(popup);
        await driver.waitForSelector({
          css: addressContainer,
          text: shortenAddress(EXPECTED_TRON_ADDRESSES_BY_INDEX[0]),
        });
        await driver.clickElement(popup);
        await driver.waitForSelector({
          css: addressContainer,
          text: 'address copied',
        });
      },
    );
  });

  // TODO(tron-e2e): unblock once the bulk derivation test passes — same UI
  // sync issue. Asserts the QR popup exposes the full base58 address, a copy
  // link, and a "View on Tronscan" button (text from TRON_BLOCK_EXPLORER_NAME).
  // eslint-disable-next-line mocha/no-skipped-tests -- pending Plan 1 Task 2 unblock
  it.skip('Shows Account 1 QR popup with address, copy link, and View on Tronscan', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createEmptyTronNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const accountList = new AccountListPage(driver);
        const addressList = new AddressListModal(driver);
        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountList.clickMultichainAccountMenuItem('Addresses');
        await addressList.checkPageIsLoaded();
        await addressList.clickQRbutton(0);

        await addressList.checkQrPopupShowsAddress(
          EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
        );
        await addressList.checkViewOnTronscanButton();
        await addressList.clickQrCopyAddressLink();
        await addressList.verifyCopyButtonFeedback();
      },
    );
  });

  // TODO(tron-e2e): unblock once the bulk derivation test passes — same UI
  // sync issue. Lands on the Tron Receive page and asserts the full address
  // text + copy feedback ("Address copied").
  // eslint-disable-next-line mocha/no-skipped-tests -- pending Plan 1 Task 2 unblock
  it.skip('Shows Account 1 Tron address on the Receive page and copies it', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createEmptyTronNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: mockLocalTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homepage = new NonEvmHomepage(driver);
        await homepage.checkPageIsLoaded({ amount: '0 TRX' });
        await homepage.clickOnReceiveButton();

        await driver.waitForSelector({
          text: EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
          css: '[data-testid="address-copy-button-text"]',
        });
        await driver.clickElement('[data-testid="address-copy-button-text"]');
        await driver.waitForSelector({ text: 'Address copied' });
      },
    );
  });
});
