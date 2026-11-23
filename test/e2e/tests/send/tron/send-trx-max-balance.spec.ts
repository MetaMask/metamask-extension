import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { waitUntilAccountTreeSyncIdle } from '../../../page-objects/flows/add-account.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import SnapTransactionConfirmation from '../../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import SendPage from '../../../page-objects/pages/send/send-page';
import {
  TRON_CHAIN_ID,
  TRON_RECIPIENT_ADDRESS,
} from '../../tron/mocks/common-tron';
import {
  TRON_ACTIVE_RECIPIENT_ACCOUNT,
  TRON_ACTIVE_RECIPIENT_ADDRESS,
  TRON_PORTFOLIO_ACCOUNT,
  TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
} from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';
import { formatSunAmount } from './utils/formatSunAmount';

/**
 * Inactive destinations need 1 TRX account activation plus the 0.1 TRX
 * create-account fee when the sender has no staked bandwidth.
 */
const TRON_INACTIVE_RECIPIENT_FEE_BUFFER_IN_SUN = 1_100_000;

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('sends the Snap max TRX amount to an inactive recipient', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await waitUntilAccountTreeSyncIdle(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const tokensTab = new TokensTab(driver);
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(TRON_CHAIN_ID, 'TRX');
        await sendPage.checkSendFormIsLoaded();

        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.clickMaxButton();
        await sendPage.checkAmountInputValue(
          formatSunAmount(
            TRON_PORTFOLIO_TRX_BALANCE_IN_SUN -
              TRON_INACTIVE_RECIPIENT_FEE_BUFFER_IN_SUN,
          ),
        );
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterButton({ button: 'confirm' });

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkNoFailedTransactions();
      },
    );
  });

  it('sends the Snap max TRX amount to an active recipient', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT, TRON_ACTIVE_RECIPIENT_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await waitUntilAccountTreeSyncIdle(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const tokensTab = new TokensTab(driver);
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(TRON_CHAIN_ID, 'TRX');
        await sendPage.checkSendFormIsLoaded();

        await sendPage.fillRecipient({
          recipientAddress: TRON_ACTIVE_RECIPIENT_ADDRESS,
        });
        await sendPage.clickMaxButton();
        await sendPage.checkAmountInputValue(
          formatSunAmount(TRON_PORTFOLIO_TRX_BALANCE_IN_SUN),
        );
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapTransactionConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterButton({ button: 'confirm' });

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
