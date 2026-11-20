import {
  DEFAULT_STELLAR_ADDRESS,
  HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
} from '../../../constants';
import { login } from '../../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import { assertAddressAtIndex } from '../../../page-objects/flows/account-list.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import AccountAddressListPage from '../../../page-objects/pages/accounts/address-list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { shortenAddress } from '../../../../../ui/helpers/utils/util';
import { Driver } from '../../../webdriver/driver';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { buildStellarFixture } from '../../stellar/mocks/common-stellar';
import {
  STELLAR_NETWORK_NAME,
  XLM_FIAT_DISPLAY,
} from '../../stellar/mocks/stellar-constants';

/**
 * Stellar HD address derivation E2E cluster.
 *
 * Coverage map (mirrors Tron account cluster layout under `tests/account/`):
 * - Addresses modal: Account 1 Stellar address is shown / copyable
 * - Receive page: Account 1 Stellar address is shown
 * - Onboarding SRP import: Stellar address is derived for Account 1
 */
describe('Stellar account derivation', function () {
  it("shows Account 1's Stellar address on the Addresses modal", async function () {
    await withStellarFixtures(
      {
        horizonOptions: { unfunded: true },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        await assertAddressAtIndex(driver, {
          index: 0,
          networkName: STELLAR_NETWORK_NAME,
          expectedAddress: DEFAULT_STELLAR_ADDRESS,
        });
      },
    );
  });

  it("shows Account 1's Stellar address on the Receive page", async function () {
    await withStellarFixtures(
      {
        horizonOptions: { unfunded: true },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        const homepage = new HomePage(driver);
        const addressList = new AccountAddressListPage(driver);

        await homepage.checkPageIsLoaded();
        await homepage.clickOnReceiveButton();

        await addressList.checkPageIsLoaded();
        await addressList.checkNetworkAddressIsDisplayedForNetwork({
          networkName: STELLAR_NETWORK_NAME,
          networkAddress: shortenAddress(DEFAULT_STELLAR_ADDRESS),
        });
      },
    );
  });

  it('derives a Stellar address after importing an SRP', async function () {
    await withStellarFixtures(
      {
        fixtures: buildStellarFixture({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({
          driver,
          fillSrpWordByWord: true,
        });

        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        // Account-tree identity sync is not mocked here and is not required for
        // Stellar derivation; switchToNetworkFromNetworkSelect selects Stellar after snap account is ready.
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        // Refresh re-hydrates UI after Snap account alignment / Horizon sync.
        // Fresh onboarding defaults the homepage primary balance to fiat.
        await homepage.refreshPage();
        await homepage.checkExpectedBalanceIsDisplayed({
          expectedBalance: XLM_FIAT_DISPLAY,
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });

        const accountList = new AccountListPage(driver);
        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();

        await assertAddressAtIndex(driver, {
          index: 0,
          networkName: STELLAR_NETWORK_NAME,
          expectedAddress: DEFAULT_STELLAR_ADDRESS,
        });
      },
    );
  });
});
