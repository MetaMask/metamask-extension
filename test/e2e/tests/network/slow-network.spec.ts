import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { NetworkStatus } from '@metamask/network-controller';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import LoginPage from '../../page-objects/pages/login-page';

describe('Slow network', function (this: Suite) {
  it('does not show the spinner while attempting to determine the network status', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ inputChainId: '0x539' })
          .withNetworkController({
            networkConfigurations: {
              'AAAA-AAAA-AAAA-AAAA': {
                id: 'AAAA-AAAA-AAAA-AAAA',
                chainId: '0x9999',
                nickname: 'A Custom Network',
                rpcUrl: 'https://customnetwork.test',
                ticker: 'ETH',
                blockExplorerUrl: undefined,
              },
            },
            networksMetadata: {
              'AAAA-AAAA-AAAA-AAAA': {
                EIPS: {},
                status: NetworkStatus.Unknown,
              },
            },
            selectedNetworkClientId: 'AAAA-AAAA-AAAA-AAAA',
            providerConfig: {
              id: 'AAAA-AAAA-AAAA-AAAA',
            },
          })
          .withEnabledNetworks({
            eip155: {
              '0x9999': true,
            },
          })
          .build(),
        localNodeOptions: 'none',
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          // Cause requests to the network to be pending indefinitely
          return await mockServer
            .forPost('https://customnetwork.test')
            .thenPassThrough({
              beforeRequest: async () => {
                // Wait long enough to cause a timeout
                await new Promise<void>((resolve) => {
                  setTimeout(() => {
                    resolve();
                  }, 10000);
                });
                return undefined;
              },
            });
        },
      },
      async ({ driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        // Ensure that the connection spinner shows up.
        // This wouldn't happen if we waited for the net_version (mocked above)
        // to fully resolve.
        await driver.waitForSelector({
          text: 'Connecting to A Custom Network',
        });
      },
    );
  });
});
