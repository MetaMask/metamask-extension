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
  checkStellarHomeXlmBalance,
  fillStellarAmount,
  fillStellarRecipient,
} from './helpers';

describe('Stellar Send', function () {
  it('blocks Continue when amount exceeds balance', async function () {
    await withStellarFixtures(
      {
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
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
