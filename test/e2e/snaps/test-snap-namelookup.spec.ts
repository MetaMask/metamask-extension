import { Mockttp } from 'mockttp';

import { Driver } from '../webdriver/driver';
import HomePage from '../page-objects/pages/home/homepage';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { login } from '../page-objects/flows/login.flow';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockLookupSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import SendPage from '../page-objects/pages/send/send-page';
import { mockSpotPrices } from '../tests/tokens/utils/mocks';

async function mockTokensApiSupportedNetworks(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenJson(200, {
      fullSupport: ['eip155:1', 'eip155:1337'],
      partialSupport: [],
    });
}

async function mockTokensApiV3Assets(mockServer: Mockttp) {
  return mockServer
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
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1337/slip44/60.png',
          coingeckoId: 'ethereum',
        });
      }

      if (assetIds.includes('eip155:1')) {
        results.push({
          assetId: 'eip155:1/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
          coingeckoId: 'ethereum',
        });
      }

      return { statusCode: 200, json: results };
    });
}

describe('Name lookup', function () {
  it('validate the recipient address appears in the send flow', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withShowNativeTokenAsMainBalanceEnabled()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockLookupSnap(mockServer),
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          }),
          await mockTokensApiSupportedNetworks(mockServer),
          await mockTokensApiV3Assets(mockServer),
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);

        // Open a new tab and navigate to test snaps page and click name lookup
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNameLookUpButton',
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        // Navigate to the extension home page and validate the recipient address in the send flow
        await homePage.startSendFlow();

        await sendPage.selectToken('0x1', 'ETH');
        await sendPage.fillRecipient('metamask.domain');

        await driver.findElement({ text: '0xc0ffe...54979' });
      },
    );
  });
});
