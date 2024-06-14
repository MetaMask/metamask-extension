import { Suite } from 'mocha';
import {
  withFixtures,
  openActionMenuAndStartSendFlow,
  logInWithBalanceValidation,
} from '../../helpers';
import type { Ganache } from '../../seeder/ganache';
import {
  NATIVE_TOKEN_SYMBOL,
  SwapSendPage,
  getSwapSendFixtures,
} from './swap-send-test-utils';
import { SWAP_SEND_QUOTES_RESPONSE_TST_ETH } from './mocks/erc20-data';

const RECIPIENT_ADDRESS = '0xc427D562164062a23a5cFf596A4a3208e72Acd28';

describe('Swap-Send ERC20', function () {
  describe('to non-contract address with data that matches swap data signature', function (this: Suite) {
    it('submits a transaction successfully', async function () {
      await withFixtures(
        getSwapSendFixtures(
          this.test?.fullTitle(),
          SWAP_SEND_QUOTES_RESPONSE_TST_ETH,
        ),
        async ({
          driver,
          ganacheServer,
        }: {
          // TODO: Replace `any` with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          driver: any;
          ganacheServer: Ganache;
        }) => {
          const swapSendPage = new SwapSendPage(driver);
          await logInWithBalanceValidation(driver, ganacheServer);

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

          await swapSendPage.verifyMaxButtonClick(['TST', 'TST'], ['10', '10']);

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
            'Send TST as ETH',
            'Confirmed',
            '-10 TST',
            '-$0.00',
          );

          driver.summarizeErrorsAndExceptions();
        },
      );
    });
  });
});
