import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { waitUntilAccountTreeSyncIdle } from '../../../page-objects/flows/add-account.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import SendAmountRecipientPage from '../../../page-objects/pages/send/send-amount-recipient-page';
import SendAssetPickerPage from '../../../page-objects/pages/send/send-asset-picker-page';
import {
  TRON_CHAIN_ID,
  TRON_RECIPIENT_ADDRESS,
} from '../../tron/mocks/common-tron';
import { TRON_PORTFOLIO_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks Continue when amount exceeds balance', async function () {
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
        const sendAmountRecipientPage = new SendAmountRecipientPage(driver);
        const sendAssetPickerPage = new SendAssetPickerPage(driver);
        await sendAssetPickerPage.selectToken(TRON_CHAIN_ID, 'TRX');
        await sendAmountRecipientPage.checkPageIsLoaded();

        await sendAmountRecipientPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendAmountRecipientPage.fillAmount('999999');
        await sendAmountRecipientPage.checkInsufficientFundsError();
        await sendAmountRecipientPage.checkContinueButtonIsDisabled();
      },
    );
  });
});
