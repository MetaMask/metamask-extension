/**
 * Swap max parity.
 *
 * Captures Swap Max for the same account and balance used by the send parity
 * spec. Ethereum Swap Max is the full balance, matching send-page Max. The
 * send confirmation is lower by the mocked gas fee; that comparison lives in
 * the send spec.
 *
 * Monad Swap Max is the balance minus 10 MON. That reserve comes from
 * `MINIMUM_NATIVE_RESERVE_BALANCE_PER_CHAIN` in
 * `ui/pages/bridge/utils/minimum-reserve.ts` and is intentional. It is not a
 * send-confirmation discrepancy.
 */

import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  MAX_AMOUNT_NETWORKS,
  assertAmountEquals,
  expectedSwapMax,
  getMaxAmountParityFixtures,
} from '../send/max-amount-parity';

describe('Swap max amount', function () {
  MAX_AMOUNT_NETWORKS.forEach((network) => {
    it(`fills max for native ${network.symbol}`, async function () {
      await withFixtures(
        getMaxAmountParityFixtures(network, this.test?.fullTitle(), {
          includeBridgeFlags: true,
        }),
        async ({ driver }) => {
          await login(driver, {
            validateBalance: false,
            waitForNonEvmAccounts: false,
          });

          const homePage = new HomePage(driver);
          await homePage.startSwapFlow();

          const bridgePage = new BridgeQuotePage(driver);
          await bridgePage.checkPageIsLoaded();
          await bridgePage.selectSrcTokenIfNeeded(network.symbol);
          await bridgePage.clickMaxButton();

          const swapMax = await bridgePage.getSourceAmount();

          // Ethereum: full balance, same as send-page Max.
          // Monad: balance minus the intentional 10 MON native reserve.
          assertAmountEquals(
            swapMax,
            expectedSwapMax(network),
            `Swap max for ${network.symbol}`,
          );
        },
      );
    });
  });
});
