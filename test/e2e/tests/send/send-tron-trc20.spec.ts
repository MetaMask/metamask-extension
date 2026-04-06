import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import NetworkManager from '../../page-objects/pages/network-manager';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  mockTronApis,
  TRON_RECIPIENT_ADDRESS,
  TRON_CHAIN_ID,
} from '../tron/mocks/common-tron';

describe('Send Tron TRC20', function () {
  it('it should be possible to send USDT (TRC20)', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed(
          '6.072',
          'TRX',
        );

        await nonEvmHomepage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken(TRON_CHAIN_ID, 'USDT');
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-50,000 HTX', 1); // mocked activity
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  it('send address validation rejects invalid Tron addresses', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed(
          '6.072',
          'TRX',
        );

        await nonEvmHomepage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken(TRON_CHAIN_ID, 'TRX');
        // Enter an Ethereum-style hex address — invalid for Tron
        await sendPage.fillRecipient(
          '0x1234567890abcdef1234567890abcdef12345678',
        );
        await sendPage.checkInvalidAddressError();
      },
    );
  });
});
