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
        await confirmation.clickInlineAlert();
        await alertModal.check_messageForInsufficientBalance();
      },
    );
  });
});

async function mintNft(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  const testDapp = new TestDapp(driver);
  await testDapp.clickERC721MintButton();

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}
