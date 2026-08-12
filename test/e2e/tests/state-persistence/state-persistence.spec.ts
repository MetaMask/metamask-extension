import { Mockttp } from 'mockttp';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import { assertAccountVisible } from '../../page-objects/flows/account-list.flow';
import { reloadAndUnlock } from '../../page-objects/flows/login.flow';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import {
  BASE_MANIFEST_TESTING_FLAGS,
  expectDataStateStorage,
  expectSplitStateStorage,
  pausePersistence,
  setLocalStorageFlags,
} from './helpers';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const NON_EVM_ACCOUNT_FLAG_OVERRIDES = [
  { bitcoinAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { solanaAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { tronAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  {
    enableMultichainAccounts: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
  {
    enableMultichainAccountsState2: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
];

async function mockFeatureFlagsWithoutNonEvmAccounts(mockServer: Mockttp) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  return [
    await mockServer
      .forGet(FEATURE_FLAGS_URL)
      .withQuery({
        client: 'extension',
        distribution: 'main',
        environment: 'dev',
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: [...prodFlags, ...NON_EVM_ACCOUNT_FLAG_OVERRIDES],
      })),
  ];
}

/**
 * Builds fixture options with consistent manifest testing flags.
 *
 * @param testContext - Mocha test context used to set the title.
 * @param manifestTestingOverrides - Optional manifest testing overrides.
 * @returns Options for withFixtures.
 */
const getFixtureOptions = (
  testContext: Mocha.Context,
  manifestTestingOverrides: Record<string, unknown> = {},
) => ({
  ignoredConsoleErrors: ['getSubscriptions'],
  title: testContext.test?.title,
  manifestFlags: {
    testing: {
      ...BASE_MANIFEST_TESTING_FLAGS,
      ...manifestTestingOverrides,
    },
  },
  testSpecificMock: mockFeatureFlagsWithoutNonEvmAccounts,
});

describe('State Persistence', function () {
  // Generous timeout: this flow onboards, adds an account, and reloads/unlocks
  // the extension twice while waiting for the split-state migration. On slower
  // CI (notably Firefox) the condition-based storage waits need headroom so the
  // suite-level timeout does not kill a run that is still making progress.
  this.timeout(180000);

  describe('split state', function () {
    it('should default to the split state storage', async function () {
      await withFixtures(getFixtureOptions(this), async ({ driver }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
          skipSRPBackup: true,
        });
        const homePage = new HomePage(driver);
        await homePage.ensurePageIsReady();
        await driver.delay(5000); // ensure things have settled before proceeding
        await expectSplitStateStorage(driver);
      });
    });

    it('should update from data state to split state', async function () {
      const accountName = 'Account 2';

      await withFixtures(
        getFixtureOptions(this, { storageKind: 'data' }),
        async ({ driver }) => {
          const headerNavbar = new HeaderNavbar(driver);
          const accountListPage = new AccountListPage(driver);

          await driver.delay(5000); // wait for any background migrations to finish
          await completeCreateNewWalletOnboardingFlow({
            driver,
            password: WALLET_PASSWORD,
            skipSRPBackup: true,
          });
          const homePage = new HomePage(driver);
          await homePage.ensurePageIsReady();
          await driver.delay(5000); // ensure things have settled before proceeding
          console.log('expectDataStateStorage');
          await expectDataStateStorage(driver);

          console.log('headerNavbar.checkPageIsLoaded');
          await headerNavbar.checkPageIsLoaded();
          console.log('headerNavbar.openAccountMenu');
          await headerNavbar.openAccountMenu();
          console.log('accountListPage.checkPageIsLoaded');
          await accountListPage.checkPageIsLoaded();
          console.log('accountListPage.addMultichainAccount');
          await accountListPage.addMultichainAccount();
          console.log('accountListPage.renameAccount');
          await accountListPage.closeMultichainAccountsPage();
          console.log('accountListPage.renameAccount');
          await assertAccountVisible(driver, accountName);

          // No fixed delay needed: expectDataStateStorage polls storage until
          // the data-state shape (incl. a populated KeyringController) is written.
          console.log('expectDataStateStorage');
          await expectDataStateStorage(driver);

          console.log('pausePersistence');
          await pausePersistence(driver);
          console.log('setLocalStorageFlags');
          await setLocalStorageFlags(driver);
          console.log('reloadAndUnlock');
          await reloadAndUnlock(driver);
          await driver.delay(5000); // wait for any background migrations to finish
          console.log('assertAccountVisible');
          await assertAccountVisible(driver, accountName);
          // No fixed delay needed: expectSplitStateStorage polls storage until
          // the split-state migration has fully written the split-state shape.
          console.log('expectSplitStateStorage');
          await expectSplitStateStorage(driver);

          console.log('reloadAndUnlock 2');
          await reloadAndUnlock(driver);
          await driver.delay(5000); // wait for any background migrations to finish
          console.log('assertAccountVisible 2');
          await assertAccountVisible(driver, accountName);
          console.log('expectSplitStateStorage 2');
          await expectSplitStateStorage(driver);
        },
      );
    });
  });
});
