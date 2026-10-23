import { Suite } from 'mocha';
import { EXPECTED_STELLAR_ADDRESSES_BY_INDEX } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { login } from '../../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import {
  assertStellarAddressesForAccounts,
  waitUntilAccountTreeSyncIdle,
} from '../../../page-objects/flows/stellar-account-derivation.flow';
import { selectStellarNetwork } from '../../../page-objects/flows/stellar-network.flow';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { isDockerAvailable, StellarNode } from '../../../seeder/stellar/node';
import { Driver } from '../../../webdriver/driver';
import {
  requireSuiteStellarNode,
  withStellarFixture,
} from '../../stellar/fixtures/with-stellar-fixture';
import { STELLAR_BIP44_FLAGS } from '../../stellar/mocks/common-stellar';

const TOTAL_HD_ACCOUNTS = 4;
const DISCOVERED_ACCOUNTS = 5;

function buildStellarDerivationFixtures(onboarding = false) {
  return new FixtureBuilderV2({ onboarding })
    .withRemoteFeatureFlagController({
      remoteFeatureFlags: {
        stellarAccounts: STELLAR_BIP44_FLAGS.stellarAccounts,
      },
    })
    .build();
}

/**
 * Stellar HD address derivation E2E against `stellar/quickstart --local`.
 *
 * Quickstart starts once in `before` and is removed in `after`. Each `it`
 * borrows that node via `withStellarFixture` (Friendbot + Infura proxy).
 * Client-service mocks (flags, tokens, prices) stay in place — those are not
 * the chain.
 *
 * Coverage map (same as the mocked suite):
 * - incremental add 1-N: add Accounts 2-N, then assert Addresses for all
 * - Account discovery 1-5: Friendbot-activated accounts, no manual add — automatic discovery; Account 6 absent
 *
 * Skips when Docker is not available so the rest of the suite still runs.
 */
describe('Stellar account derivation - local Quickstart node', function (this: Suite) {
  this.timeout(600_000);

  let stellarNode: StellarNode | undefined;

  before(async function () {
    if (!(await isDockerAvailable())) {
      this.skip();
    }
    stellarNode = new StellarNode();
    await stellarNode.start();
  });

  after(async function () {
    await stellarNode?.quit();
  });

  it(`derives Stellar addresses for Accounts 1-${TOTAL_HD_ACCOUNTS} on the Addresses modal`, async function () {
    await withStellarFixture(
      {
        // Derivation is SRP-based; do not Friendbot-fund extra indexes or
        // discovery would auto-add them before the manual "Add account" loop.
        accounts: [],
        fixtures: buildStellarDerivationFixtures(),
        stellarNode: requireSuiteStellarNode(stellarNode),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectStellarNetwork(driver);

        const homepage = new HomePage(driver);
        const accountList = new AccountListPage(driver);

        await homepage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.waitUntilSyncingIsCompleted();

        for (let index = 1; index < TOTAL_HD_ACCOUNTS; index += 1) {
          await waitUntilAccountTreeSyncIdle(driver);
          await accountList.addMultichainAccount();
          await accountList.checkMultichainAccountNameDisplayed(
            `Account ${index + 1}`,
          );
        }

        await accountList.closeMultichainAccountsPage();
        await assertStellarAddressesForAccounts(driver, TOTAL_HD_ACCOUNTS);
      },
    );
  });

  it(`discovers Stellar accounts through Account ${DISCOVERED_ACCOUNTS} when each account is activated`, async function () {
    await withStellarFixture(
      {
        accounts: [
          ...EXPECTED_STELLAR_ADDRESSES_BY_INDEX.slice(0, DISCOVERED_ACCOUNTS),
        ],
        fixtures: buildStellarDerivationFixtures(true),
        stellarNode: requireSuiteStellarNode(stellarNode),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

        // Discovery can finish after the first sync flag flips; wait for the
        // highest expected group before asserting Addresses / absent Account 6.
        const accountList = new AccountListPage(driver);
        await homePage.headerNavbar.openAccountMenu();
        await accountList.checkPageIsLoaded();
        await accountList.checkMultichainAccountNameDisplayed(
          `Account ${DISCOVERED_ACCOUNTS}`,
        );
        await accountList.closeMultichainAccountsPage();

        await assertStellarAddressesForAccounts(driver, DISCOVERED_ACCOUNTS, {
          absentAccountLabel: 'Account 6',
        });
      },
    );
  });
});
