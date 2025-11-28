import ActivityListPage from '../../page-objects/pages/home/activity-list';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures } from '../../helpers';
import { mockSendRedesignFeatureFlag } from './common';

describe('Send ERC20', function () {
  const smartContract = SMART_CONTRACTS.HST;
  it('it should be possible to send ERC20 token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
        smartContract,
      },
      async ({ driver, localNodes, contractRegistry }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const tokenAddress =
          await contractRegistry.getContractAddress(smartContract);

        // Importing token manually until we update the fixture with the new state
        const assetListPage = new AssetListPage(driver);
        await assetListPage.importCustomTokenByChain('0x539', tokenAddress);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const confirmation = new Confirmation(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.startSendFlow();

        await sendPage.selectToken('0x539', 'TST');
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendPage.fillAmount('1000');
        await sendPage.checkInsufficientFundsError();
        await sendPage.pressOnAmountInput('BACK_SPACE');
        await sendPage.pressOnAmountInput('BACK_SPACE');
        await sendPage.pressOnAmountInput('BACK_SPACE');
        await sendPage.pressContinueButton();

        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButton();
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('it should be possible to send Max token value', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
        smartContract,
      },
      async ({ driver, localNodes, contractRegistry }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const tokenAddress =
          await contractRegistry.getContractAddress(smartContract);

        // Importing token manually until we update the fixture with the new state
        const assetListPage = new AssetListPage(driver);
        await assetListPage.importCustomTokenByChain('0x539', tokenAddress);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const confirmation = new Confirmation(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.startSendFlow();

        await sendPage.createMaxSendRequest({
          chainId: '0x539',
          symbol: 'TST',
          recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        });

        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButton();
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
