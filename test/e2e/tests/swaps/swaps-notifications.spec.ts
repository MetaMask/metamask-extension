import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  getBridgeFixtures,
  getInsufficientFundsFixtures,
} from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';
import { checkNotification } from './shared';

describe('Swaps - notifications', function () {
  it('shows insufficient funds state', async function () {
    await withFixtures(
      getInsufficientFundsFixtures({}, this.test?.fullTitle()),
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote({
          amount: '24.9950',
          tokenFrom: 'ETH',
          tokenTo: 'WETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgeQuotePage.checkInsufficientFundsButtonIsDisplayed();
        await bridgeQuotePage.checkMoreETHneededIsDisplayed();
      },
    );
  });

  it('shows low slippage warning in transaction settings', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      ),
      async ({ driver }) => {
        await loginWithBalanceValidation(driver, undefined, undefined, '$0');
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgeQuotePage.waitForQuote();

        await driver.clickElement('[data-testid="slippage-edit-button"]');
        await driver.clickElement(
          '[data-testid="bridge__tx-settings-modal-custom-button"]',
        );
        await driver.fill(
          'input[data-testid="bridge__tx-settings-modal-custom-input"]',
          '0.1',
        );
        await driver.executeScript(`
          const input = document.querySelector('input[data-testid="bridge__tx-settings-modal-custom-input"]');
          if (input) {
            input.blur();
          }
        `);

        await checkNotification(driver, {
          title: 'Low slippage',
          text: 'A value this low (0.1%) may result in a failed swap',
        });
      },
    );
  });
});
