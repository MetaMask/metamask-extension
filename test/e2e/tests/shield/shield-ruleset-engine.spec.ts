import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import { WINDOW_TITLES } from '../../constants';
import PersonalSignConfirmation from '../../page-objects/pages/confirmations/redesign/personal-sign-confirmation';
import { ShieldMockttpService } from '../../helpers/shield/mocks';

function createShieldFixture() {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
      },
    })
    .withTokensController({
      allTokens: {
        '0x1': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              symbol: 'WETH',
              decimals: 18,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
    })
    .withPermissionControllerConnectedToTestDapp()
    .withAppStateController({
      showShieldEntryModalOnce: null,
    });
}

describe('Shield Ruleset Engine Tests', function () {
  it('should show covered status for swap transaction when shield subscription is active', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const shieldMockttpService = new ShieldMockttpService();
          return shieldMockttpService.setup(server, {
            isActiveUser: true,
            coverageStatus: 'covered',
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();

        await transactionConfirmation.checkShieldCoverageIsCovered();

        await transactionConfirmation.clickFooterCancelButton();
      },
    );
  });

  it('should show not covered status for swap transaction when transaction is not eligible', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const shieldMockttpService = new ShieldMockttpService();
          return shieldMockttpService.setup(server, {
            isActiveUser: true,
            coverageStatus: 'not_covered',
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();

        await transactionConfirmation.checkShieldCoverageIsNotCovered();

        await transactionConfirmation.clickFooterCancelButton();
      },
    );
  });

  it('should show covered status for sign transaction when shield subscription is active', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const shieldMockttpService = new ShieldMockttpService();
          return shieldMockttpService.setup(server, {
            isActiveUser: true,
            coverageStatus: 'covered',
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await testDapp.clickPersonalSign();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const personalSignConfirmation = new PersonalSignConfirmation(driver);
        await personalSignConfirmation.checkPageIsLoaded();

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkShieldCoverageIsCovered();

        await personalSignConfirmation.clickFooterCancelButton();
      },
    );
  });

  it('should show not covered status for sign transaction when signature is not eligible', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const shieldMockttpService = new ShieldMockttpService();
          return shieldMockttpService.setup(server, {
            isActiveUser: true,
            coverageStatus: 'not_covered',
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
        ignoredConsoleErrors: [
          // Rive WASM loading fails in test environment due to XMLHttpRequest limitations
          'Could not load Rive WASM file',
          'XMLHttpRequest is not a constructor',
        ],
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.waitForNetworkAndDOMReady();

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await testDapp.clickPersonalSign();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const personalSignConfirmation = new PersonalSignConfirmation(driver);
        await personalSignConfirmation.checkPageIsLoaded();

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkShieldCoverageIsNotCovered();

        await personalSignConfirmation.clickFooterCancelButton();
      },
    );
  });
});
