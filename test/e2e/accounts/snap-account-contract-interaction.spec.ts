/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import GanacheContractAddressRegistry from '../seeder/ganache-contract-address-registry';
import { scrollAndConfirmAndAssertConfirm } from '../tests/confirmations/helpers';
import {
  createDepositTransaction,
  TestSuiteArguments,
} from '../tests/confirmations/transactions/shared';
import { installSnapSimpleKeyring, importKeyAndSwitch } from './common';

const {
  multipleGanacheOptionsForType2Transactions,
  withFixtures,
  openDapp,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Snap Account - Contract interaction', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  it(`deposit to piggybank contract`, async function () {
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
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
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
      },
    );
  });
});
