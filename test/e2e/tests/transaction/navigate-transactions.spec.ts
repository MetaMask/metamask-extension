import { Driver } from '../../webdriver/driver';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import { createDappTransaction } from '../../page-objects/flows/transaction';
import { withFixtures } from '../../helpers';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import HomePage from '../../page-objects/pages/home/homepage';

const TRANSACTION_COUNT = 4;

describe('Navigate transactions', function () {
  it('should navigate the unapproved transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(2, 4);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(3, 4);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(4, 4);

        await navigation.clickPreviousPage();
        await navigation.checkPageNumbers(3, 4);

        await navigation.clickPreviousPage();
        await navigation.checkPageNumbers(2, 4);

        await navigation.clickPreviousPage();
        await navigation.checkPageNumbers(1, 4);
      },
    );
  });

  it('should add a transaction while the confirm page is in focus', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesControllerTxSimulationsDisabled()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);

        await navigation.clickNextPage();
        await navigation.checkPageNumbers(2, 4);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const testDapp = new TestDapp(driver);
        await driver.openNewPage(DAPP_URL);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await navigation.checkPageNumbers(2, 5);
      },
    );
  });

  it('should reject and remove an unapproved transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);
        await navigation.clickFooterCancelButton();

        await navigation.checkPageNumbers(1, 3);
      },
    );
  });

  it('should confirm and remove an unapproved transaction', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);
        await navigation.clickFooterConfirmButton();

        await navigation.checkPageNumbers(1, 3);
      },
    );
  });

  it('should reject and remove all unapproved transactions', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPreferencesControllerTxSimulationsDisabled()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await createRedesignedMultipleTransactions(driver, TRANSACTION_COUNT);

        const navigation = new Confirmation(driver);
        await navigation.clickRejectAll();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkExpectedBalanceIsDisplayed('25');
      },
    );
  });
});

async function createRedesignedMultipleTransactions(
  driver: Driver,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    await createDappTransaction(driver);
  }

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.checkSendAmount('0.001 ETH');
}
