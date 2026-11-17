import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import SendPage from '../../../page-objects/pages/send/send-page';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { STELLAR_CHAIN_ID } from '../../stellar/mocks/common-stellar';
import { STELLAR_RECIPIENT_ADDRESS } from '../../stellar/mocks/stellar-tx-fixtures';
import {
  checkStellarHomeXlmBalance,
  fillStellarAmount,
  fillStellarRecipient,
  landOnStellarSendHome,
} from './helpers';

describe('Stellar Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks Continue when amount exceeds balance', async function () {
    await withStellarFixtures(
      {
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const homePage = await landOnStellarSendHome(driver);
        await checkStellarHomeXlmBalance(homePage);

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(STELLAR_CHAIN_ID, 'XLM');
        await sendPage.checkSendFormIsLoaded();

        await fillStellarRecipient(driver, STELLAR_RECIPIENT_ADDRESS);
        await fillStellarAmount(driver, '999999');
        await sendPage.checkInsufficientFundsError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });
});
