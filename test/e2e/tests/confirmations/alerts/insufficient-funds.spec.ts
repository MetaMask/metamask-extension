import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { TestSuiteArguments } from '../transactions/shared';
import AlertModal from '../../../page-objects/pages/confirmations/alert-modal';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { login } from '../../../page-objects/flows/login.flow';

/**
 * Exclude the local Ganache chain (1337) from the Accounts API supported
 * networks so that AccountsApiDataSource does not return a fake 25 ETH
 * balance. The real balance will come from the RPC data source instead.
 *
 * @param server - The mock server instance.
 */
async function mockAccountsApiWithoutLocalNode(server: Mockttp) {
  await server
    .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        fullSupport: [],
        partialSupport: {
          balances: [],
        },
      },
    }));
  return [];
}

describe('Alert for insufficient funds', function () {
  it('Shows an alert when the user tries to send a transaction with insufficient funds', async function () {
    const nftSmartContract = SMART_CONTRACTS.NFTS;
    const localNodeOptions = {
      mnemonic: 'test test test test test test test test test test test junk',
    };
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions,
        smartContract: nftSmartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mockAccountsApiWithoutLocalNode,
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        const alertModal = new AlertModal(driver);
        const contractAddress =
          await contractRegistry?.getContractAddress(nftSmartContract);

        await login(driver, { validateBalance: false });

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
