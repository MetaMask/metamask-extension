import FixtureBuilder from '../../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import {
  TestSuiteArguments,
  openDAppWithContract,
} from '../transactions/shared';
import { Driver } from '../../../webdriver/driver';
import TestDapp from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import AlertModal from '../../../page-objects/pages/confirmations/redesign/alert-modal';
import modal from '../../../../../ui/components/app/modals/modal';

describe('Alert for insufficient funds', function () {
  it('Shows an alert when the user tries to send a transaction with insufficient funds', async function () {
    const nftSmartContract = SMART_CONTRACTS.NFTS;
    const localNodeOptions = {
      mnemonic: 'test test test test test test test test test test test junk',
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions,
        smartContract: nftSmartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await openDAppWithContract(driver, contractRegistry, nftSmartContract);

        await mintNft(driver);
        const confirmation = new Confirmation(driver);
        const alertModal = new AlertModal(driver);


        await verifyAlertForInsufficientBalance(confirmation, alertModal);
      },
    );
  });
});

async function verifyAlertForInsufficientBalance(confirmation: Confirmation, alertModal: AlertModal): Promise<void> {

  /*await driver.waitForSelector({
    //css: '[data-testid="inline-alert"]',
    text: 'Alert',
  }); */
  await alertModal.waitForAlert();


  //await driver.clickElementSafe('.confirm-scroll-to-bottom__button');
  await confirmation.clickScrollToBottomButton();

  /*await driver.clickElement('[data-testid="inline-alert"]');
  await displayAlertForInsufficientBalance(driver);
  await driver.clickElement('[data-testid="alert-modal-button"]');*/

  await confirmation.clickInlineAlert();
  await displayAlertForInsufficientBalance(alertModal);
}

async function mintNft(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  const testDapp = new TestDapp(driver);
  await testDapp.clickERC721MintButton();

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

async function displayAlertForInsufficientBalance(alertModal: AlertModal): Promise<void> {

  /*await driver.waitForSelector({
    css: '[data-testid="alert-modal__selected-alert"]',
    text: 'You do not have enough ETH in your account to pay for network fees.',
  });*/

  await alertModal.waitForInsufficientBalanceAlert();
  await alertModal.clickAlertModalButton();

}
