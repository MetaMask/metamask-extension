/**
 * Send max parity.
 *
 * For the same account, balance, and gas mocks, Send Max on the amount screen
 * and the amount shown on confirmation may differ only by the mocked gas fee.
 * Covers Ethereum mainnet and Monad.
 */

import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SendAmountRecipientPage from '../../page-objects/pages/send/send-amount-recipient-page';
import SendAssetPickerPage from '../../page-objects/pages/send/send-asset-picker-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import {
  MAX_AMOUNT_NETWORKS,
  MAX_SEND_RECIPIENT,
} from './max-amount-parity.constants';
import {
  assertSendMaxParity,
  getMaxAmountParityFixtures,
} from './max-amount-parity';

describe('Send max amount parity', function () {
  MAX_AMOUNT_NETWORKS.forEach((network) => {
    it(`matches the confirmation amount within gas on ${network.name}`, async function () {
      await withFixtures(
        getMaxAmountParityFixtures(network, this.test?.fullTitle()),
        async ({ driver }) => {
          await login(driver, { validateBalance: false });

          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendAssetPickerPage = new SendAssetPickerPage(driver);
          await sendAssetPickerPage.checkPageIsLoaded();
          await sendAssetPickerPage.selectToken(
            network.chainId,
            network.symbol,
          );

          const sendAmountRecipientPage = new SendAmountRecipientPage(driver);
          await sendAmountRecipientPage.fillRecipient({
            recipientAddress: MAX_SEND_RECIPIENT,
          });
          await sendAmountRecipientPage.clickMaxButton();

          const sendMax = await sendAmountRecipientPage.getAmountInputValue();
          await sendAmountRecipientPage.pressContinueButton();

          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          const confirmationAmount =
            await transactionConfirmation.getDisplayedNativeAmount(
              network.symbol,
            );

          assertSendMaxParity(sendMax, confirmationAmount);
        },
      );
    });
  });
});
