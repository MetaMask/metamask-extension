import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Mockttp } from '../../mock-e2e';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';

const NETWORK_NAME_MAINNET = 'Ethereum';

async function mockSwapSetup(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://min-api.cryptocompare.com/data/pricemulti')
      .withQuery({ fsyms: 'ETH,POL', tsyms: 'usd' })
      .thenCallback(() => ({
        statusCode: 200,
        json: { ETH: { USD: 2966.53 }, POL: { USD: 0.2322 } },
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/137/tokens')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),

    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/137/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/137/aggregatorMetadata')
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
    await mockServer
      .forGet('https://gas.api.cx.metamask.io/networks/137/suggestedGasFees')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          low: {
            suggestedMaxFeePerGas: '30',
            suggestedMaxPriorityFeePerGas: '30',
          },
          medium: {
            suggestedMaxFeePerGas: '40',
            suggestedMaxPriorityFeePerGas: '40',
          },
          high: {
            suggestedMaxFeePerGas: '50',
            suggestedMaxPriorityFeePerGas: '50',
          },
        },
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/tokens')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/topAssets')
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/aggregatorMetadata')
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
    await mockServer
      .forGet('https://gas.api.cx.metamask.io/networks/1/suggestedGasFees')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          low: {
            suggestedMaxFeePerGas: '30',
            suggestedMaxPriorityFeePerGas: '30',
          },
          medium: {
            suggestedMaxFeePerGas: '40',
            suggestedMaxPriorityFeePerGas: '40',
          },
          high: {
            suggestedMaxFeePerGas: '50',
            suggestedMaxPriorityFeePerGas: '50',
          },
        },
      })),
    await mockServer
      .forGet()
      .matching(
        (req) =>
          req.url?.includes('accounts.api.cx.metamask.io/v1/accounts/') &&
          req.url?.includes('/transactions'),
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: [],
      })),
    await mockServer
      .forGet()
      .matching(
        (req) =>
          req.url?.includes('accounts.api.cx.metamask.io/v2/accounts/') &&
          req.url?.includes('/balances'),
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          balances: [],
        },
      })),
    await mockServer
      .forGet(
        'https://static.cx.metamask.io/api/v1/tokenIcons/137/0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947.png',
      )
      .thenCallback(() => ({
        statusCode: 200,
        headers: { 'content-type': 'image/png' },
        body: Buffer.from(''),
      })),
    await mockServer
      .forGet(
        'https://static.cx.metamask.io/api/v1/tokenIcons/137/0x0000000000000000000000000000000000000000.png',
      )
      .thenCallback(() => ({
        statusCode: 200,
        headers: { 'content-type': 'image/png' },
        body: Buffer.from(''),
      })),
    await mockServer
      .forGet(
        'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      )
      .thenCallback(() => ({
        statusCode: 200,
        headers: { 'content-type': 'image/png' },
        body: Buffer.from(''),
      })),
    await mockServer
      .forGet()
      .matching(
        (req) =>
          req.url?.includes('static.cx.metamask.io/api/v1/tokenIcons/') &&
          req.url?.endsWith('.png'),
      )
      .thenCallback(() => ({
        statusCode: 200,
        headers: { 'content-type': 'image/png' },
        body: Buffer.from(''),
      })),
    await mockServer
      .forPost('https://sentry.io/api/273496/envelope/')
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}
function buildFixtures(title: string, chainId: number = 1337) {
  return {
    fixtures: new FixtureBuilder()
      .withNetworkControllerOnPolygon()
      .withTokensControllerERC20({ chainId })
      .withEnabledNetworks({
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.POLYGON]: true,
        },
      })
      .build(),
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
        },
      },
      {
        type: 'anvil',
        options: {
          port: 8546,
          chainId: 137,
        },
      },
    ],
    smartContract: SMART_CONTRACTS.HST,
    title,
    testSpecificMock: mockSwapSetup,
  };
}

describe('Multichain Asset List', function (this: Suite) {
  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string),
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, NETWORK_NAME_MAINNET);
        await assetListPage.check_tokenItemNumber(2);
        await assetListPage.clickOnAsset('Ethereum');
        await assetListPage.check_buySellButtonIsPresent();
        await assetListPage.check_multichainTokenListButtonIsPresent();
      },
    );
  });
  it('switches networks when clicking on send for a token on another network', async function () {
    await withFixtures(
      buildFixtures(this.test?.fullTitle() as string, 1337),
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await switchToNetworkFromSendFlow(driver, NETWORK_NAME_MAINNET);
        const sendPage = new SendTokenPage(driver);
        await assetListPage.check_tokenItemNumber(2);
        await assetListPage.clickOnAsset('Ethereum');
        await assetListPage.clickCoinSendButton();
        await sendPage.check_pageIsLoaded();
        await sendPage.fillRecipient(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await sendPage.clickAssetPickerButton();
        const assetPickerItems = await sendPage.getAssetPickerItems();
        assert.equal(
          assetPickerItems.length,
          1,
          'Two assets should be shown in the asset picker',
        );
      },
    );
  });
});
