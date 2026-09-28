import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { login } from '../../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import {
  addMultipleAccounts,
  waitUntilAccountTreeSyncIdle,
} from '../../../page-objects/flows/add-account.flow';
import {
  assertAccountNetworkAddress,
  assertAccountNetworkAddresses,
} from '../../../page-objects/flows/account-list.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import { selectTronNetwork } from '../../../page-objects/flows/tron-network.flow';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../../constants';
import { EMPTY_TRON_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import { buildDiscoveryAccountsThrough } from './utils/buildDiscoveryAccountsThrough';
import { buildExpectedTronAccountsThrough } from './utils/buildExpectedTronAccountsThrough';

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
 */
describe('Tron account derivation', function (this: Suite) {
  // Measured locally: ~100s for the 8-account add/assert tests and ~70s for
  // discovery. 180s leaves headroom for slower CI machines; the 85s default
  // is not enough for the first two tests.
  this.timeout(180_000);

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

          await assertAccountNetworkAddress({
            driver,
            accountLabel,
            networkName: 'Tron',
            expectedAddress: EXPECTED_TRON_ADDRESSES_BY_INDEX[index],
          });
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

        await addMultipleAccounts({
          driver,
          numberOfAccounts: 7,
          beforeAddAccount: () => waitUntilAccountTreeSyncIdle(driver),
        });

        await selectTronNetwork(driver);

        await assertAccountNetworkAddresses({
          driver,
          accounts: buildExpectedTronAccountsThrough(8),
          networkName: 'Tron',
        });
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

        await assertAccountNetworkAddresses({
          driver,
          accounts: buildExpectedTronAccountsThrough(5),
          networkName: 'Tron',
          absentAccountLabel: 'Account 6',
        });
      },
    );
  });
});
