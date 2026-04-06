import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { completeImportSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  DEFAULT_TRON_ADDRESS,
  TRON_ACCOUNT_INDEX_0,
  TRON_ACCOUNT_INDEX_1,
  TRON_ACCOUNT_INDEX_3,
  TRON_ACCOUNT_INDEX_4,
} from '../../constants';
import {
  mockTronApisMultiAccount,
  mockTronApisDiscovery,
} from './mocks/common-tron';

describe('Tron account generation', function (this: Suite) {
  it('creates a Tron account automatically on network switch', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockTronApisMultiAccount(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        // After switching to Tron, account 1's Tron address should be shown
        // with 0 TRX (wildcard mock returns empty data)
        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });
      },
    );
  });

  it('first generated Tron address matches expected address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockTronApisMultiAccount(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });

        // Verify the account address matches the expected Tron address derived
        // from the test SRP at index 0
        const address = await homePage.getAccountAddress();
        if (address !== DEFAULT_TRON_ADDRESS) {
          throw new Error(
            `Expected Tron address ${DEFAULT_TRON_ADDRESS}, got ${address}`,
          );
        }
      },
    );
  });

  it('can create a second account group and switch to its Tron account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockTronApisMultiAccount(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        // Open account menu and add a second account group
        await homePage.headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();

        // Select the new Tron account (index 1 = "Tron Account 2")
        await accountListPage.selectAccount('Tron Account 2');

        // Switch to the Tron network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        // The second Tron account should show 0 TRX
        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });
      },
    );
  });

  it('can create up to 5 account groups with Tron accounts', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockTronApisMultiAccount(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const accountListPage = new AccountListPage(driver);

        // Open account menu once, then add 4 more account groups (total 5)
        await homePage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();

        for (let i = 0; i < 4; i++) {
          await accountListPage.addMultichainAccount();
        }

        // Verify the 5th Tron account was created (Tron Account 5)
        // by selecting it and switching to Tron network
        await accountListPage.selectAccount('Tron Account 5');

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });
      },
    );
  });

  // ─── Discovery tests ─────────────────────────────────────────────────────────
  //
  // These tests use the onboarding flow (`onboarding: true`) so that
  // `discoverAndCreateAccounts()` is triggered, exercising both the
  // snap-level discoverAccounts path AND the alignment path that fills
  // missing Tron accounts at every group index EVM has already reached.

  it('discovery: alignment auto-creates Tron account on fresh SRP import', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: '12.19.0',
            },
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
        },
        testSpecificMock: (mockServer) =>
          // Wildcard mock: Tron API returns empty for all addresses —
          // no snap discovery, but alignment creates Tron at index 0.
          mockTronApisMultiAccount(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        // After onboarding, the EVM account at group-index 0 already exists
        // (created during keyring import). Alignment runs and creates a matching
        // Tron account at index 0.
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        // Wildcard returns zero balance — Tron account exists but has 0 TRX
        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });

        // Verify the derived address matches the expected index-0 address
        const homePage = new HomePage(driver);
        const address = await homePage.getAccountAddress();
        if (address !== TRON_ACCOUNT_INDEX_0) {
          throw new Error(
            `Expected Tron address at index 0 to be ${TRON_ACCOUNT_INDEX_0}, got ${address}`,
          );
        }
      },
    );
  });

  it('discovery: Tron snap discovers account with on-chain activity at index 1', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: '12.19.0',
            },
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
          },
        },
        testSpecificMock: (mockServer) =>
          // Return on-chain activity for index-1 address so the snap's
          // discoverAccounts() call reports it as found.  All other addresses
          // fall through to the wildcard and return empty.
          mockTronApisDiscovery(mockServer, [TRON_ACCOUNT_INDEX_1]),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });

        // After onboarding:
        //  • EVM (index 0) already exists from keyring import → nextGroupIndex = 1
        //  • Tron snap tries index 1, finds activity → discovered, nextGroupIndex = 2
        //  • Alignment fills index 0 (Tron not yet there)
        //  • Result: Tron accounts at both index 0 and index 1

        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();

        // Two Tron accounts should be in the list
        await accountListPage.checkNumberOfAvailableAccounts(2);

        // Select "Tron Account 2" (index 1 — the snap-discovered one) and verify
        await accountListPage.selectAccount('Tron Account 2');

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '0 TRX' });

        const address = await homePage.getAccountAddress();
        if (address !== TRON_ACCOUNT_INDEX_1) {
          throw new Error(
            `Expected Tron address at index 1 to be ${TRON_ACCOUNT_INDEX_1}, got ${address}`,
          );
        }
      },
    );
  });

  it('discovery: alignment fills gap indices when Tron has activity at accounts 1, 4, and 5', async function () {
    // This test verifies that when group indices 0–4 are all present (via manual
    // creation simulating EVM multi-account discovery), Tron accounts are
    // correctly aligned at ALL indices — including "gap" indices 2 and 3 where
    // Tron had no on-chain activity.
    //
    // "Accounts 1, 4, 5" refers to Tron Account 1 (index 0), Tron Account 4
    // (index 3), and Tron Account 5 (index 4), the non-contiguous subset that
    // would be snap-discovered if EVM drove the high-water mark high enough.
    // Alignment ensures accounts 2 and 3 (indices 1 and 2) also exist.
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer) =>
          mockTronApisMultiAccount(mockServer),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        // Create 4 additional account groups (total 5: indices 0–4)
        await homePage.headerNavbar.openAccountMenu();
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        for (let i = 0; i < 4; i++) {
          await accountListPage.addMultichainAccount();
        }

        // Switch to Tron — alignment should have created Tron accounts at ALL 5 indices
        const networkManager = new NetworkManager(driver);

        // Verify account 1 (index 0): expected address TRON_ACCOUNT_INDEX_0
        await accountListPage.selectAccount('Tron Account 1');
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');
        let address = await homePage.getAccountAddress();
        if (address !== TRON_ACCOUNT_INDEX_0) {
          throw new Error(
            `Tron Account 1: expected ${TRON_ACCOUNT_INDEX_0}, got ${address}`,
          );
        }

        // Verify account 4 (index 3): expected address TRON_ACCOUNT_INDEX_3
        await homePage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.selectAccount('Tron Account 4');
        address = await homePage.getAccountAddress();
        if (address !== TRON_ACCOUNT_INDEX_3) {
          throw new Error(
            `Tron Account 4: expected ${TRON_ACCOUNT_INDEX_3}, got ${address}`,
          );
        }

        // Verify account 5 (index 4): expected address TRON_ACCOUNT_INDEX_4
        await homePage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.selectAccount('Tron Account 5');
        address = await homePage.getAccountAddress();
        if (address !== TRON_ACCOUNT_INDEX_4) {
          throw new Error(
            `Tron Account 5: expected ${TRON_ACCOUNT_INDEX_4}, got ${address}`,
          );
        }
      },
    );
  });
});
