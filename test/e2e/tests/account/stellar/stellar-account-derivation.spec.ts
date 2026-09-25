import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../../page-objects/flows/onboarding.flow';
import {
  assertStellarAddressesForAccounts,
  waitUntilAccountTreeSyncIdle,
} from '../../../page-objects/flows/stellar-account-derivation.flow';
import { selectStellarNetwork } from '../../../page-objects/flows/stellar-network.flow';
import AccountListPage from '../../../page-objects/pages/accounts/list-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { Driver } from '../../../webdriver/driver';
import {
  STELLAR_BIP44_FLAGS,
  STELLAR_MANIFEST_FLAGS,
  mockStellarAccountDerivationMocks,
  mockStellarAccountDiscoveryMocks,
} from '../../stellar/mocks/common-stellar';

const TOTAL_HD_ACCOUNTS = 4;
const DISCOVERED_ACCOUNTS = 5;

/**
 * Stellar HD address derivation E2E.
 *
 * Horizon / Soroban RPC are mocked (no local node / seeder). Receive,
 * quick-copy, and QR are skipped — Addresses + clipboard already prove
 * derivation.
 *
 * Coverage map:
 * - incremental add 1-N: add Accounts 2-N, then assert Addresses for all
 * - Account discovery 1-5: Soroban RPC-activated accounts (getLedgerEntries), no manual add — automatic discovery; Account 6 absent
 */
describe('Stellar account derivation', function (this: Suite) {
  this.timeout(360_000);

  it(`derives Stellar addresses for Accounts 1-${TOTAL_HD_ACCOUNTS} on the Addresses modal`, async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: {
              stellarAccounts: STELLAR_BIP44_FLAGS.stellarAccounts,
            },
          })
          .build(),
        manifestFlags: STELLAR_MANIFEST_FLAGS,
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) =>
          mockStellarAccountDerivationMocks(mockServer),
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
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: {
              stellarAccounts: STELLAR_BIP44_FLAGS.stellarAccounts,
            },
          })
          .build(),
        manifestFlags: STELLAR_MANIFEST_FLAGS,
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) =>
          mockStellarAccountDiscoveryMocks(mockServer, {
            throughAccountCount: DISCOVERED_ACCOUNTS,
          }),
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
