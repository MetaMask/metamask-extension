import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures } from '../../helpers';
import { mockSendRedesignFeatureFlag } from './common';

describe('Send ERC20', function () {
  const smartContract = SMART_CONTRACTS.HST;
  it('it should be possible to send ERC20 token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
        smartContract,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const confirmation = new Confirmation(driver);

        await homePage.startSendFlow();

        await sendPage.selectToken('0xe708', 'ETH');
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendPage.fillAmount('1000');
        await sendPage.checkInsufficientFundsError();
        await sendPage.pressOnAmountInput('BACK_SPACE');
        await sendPage.pressOnAmountInput('BACK_SPACE');
        await sendPage.pressOnAmountInput('BACK_SPACE');
        await sendPage.pressContinueButton();

        // cancelling request as send on linea will fail
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterCancelButton();
      },
    );
  });

  it('it should be possible to send Max token value', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
        smartContract,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const confirmation = new Confirmation(driver);

        await homePage.startSendFlow();

        await sendPage.createMaxSendRequest({
          chainId: '0xe708',
          symbol: 'ETH',
          recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        });

        // cancelling request as send on linea will fail
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterCancelButton();
      },
    );
  });
});
