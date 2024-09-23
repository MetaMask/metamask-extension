import GanacheContractAddressRegistry from '../seeder/ganache-contract-address-registry';
import { scrollAndConfirmAndAssertConfirm } from '../tests/confirmations/helpers';
import {
  createDepositTransaction,
  TestSuiteArguments,
} from '../tests/confirmations/transactions/shared';
import {
  multipleGanacheOptionsForType2Transactions,
  withFixtures,
  openDapp,
  WINDOW_TITLES,
  locateAccountBalanceDOM,
  clickNestedButton,
  ACCOUNT_2,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { SMART_CONTRACTS } from '../seeder/smart-contracts';
import { installSnapSimpleKeyring, importKeyAndSwitch } from './common';

describe('Snap Account Contract interaction', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  it('deposits to piggybank contract', async function () {
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
        // Install Snap Simple Keyring and import key
        await installSnapSimpleKeyring(driver, false);
        await importKeyAndSwitch(driver);

        // Open DApp with contract
        const contractAddress = await (
          contractRegistry as GanacheContractAddressRegistry
        ).getContractAddress(smartContract);
        await openDapp(driver, contractAddress);

        // Create and confirm deposit transaction
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await createDepositTransaction(driver);
        await driver.waitUntilXWindowHandles(4);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: 'h2',
          text: 'Transaction request',
        });
        await scrollAndConfirmAndAssertConfirm(driver);

        // Confirm the transaction activity
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await clickNestedButton(driver, 'Activity');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-4 ETH',
        });

        // renders the correct ETH balance
        await locateAccountBalanceDOM(driver, ganacheServer, ACCOUNT_2);
      },
    );
  });
});
