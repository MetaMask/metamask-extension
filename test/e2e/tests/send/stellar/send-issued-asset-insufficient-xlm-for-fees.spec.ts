import { Driver } from '../../../webdriver/driver';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import {
  STELLAR_CHAIN_ID,
  STELLAR_NETWORK_NAME,
} from '../../stellar/mocks/stellar-constants';
import { STELLAR_RECIPIENT_ADDRESS } from '../../stellar/mocks/stellar-tx-fixtures';
import {
  checkStellarUsdcInTokenList,
  fillStellarAmount,
  fillStellarRecipient,
} from './helpers';

describe('Stellar Send', function () {
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
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
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
