const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  getEventPayloads,
  DAPP_ONE_URL,
  DAPP_URL,
  switchToNotificationWindow,
  defaultGanacheOptions,
} = require('../../helpers');
const {
  MetaMetricsEventName,
} = require('../../../../shared/constants/metametrics');
const FixtureBuilder = require('../../fixture-builder');

async function mockSegment(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          { type: 'track', event: MetaMetricsEventName.NavNetworkSwitched },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Track Event Test', function () {
  it('should send a track event when changing networks', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTwoTestDapps()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port: 8546, chainId: 1338 }],
        },
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        // open two dapps
        await openDapp(driver, undefined, DAPP_URL);
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // switchEthereumChain request
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        // Initiate switchEthereumChain on Dapp Two
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Confirm switchEthereumChain
        await switchToNotificationWindow(driver, 4);
        await driver.findClickableElements({
          text: 'Switch network',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // Verifying the track event
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].properties, {
          location: 'Switch Modal',
          from_network: '0x1',
          to_network: '0x2',
          referrer: { url: window.location.origin },
        });
      },
    );
  });
});
