import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Driver } from '../webdriver/driver';
import { TestDapp } from '../page-objects/test-dapp';
import { TransactionConfirmation } from '../page-objects/transaction-confirmation';
import { ActivityList } from '../page-objects/activity-list';
import { AccountMenu } from '../page-objects/account-menu';
import { installSnapSimpleKeyring } from '../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../seeder/smart-contracts';
import { importKeyAndSwitch } from './common';
import { withFixtures, WINDOW_TITLES, multipleGanacheOptionsForType2Transactions } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import GanacheContractAddressRegistry from '../seeder/ganache-contract-address-registry';

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
      async ({ driver, contractRegistry, ganacheServer }: { driver: Driver; contractRegistry: GanacheContractAddressRegistry; ganacheServer: any }) => {
        const testDapp = new TestDapp(driver);
        const transactionConfirmation = new TransactionConfirmation(driver);
        const activityList = new ActivityList(driver);
        const accountMenu = new AccountMenu(driver);

        // Install Snap Simple Keyring and import key
        await loginWithBalanceValidation(driver, ganacheServer);
        await installSnapSimpleKeyring(driver);
        await importKeyAndSwitch(driver);

        // Open DApp with contract
        const contractAddress = await contractRegistry.getContractAddress(smartContract);
        await testDapp.open(contractAddress);

        // Create and confirm deposit transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
        await testDapp.createDepositTransaction();

        await transactionConfirmation.confirmTransaction();
        await transactionConfirmation.waitForTransactionResult();

        // Confirm the transaction activity
        await activityList.waitForActivityEntry('Contract Interaction');
        await activityList.openActivityDetails('Contract Interaction');
        await activityList.verifyTransactionDetails({ 'Amount': '-4 ETH' });

        // Check account balance
        const balance = await accountMenu.getAccountBalance();
        expect(parseFloat(balance)).to.be.lessThan(96); // Assuming initial balance was 100 ETH
      },
    );
  });
});
