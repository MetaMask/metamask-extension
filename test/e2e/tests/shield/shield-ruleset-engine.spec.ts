import { MockttpServer } from 'mockttp';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import { WINDOW_TITLES } from '../../constants';
import PersonalSignConfirmation from '../../page-objects/pages/confirmations/redesign/personal-sign-confirmation';
import {
  BASE_SHIELD_SUBSCRIPTION,
  SHIELD_PRICING_DATA,
  SHIELD_USER_EVENTS_RESPONSE,
  SHIELD_ELIGIBILITY_DATA,
} from '../../helpers/shield/constants';

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

async function mockShieldSubscriptionWithCoverage(
  mockServer: MockttpServer,
  coverageStatus: 'covered' | 'not_covered' = 'covered',
) {
  const userStorageMockttpController = new UserStorageMockttpController();
  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
  );

  return [
    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/subscriptions')
      .always()
      .thenJson(200, {
        customerId: 'test_customer_id',
        subscriptions: [BASE_SHIELD_SUBSCRIPTION],
        trialedProducts: ['shield'],
      }),

    await mockServer
      .forGet('https://subscription.dev-api.cx.metamask.io/v1/pricing')
      .thenJson(200, SHIELD_PRICING_DATA),

    await mockServer
      .forGet(
        'https://subscription.dev-api.cx.metamask.io/v1/subscriptions/eligibility',
      )
      .always()
      .thenJson(200, SHIELD_ELIGIBILITY_DATA),

    await mockServer
      .forPost('https://subscription.dev-api.cx.metamask.io/v1/user-events')
      .thenJson(200, SHIELD_USER_EVENTS_RESPONSE),

    await mockServer
      .forPost(
        'https://ruleset-engine.dev-api.cx.metamask.io/v1/transaction/coverage/init',
      )
      .always()
      .thenJson(200, {
        requestId: 'test-transaction-request-id',
      }),

    await mockServer
      .forPost(
        'https://ruleset-engine.dev-api.cx.metamask.io/v1/transaction/coverage/result',
      )
      .always()
      .thenCallback(() => {
        const status = coverageStatus === 'covered' ? 'covered' : 'not_covered';
        const reasonCode = coverageStatus === 'covered' ? 'E101' : 'E104'; // E101 for covered, E104 for not covered

        return {
          statusCode: 200,
          json: {
            status,
            reasonCode,
            message: status,
          },
        };
      }),

    await mockServer
      .forPost(
        'https://ruleset-engine.dev-api.cx.metamask.io/v1/signature/coverage/init',
      )
      .always()
      .thenJson(200, {
        requestId: 'test-signature-request-id',
      }),

    await mockServer
      .forPost(
        'https://ruleset-engine.dev-api.cx.metamask.io/v1/signature/coverage/result',
      )
      .always()
      .thenCallback(() => {
        const status = coverageStatus === 'covered' ? 'covered' : 'not_covered';
        const reasonCode = coverageStatus === 'covered' ? 'E101' : 'E104'; // E101 for covered, E104 for not covered

        return {
          statusCode: 200,
          json: {
            status,
            reasonCode,
            message: status,
          },
        };
      }),
  ];
}

describe('Shield Ruleset Engine Tests', function () {
  it('should show covered status for swap transaction when shield subscription is active', async function () {
    await withFixtures(
      {
        fixtures: createShieldFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: MockttpServer) =>
          mockShieldSubscriptionWithCoverage(mockServer, 'covered'),
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
        testSpecificMock: (mockServer: MockttpServer) =>
          mockShieldSubscriptionWithCoverage(mockServer, 'not_covered'),
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
        testSpecificMock: (mockServer: MockttpServer) =>
          mockShieldSubscriptionWithCoverage(mockServer, 'covered'),
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
        testSpecificMock: (mockServer: MockttpServer) =>
          mockShieldSubscriptionWithCoverage(mockServer, 'not_covered'),
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
