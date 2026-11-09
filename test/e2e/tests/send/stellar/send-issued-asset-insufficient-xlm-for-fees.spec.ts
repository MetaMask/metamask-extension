import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import SendPage from '../../../page-objects/pages/send/send-page';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { STELLAR_CHAIN_ID } from '../../stellar/mocks/common-stellar';
import { STELLAR_RECIPIENT_ADDRESS } from '../../stellar/mocks/stellar-tx-fixtures';
import {
  checkStellarUsdcInTokenList,
  fillStellarAmount,
  fillStellarRecipient,
  landOnStellarSendHome,
} from './helpers';

describe('Stellar Send', function (this: Suite) {
  this.timeout(180_000);

  it('blocks USDC send when XLM balance cannot cover the transaction fee', async function () {
    await withStellarFixtures(
      {
        // 1 subentry (USDC) → min balance 1.5 XLM; spendable native is 0 so
        // inclusion fee cannot be covered.
        horizonOptions: {
          xlmBalance: '1.5000000',
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        enableSend: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const homePage = await landOnStellarSendHome(driver);
        await checkStellarUsdcInTokenList(driver);

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(STELLAR_CHAIN_ID, 'USDC');
        await sendPage.checkSendFormIsLoaded();

        await fillStellarRecipient(driver, STELLAR_RECIPIENT_ADDRESS);
        await fillStellarAmount(driver, '1');
        // Stellar validates fees asynchronously and disables Continue with the
        // fee error — no Continue press needed (unlike Tron's submit path).
        await sendPage.checkInsufficientBalanceToCoverFeesError();
        await sendPage.checkContinueButtonIsDisabled();
      },
    );
  });
});
