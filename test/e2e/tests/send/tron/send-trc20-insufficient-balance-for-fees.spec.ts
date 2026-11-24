import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { waitUntilAccountTreeSyncIdle } from '../../../page-objects/flows/add-account.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import {
  TRON_CHAIN_ID,
  TRON_RECIPIENT_ADDRESS,
} from '../../tron/mocks/common-tron';
import { TRON_LOW_TRX_WITH_USDT_ACCOUNT } from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

describe('Tron Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks USDT send when TRX balance cannot cover energy fee', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_LOW_TRX_WITH_USDT_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await waitUntilAccountTreeSyncIdle(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Tron');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(TRON_CHAIN_ID, 'USDT');
        await sendPage.checkSendFormIsLoaded();

        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        // With 1 sun TRX, Continue builds the TRC20 tx then fails fee cover.
        await sendPage.pressContinueButton();
        await sendPage.checkInsufficientBalanceToCoverFeesError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });
});
