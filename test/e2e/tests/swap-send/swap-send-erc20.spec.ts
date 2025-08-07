import { Suite } from 'mocha';
import { Browser } from 'selenium-webdriver';
import { withFixtures, openActionMenuAndStartSendFlow } from '../../helpers';
import {
  NATIVE_TOKEN_SYMBOL,
  SwapSendPage,
  getSwapSendFixtures,
} from './swap-send-test-utils';
import { SWAP_SEND_QUOTES_RESPONSE_TST_ETH } from './mocks/erc20-data';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const RECIPIENT_ADDRESS = '0xc427D562164062a23a5cFf596A4a3208e72Acd28';
const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

describe('Swap-Send ERC20', function () {
  describe('to non-contract address with data that matches swap data signature', function (this: Suite) {
    it('submits a transaction successfully', async function () {
      await withFixtures(
        getSwapSendFixtures(
          this.test?.fullTitle(),
          SWAP_SEND_QUOTES_RESPONSE_TST_ETH,
          '?sourceAmount=100000&sourceToken=0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947&destinationToken=0x0000000000000000000000000000000000000000&sender=0x5cfe73b6021e818b776b421b1c4db2474086a7e1&recipient=0xc427D562164062a23a5cFf596A4a3208e72Acd28&slippage=2',
        ),
        async ({ driver }) => {
          const swapSendPage = new SwapSendPage(driver);
          await loginWithBalanceValidation(driver);

          // START SWAP AND SEND FLOW
          await openActionMenuAndStartSendFlow(driver);

          await swapSendPage.fillRecipientAddressInput(RECIPIENT_ADDRESS);
          await swapSendPage.fillAmountInput('1');

          await swapSendPage.searchAndSelectToken('TST', 'src');
          await swapSendPage.verifyAssetSymbolsAndAmounts(
            ['TST', 'TST'],
            ['0', '0'],
            4000,
          );

          // We made this due to a change on Firefox v125
          // The 2 decimals are not displayed with values which are "rounded",
          if (isFirefox) {
            await swapSendPage.verifyMaxButtonClick(
              ['TST', 'TST'],
              ['10', '10'],
            );
          } else {
            await swapSendPage.verifyMaxButtonClick(
              ['TST', 'TST'],
              ['10.0000', '10.0000'],
            );
          }

          await swapSendPage.fillAmountInput('10');

          const TST_ETH_TOKEN_INPUTS = [
            ['TST', NATIVE_TOKEN_SYMBOL],
            ['10', '0.000263431921562245'],
          ];
          const TST_ETH_FIAT_INPUTS = [
            ['USD', 'USD'],
            ['100', '0.000263431921562245'],
          ];

          await swapSendPage.searchAndSelectToken(NATIVE_TOKEN_SYMBOL, 'dest');
          await swapSendPage.verifyAssetSymbolsAndAmounts(
            TST_ETH_TOKEN_INPUTS[0],
            TST_ETH_TOKEN_INPUTS[1],
            4000,
          );

          await swapSendPage.verifySwitchPrimaryCurrency(
            TST_ETH_TOKEN_INPUTS,
            TST_ETH_FIAT_INPUTS,
          );

          await swapSendPage.verifyQuoteDisplay(
            '1 TST = 0.000002634 ETH',
            '0.0075669 ETH',
            '≈ $22.78',
          );

          await swapSendPage.submitSwap();
          // await swapSendPage.verifyHistoryEntry(
          //   'Approve TST for swaps',
          //   'Pending',
          // );
          // await swapSendPage.verifyHistoryEntry(
          //   'Send TST as ETH',
          //   'Queued',
          //   '-10 TST',
          //   '-$0.00',
          // );
          // TODO uncomment these
          // await swapSendPage.verifyHistoryEntry(
          //   'Approve TST for swaps',
          //   'Confirmed',
          // );
          // await swapSendPage.verifyHistoryEntry(
          //   'Send TST as ETH',
          //   'Pending',
          //   '-10 TST',
          //   '-$0.00',
          // );
          await swapSendPage.verifyHistoryEntry(
            'Sent TST as ETH',
            'Confirmed',
            '-10 TST',
            '',
          );

          driver.summarizeErrorsAndExceptions();
        },
      );
    });
  });
});
