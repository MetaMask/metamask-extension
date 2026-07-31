import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import { landOnTronSendScreen } from '../../page-objects/flows/tron-send.flow';
import { TRON_RECIPIENT_ADDRESS } from '../tron/mocks/common-tron';
import { TRON_PORTFOLIO_ACCOUNT } from '../tron/fixtures/environments';
import { withTronFixtures } from '../tron/fixtures/with-tron-fixtures';

describe('Send Tron (local blockchain)', function (this: Suite) {
  this.timeout(180_000);

  it('should be possible to send TRX using a real local blockchain', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const sendPage = await landOnTronSendScreen({ driver, symbol: 'TRX' });
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityTab(driver);
        await activityList.checkNoFailedTransactions();
        await activityList.checkTxAmountInActivity('-1 TRX', 1);
      },
    );
  });
});
