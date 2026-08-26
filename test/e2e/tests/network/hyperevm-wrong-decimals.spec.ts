/**
 * HyperEVM 6-decimal ERC-20 formatting (frxUSD).
 *
 * Monitors the regression where a 6-decimal HyperEVM token (frxUSD) showed
 * 11,811,649 (or compact 11.81M) instead of 11.811649. The Tokens list and
 * token details must display the formatted human amount (`11.812 frxUSD`,
 * after `formatTokenQuantity`) and Token decimal 6. Balance is seeded through
 * Accounts API v5 as well as AssetsController so a live refresh cannot wipe it.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  FRXUSD_CHECKSUM_ADDRESS,
  FRXUSD_DECIMALS,
  FRXUSD_DISPLAY_AMOUNT,
  FRXUSD_SYMBOL,
  prepareCustomNetwork,
} from '../../helpers/custom-network-harness';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';

describe('HyperEVM frxUSD decimal formatting', function () {
  it('shows 6-decimal frxUSD on the token list and details', async function () {
    const { fixtures, localNodeOptions, testSpecificMock } =
      prepareCustomNetwork('hyperevm', 'wrongDecimals');

    await withFixtures(
      {
        fixtures,
        localNodeOptions,
        testSpecificMock,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);

        await homePage.checkPageIsLoaded();
        await tokensTab.checkTokenListIsDisplayed();
        await tokensTab.checkTokenExistsInList(
          FRXUSD_SYMBOL,
          FRXUSD_DISPLAY_AMOUNT,
        );
        await tokensTab.checkTokenRowDoesNotContainText(
          FRXUSD_SYMBOL,
          '11,811,649',
        );
        await tokensTab.checkTokenRowDoesNotContainText(
          FRXUSD_SYMBOL,
          '11.81M',
        );

        await tokensTab.openTokenDetails(FRXUSD_SYMBOL);
        await tokensTab.checkTokenAmountIsDisplayed(FRXUSD_DISPLAY_AMOUNT);
        await tokensTab.checkTokenSymbolAndAddressDetails(
          FRXUSD_SYMBOL,
          FRXUSD_CHECKSUM_ADDRESS,
        );
        await tokensTab.checkTokenDecimalsInDetails(FRXUSD_DECIMALS);
      },
    );
  });
});
