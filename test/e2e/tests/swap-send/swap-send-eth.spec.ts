import {
  withFixtures,
  openActionMenuAndStartSendFlow,
  logInWithBalanceValidation,
} from '../../helpers';
import { Suite } from 'mocha';
import {
  NATIVE_TOKEN_SYMBOL,
  SwapSendPage,
  getSwapSendFixtures,
} from './swap-send-test-utils';

const RECIPIENT_ADDRESS = '0xc427D562164062a23a5cFf596A4a3208e72Acd28';

describe('Swap-Send ETH', function () {
  describe('to non-contract address with data that matches swap data signature', function (this: Suite) {
    // TODO: reenable this in follow-up
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('submits a transaction successfully', async function () {
      await withFixtures(
        getSwapSendFixtures(this.test?.fullTitle()),
        async ({
          driver,
          ganacheServer,
        }: {
          driver: any;
          ganacheServer: any;
        }) => {
          const swapSendPage = new SwapSendPage(driver);
          await logInWithBalanceValidation(driver, ganacheServer);

          // START SWAP AND SEND FLOW
          await openActionMenuAndStartSendFlow(driver);

          await swapSendPage.fillRecipientAddressInput(RECIPIENT_ADDRESS);
          await swapSendPage.fillAmountInput('1');

          await swapSendPage.verifyMaxButtonClick(
            ['ETH', 'ETH'],
            ['24.995559472', '24.995559472'],
          );

          await swapSendPage.searchAndSelectToken('TST', 'src');
          await swapSendPage.verifyAssetSymbolsAndAmounts(
            ['TST', 'TST'],
            ['0', '0'],
          );

          await swapSendPage.searchAndSelectToken(NATIVE_TOKEN_SYMBOL, 'src');
          await swapSendPage.fillAmountInput('1');

          const ETH_TST_TOKEN_INPUTS = [
            [NATIVE_TOKEN_SYMBOL, 'TST'],
            ['1', '301075.4807'],
          ];
          const ETH_TST_FIAT_INPUTS = [
            ['USD', 'USD'],
            ['100', '3010.754807'],
          ];

          await swapSendPage.searchAndSelectToken('TST', 'dest');
          await swapSendPage.verifyAssetSymbolsAndAmounts(
            ETH_TST_TOKEN_INPUTS[0],
            ETH_TST_TOKEN_INPUTS[1],
          );

          await swapSendPage.verifySwitchPrimaryCurrency(
            ETH_TST_TOKEN_INPUTS,
            ETH_TST_FIAT_INPUTS,
          );

          await swapSendPage.verifyQuoteDisplay(
            '1 ETH = 301075.4807 TST',
            '1500000 ETH', // TODO this looks weird
            '≈ $4,515,000,000.00',
          );

          await swapSendPage.submitSwap();
          await swapSendPage.verifyHistoryEntry(
            'Send ETH as TST',
            'Pending',
            '-1 ETH',
            '-$3,010.00',
          );
          await swapSendPage.verifyHistoryEntry(
            'Send ETH as TST',
            'Confirmed',
            '-1 ETH',
            '-$3,010.00',
          );

          driver.summarizeErrorsAndExceptions();
        },
      );
    });
  });
});
