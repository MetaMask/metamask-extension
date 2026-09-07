import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { login } from '../../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import {
  waitUntilAccountTreeSyncIdle,
  addNHdAccountsForTronDerivation,
  assertTronAddressAtIndex,
  assertTronAddressesForAccounts,
} from '../../../page-objects/flows/account-derivation.flow';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../../constants';
import { shortenAddress } from '../../../../../ui/helpers/utils/util';
import HomePage from '../../../page-objects/pages/home/homepage';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import AccountAddressListPage from '../../../page-objects/pages/accounts/address-list-page';
import { selectTronNetwork } from '../../../page-objects/flows/tron-network.flow';
import { EMPTY_TRON_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import { buildDiscoveryAccountsThrough } from './utils/buildDiscoveryAccountsThrough';

/**
 * Tron HD address derivation E2E cluster (WPN-685).
 *
 * Two concepts:
 * - Tron address derivation (automatic): a Tron account is derived for each HD index once Tron is enabled.
 * - HD account groups (manual in most tests): a fresh wallet only has Account 1; Accounts 2-8 are added via "Add account" or asset discovery.
 *
 * Coverage map:
 * - incremental add 1-8: add + assert per step — derivation correct at each new HD index
 * - 8 existing groups: add 8, then enable Tron — retroactive alignment when network enabled later
 * - asset discovery 1-5: mocked txs, no manual add — automatic discovery; Account 6 absent
 * - quick-copy / QR / Receive: add 8 upfront — Tron address on each surface for all indices
 */
describe('Tron account derivation', function (this: Suite) {
  this.timeout(240_000);

  it('derives Tron addresses while adding multichain accounts from Account 1 to Account 8', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        includeAnvil: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);

        // Open account menu to let the UI sync complete
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.waitUntilSyncingIsCompleted();

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;

          if (index > 0) {
            await waitUntilAccountTreeSyncIdle(driver);
            await accountList.addMultichainAccount();
            await accountList.checkMultichainAccountNameDisplayed(accountLabel);
          }

          await assertTronAddressAtIndex(driver, index);
        }

        await accountList.closeMultichainAccountsPage();
      },
    );
  });

  it('aligns Tron addresses for 8 existing multichain account groups', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        includeAnvil: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        await addNHdAccountsForTronDerivation(driver, 8);

        await selectTronNetwork(driver);

        await assertTronAddressesForAccounts(driver, 8);
      },
    );
  });

  it('discovers Tron accounts through Account 5 when each account has assets', async function () {
    await withTronFixtures(
      {
        accounts: buildDiscoveryAccountsThrough(5),
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        includeAnvil: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        await assertTronAddressesForAccounts(driver, 5, {
          absentAccountLabel: 'Account 6',
        });
      },
    );
  });

  it('copies each account Tron address from the quick-copy popup', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        includeAnvil: false,
        // To investigate why is this error appearing (#46623)
        ignoredConsoleErrors: ['[PerpsStreamManager] Failed to fetch account'],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);
        await addNHdAccountsForTronDerivation(driver, 8);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

          await homepage.headerNavbar.openAccountMenu();
          await accountList.checkPageIsLoaded();
          await accountList.selectAccount(accountLabel);
          await waitUntilAccountTreeSyncIdle(driver);

          await homepage.headerNavbar.clickNetworkAddresses();
          await addressList.checkQuickCopyPopoverIsLoaded();
          await addressList.checkQuickCopyAddressIsDisplayedForNetwork({
            networkName: 'Tron',
            networkAddress: shortenAddress(expected),
          });
          await addressList.clickQuickCopyButtonForNetwork({
            networkName: 'Tron',
            expectedAddress: expected,
          });

          // The quick-copy popover does not close when its trigger is
          // clicked again; move the pointer away (the popover is
          // hover-triggered) and start the next iteration clean.
          await homepage.headerNavbar.dismissNetworkAddressesPopover();
          await addressList.checkQuickCopyPopoverIsClosed();
        }
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- flaky clipboard copy in QR popup on CI; see #44165
  it.skip('shows Account 1 QR popup with address, copy link, and View on Tronscan', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        includeAnvil: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        await accountList.openMultichainAccountMenu({
          accountLabel: 'Account 1',
        });
        await accountList.clickMultichainAccountMenuItem('Addresses');
        await addressList.checkPageIsLoaded();
        await addressList.clickQRbuttonForNetwork('Tron');

        await addressList.checkQrPopupShowsAddress(
          EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
        );
        await addressList.checkViewOnTronscanButton();
        await addressList.clickQrCopyAddressLink(
          EXPECTED_TRON_ADDRESSES_BY_INDEX[0],
        );
      },
    );
  });

  it('copies each account Tron address from the Receive page', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        includeAnvil: false,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);
        await addNHdAccountsForTronDerivation(driver, 8);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);
        const addressList = new AccountAddressListPage(driver);

        for (let index = 0; index < 8; index += 1) {
          const accountLabel = `Account ${index + 1}`;
          const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

          await homepage.headerNavbar.openAccountMenu();
          await accountList.checkPageIsLoaded();
          await accountList.selectAccount(accountLabel);
          await waitUntilAccountTreeSyncIdle(driver);

          await homepage.checkPageIsLoaded();
          await homepage.clickOnReceiveButton();
          await addressList.checkPageIsLoaded();
          await addressList.checkNetworkAddressIsDisplayedForNetwork({
            networkName: 'Tron',
            networkAddress: shortenAddress(expected),
          });
          await addressList.clickCopyButtonForNetworkAndAssertClipboard({
            networkName: 'Tron',
            expectedAddress: expected,
          });
          await addressList.goBack();
        }
      },
    );
  });
});
