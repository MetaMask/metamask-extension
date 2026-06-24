/**
 * Token Persistence on Custom Network Tests
 *
 * Regression test for #incident-metamask-1731:
 * Imported tokens on a custom network disappear after reloading the wallet.
 *
 * Verifies that a token imported via the UI persists after an extension reload.
 */

import { Mockttp } from 'mockttp';
import { mockedSourcifyTokenSend } from '../confirmations/helpers';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { login } from '../../page-objects/flows/login.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';

describe('Token persistence on custom network', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const symbol = 'TST';
  const tokenAddress = '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947';
  const valueWithSymbol = (value: string) => `${value} ${symbol}`;

  it('imported token persists after extension reload', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
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
        await login(driver, { validateBalance: false });

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);

        await homePage.checkPageIsLoaded();

        // import TST token and verify it exists
        await tokensTab.importCustomTokenByChain('0x539', tokenAddress);
        await tokensTab.checkTokenExistsInList(
          symbol,
          valueWithSymbol('10'),
          { amountTimeout: 20000 },
        );

        // reload the extension — restarts the service worker and restores from storage
        await driver.refresh();

        // verify token still exists after reload
        await homePage.checkPageIsLoaded();
        await tokensTab.checkTokenExistsInList(
          symbol,
          valueWithSymbol('10'),
          { amountTimeout: 20000 },
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
