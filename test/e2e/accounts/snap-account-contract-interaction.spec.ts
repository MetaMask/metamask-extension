/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import {
  confirmDepositTransaction,
  createDepositTransaction,
  TestSuiteArguments,
} from '../tests/confirmations/transactions/shared';
import GanacheContractAddressRegistry from '../seeder/ganache-contract-address-registry';

const {
  multipleGanacheOptionsForType2Transactions,
  withFixtures,
  logInWithBalanceValidation,
  openDapp,
  WINDOW_TITLES,
  locateAccountBalanceDOM,
} = require('../helpers');
const {
  scrollAndConfirmAndAssertConfirm,
} = require('../tests/confirmations/helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('//name me', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  it(`Opens the contract`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerSnapAccountConnectedToTestDapp()
          .withPreferencesController({
            preferences: {
              redesignedConfirmationsEnabled: true,
              isRedesignedConfirmationsDeveloperEnabled: true,
            },
          })
          .withKeyringControllerSnapAccountVault()
          .withPreferencesControllerSnapAccountIdentities()
          .withAccountsControllerAdditionalSnapAccount()
          .build(),
        ganacheOptions: multipleGanacheOptionsForType2Transactions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        contractRegistry,
        ganacheServer,
      }: TestSuiteArguments) => {
        const contractAddress = await (
          contractRegistry as GanacheContractAddressRegistry
        ).getContractAddress(smartContract);

        await logInWithBalanceValidation(driver);
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement({
          tag: 'Button',
          text: 'Snap Account 1',
        });
        await driver.assertElementNotPresent({
          tag: 'header',
          text: 'Select an account',
        });
        await openDapp(driver, contractAddress);

        await createDepositTransaction(driver);
        await driver.delay(7000);
        await confirmDepositTransaction(driver);

        // calls and confirms a contract method where ETH is received
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement('#withdrawButton');
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(2)',
        );
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-0 ETH',
        });

        // renders the correct ETH balance
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await locateAccountBalanceDOM(driver, ganacheServer);
      },
    );
  });
});
