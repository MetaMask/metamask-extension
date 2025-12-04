import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { TestSuiteArguments } from '../transactions/shared';
import AlertModal from '../../../page-objects/pages/confirmations/redesign/alert-modal';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

describe('Alert for insufficient funds', function () {
  it('Shows an alert when the user tries to send a transaction with insufficient funds', async function () {
    const nftSmartContract = SMART_CONTRACTS.NFTS;
    const localNodeOptions = {
      mnemonic: 'test test test test test test test test test test test junk',
    };
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions,
        smartContract: nftSmartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        const alertModal = new AlertModal(driver);
        const contractAddress =
          await contractRegistry?.getContractAddress(nftSmartContract);

        await loginWithBalanceValidation(driver, undefined, undefined, '0');

        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.checkPageIsLoaded();
        await testDapp.clickERC721MintButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.clickInlineAlert();
        await alertModal.checkInsufficientBalanceMessageIsDisplayed();
        await alertModal.clickConfirmButton();
      },
    );
  });
});
