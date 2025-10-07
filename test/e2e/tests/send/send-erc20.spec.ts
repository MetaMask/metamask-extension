import { CHAIN_IDS } from '../../../../shared/constants/network';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { withFixtures } from '../../helpers';
import { mockSendRedesignFeatureFlag } from './common';

const getERC20Fixtures = () => {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.LINEA_MAINNET]: true,
      },
    })
    .withTokensController({
      tokenList: [],
      tokensChainsCache: {
        '0x1': {
          data: {
            '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267': {
              name: 'Entropy',
              aggregators: ['Lifi', 'Coinmarketcap', 'Rango'],
              address: '0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267',
              decimals: 18,
              iconUrl:
                'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a0e3bfd5a8ce610e735d4469bc1b3b130402267.png',
              occurrences: 3,
              symbol: 'ERP',
            },
          },
        },
      },
    })
    .build();
};

describe('Send ERC20', function () {
  it('it should be possible to send ERC20 token', async function () {
    await withFixtures(
      {
        fixtures: getERC20Fixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);

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

        await sendTokenConfirmationPage.clickOnConfirm();
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
        await activityListPage.checkTxAmountInActivity('-1 ETH');
      },
    );
  });

  it('it should be possible to send Max token value', async function () {
    await withFixtures(
      {
        fixtures: getERC20Fixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendRedesignFeatureFlag,
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.startSendFlow();

        await homePage.startSendFlow();

        await sendPage.selectToken('0xe708', 'ETH');
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendPage.pressMaxButton();
        await sendPage.pressContinueButton();

        await sendTokenConfirmationPage.clickOnConfirm();
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
