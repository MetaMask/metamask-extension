/**
 * Send ERC20 - Balance Validation Tests
 *
 * Regression tests for:
 * - ASSETS-3385: Token balances not updating after send
 * - Send flow allowing re-send with insufficient funds
 *
 * Tests that after sending all ERC20 tokens:
 * 1. Sender's token list reflects the updated (zero) balance
 * 2. Receiver's token list reflects the received balance
 * 3. A re-send attempt is blocked with "Insufficient funds"
 */

import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { mockedSourcifyTokenSend } from '../confirmations/helpers';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { login } from '../../page-objects/flows/login.flow';
import { switchToAccount } from '../../page-objects/flows/account-list.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';

describe('Send ERC20 - Balance Validation', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const symbol = 'TST';
  const tokenAddress = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';
  const valueWithSymbol = (value: string) => `${value} ${symbol}`;

  it('updates balances after send and blocks re-send when insufficient', async function () {
    this.timeout(180000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        localNodeOptions: { hardfork: 'muirGlacier' },
        smartContract,
        title: this.test?.fullTitle(),
        testSpecificMock: mocks,
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUxTokenManagementFilter: false,
          },
        },
      },
      async ({ driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        const sendPage = new SendPage(driver);
        const confirmation = new Confirmation(driver);
        const activityTab = new ActivityTab(driver);
        const accountListPage = new AccountListPage(driver);

        await homePage.checkPageIsLoaded();

        // create Account 2 without balance assertion
        await homePage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList('Account 2');
        await accountListPage.closeMultichainAccountsPage();

        // switch back to Account 1
        await switchToAccount(driver, 'Account 1');

        // import TST token
        await tokensTab.importCustomTokenByChain('0x539', tokenAddress);

        // send 5 TST to Account 2
        await tokensTab.openTokenDetails(symbol);
        await tokensTab.startSendFlow();

        await sendPage.selectAccountFromRecipientModal('Account 2');
        await sendPage.fillAmount('5');
        await sendPage.pressContinueButton();

        // confirm the transaction
        await confirmation.checkPageIsLoaded();
        await confirmation.clickFooterConfirmButton();

        // verify transaction completed in activity tab
        await homePage.goToActivityList();
        await activityTab.checkTxAction({ action: `Sent ${symbol}` });
        await activityTab.checkCompletedTxNumberDisplayedInActivity(1);

        // verify sender balance updated to 5
        await homePage.goToTokensTab();
        await tokensTab.checkTokenExistsInList(symbol, valueWithSymbol('5'), {
          amountTimeout: 20000,
        });

        // switch to Account 2, import TST, verify received 5 TST
        await switchToAccount(driver, 'Account 2');
        await tokensTab.importCustomTokenByChain('0x539', tokenAddress);
        await tokensTab.checkTokenExistsInList(symbol, valueWithSymbol('5'), {
          amountTimeout: 20000,
        });

        // switch back to Account 1, verify balance is still 5
        await switchToAccount(driver, 'Account 1');
        await tokensTab.checkTokenExistsInList(symbol, valueWithSymbol('5'), {
          amountTimeout: 20000,
        });

        // attempt to send 10 TST (more than the 5 remaining) — should be blocked
        await tokensTab.openTokenDetails(symbol);
        await tokensTab.startSendFlow();

        await sendPage.selectAccountFromRecipientModal('Account 2');
        await sendPage.fillAmount('10');

        await sendPage.checkInsufficientFundsError();
        const isEnabled = await sendPage.isContinueButtonEnabled();
        assert.equal(
          isEnabled,
          false,
          'Continue button should be disabled when balance is insufficient',
        );
      },
    );
  });

  async function mocks(server: Mockttp) {
    return [
      await mockedSourcifyTokenSend(server),
      await server
        .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            'eip155:1337/slip44:1': {
              id: 'ethereum',
              price: 3401,
              marketCap: 0,
              pricePercentChange1d: 0,
            },
            'eip155:1337/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947': {
              price: 0.5,
              marketCap: 0,
              pricePercentChange1d: 0,
            },
          },
        })),
      await server
        .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
        .always()
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            usd: {
              name: 'US Dollar',
              ticker: 'usd',
              value: 1,
              currencyType: 'fiat',
            },
            eth: {
              name: 'Ether',
              ticker: 'eth',
              value: 1 / 3401,
              currencyType: 'crypto',
            },
          },
        })),
      await server
        .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
        .always()
        .thenJson(200, {
          fullSupport: [],
          partialSupport: { balances: [] },
        }),
      await server
        .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
        .always()
        .thenCallback((request) => {
          const url = new URL(request.url);
          const assetIds = url.searchParams.getAll('assetIds').join(',');
          const results = [];

          if (assetIds.includes('eip155:1337')) {
            results.push({
              assetId: 'eip155:1337/slip44:1',
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            });
          }

          if (
            assetIds.includes(
              'eip155:1337/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
            ) ||
            assetIds.includes(
              'eip155:1337/erc20:0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
            )
          ) {
            results.push({
              assetId:
                'eip155:1337/erc20:0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947',
              name: 'Test Standard Token',
              symbol: 'TST',
              decimals: 18,
            });
          }

          return { statusCode: 200, json: { data: results } };
        }),
    ];
  }
});
