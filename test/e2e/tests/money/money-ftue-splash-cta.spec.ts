import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import MoneyAccountDepositConfirmation from '../../page-objects/pages/confirmations/money-account-deposit-confirmation';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import MoneyFtueSplashPage from '../../page-objects/pages/money/money-ftue-splash-page';
import { login } from '../../page-objects/flows/login.flow';
import {
  MAINNET_USDC_ADDRESS,
  MONEY_ACCOUNT_FLAG_VALUE,
} from '../confirmations/metamask-pay/constants';
import { getMoneyAccountDepositConfig } from '../confirmations/metamask-pay/helpers';

const MONEY_TOKEN_LIST_CTA_REMOTE_FLAGS = {
  earnMoneyTokenListItemCtaEnabled: MONEY_ACCOUNT_FLAG_VALUE,
  earnMoneyDepositCtaTokenAddresses: { '0x1': [MAINNET_USDC_ADDRESS] },
  earnMoneyVaultApyControl: { vaultApyOverride: 0.05 },
};

/**
 * MUSD-1520: dismissing the Money FTUE splash opened from a CTA cancels the
 * pending deposit.
 */
describe('Money Account FTUE from a deposit CTA', function (this: Suite) {
  it('cancels the pending deposit when the splash is dismissed', async function () {
    await withFixtures(
      getMoneyAccountDepositConfig({
        title: this.test?.fullTitle(),
        moneyFtueSeen: false,
        remoteFlagOverrides: MONEY_TOKEN_LIST_CTA_REMOTE_FLAGS,
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkPageIsLoaded();
        await tokensTab.clickMoneyTokenListCta();

        const splash = new MoneyFtueSplashPage(driver);
        await splash.checkPageIsLoaded();
        await splash.clickClose();
        await splash.checkIsNotShown();

        const depositConfirmation = new MoneyAccountDepositConfirmation(driver);
        await depositConfirmation.checkIsNotShown();
        await tokensTab.checkPageIsLoaded();

        // Reload so the persisted seen flag is read back from background state.
        await driver.navigate();
        await tokensTab.checkPageIsLoaded();
        await tokensTab.clickMoneyTokenListCta();
        await depositConfirmation.checkPageIsLoaded();
        await splash.checkIsNotShown();
      },
    );
  });
});
