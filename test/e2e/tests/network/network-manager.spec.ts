import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { getCleanAppState, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import SelectNetworkModal, {
  NetworkId,
} from '../../page-objects/pages/networks/select-network-modal';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TestDapp from '../../page-objects/pages/test-dapp';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/add-network-confirmations';
import { getMockAssetsPrice } from '../tokens/utils/mocks';

const MUSD_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const MUSD_MAINNET_ASSET_ID = `eip155:1/erc20:${MUSD_ADDRESS}`;
const MUSD_LINEA_ASSET_ID = `eip155:59144/erc20:${MUSD_ADDRESS}`;

// Keep this synthetic chain outside bundled and default network definitions so
// Config Registry must add it during every run of this regression test.
const FAKE_CONFIG_REGISTRY_CAIP_CHAIN_ID = 'eip155:4294967294';
const FAKE_CONFIG_REGISTRY_HEX_CHAIN_ID = '0xfffffffe';
const FAKE_CONFIG_REGISTRY_NETWORK_NAME = 'New Fake Network';
const CONFIG_REGISTRY_API_URL =
  'https://client-config.api.cx.metamask.io/v1/config/networks';

// Config Registry makes the network picker show the new network before the asynchronous
// NetworkEnablementController handler has processed NetworkController:networkAdded.
// Wait for both controller updates so this test asserts the completed transition.
async function waitForFakeNetworkToBeAutoEnabled(
  driver: Driver,
): Promise<void> {
  await driver.wait(async () => {
    const state = await getCleanAppState(driver);

    return Boolean(
      state.metamask.networkConfigurationsByChainId[
        FAKE_CONFIG_REGISTRY_HEX_CHAIN_ID
      ] &&
      state.metamask.nativeAssetIdentifiers[FAKE_CONFIG_REGISTRY_CAIP_CHAIN_ID],
    );
  });
}

async function mockConfigRegistryWithAutoEnabledFakeNetwork(
  mockServer: Mockttp,
  responseReady: Promise<void>,
) {
  return [
    // Hold the registry response until the test has established its Localhost-only
    // starting state. Otherwise the fake network can be auto-added while login is
    // still loading.
    await mockServer
      .forGet(CONFIG_REGISTRY_API_URL)
      .always()
      .thenCallback(async () => {
        await responseReady;

        return {
          statusCode: 200,
          json: {
            data: {
              version: '1.0.0',
              timestamp: 0,
              chains: [
                {
                  chainId: FAKE_CONFIG_REGISTRY_CAIP_CHAIN_ID,
                  name: FAKE_CONFIG_REGISTRY_NETWORK_NAME,
                  imageUrl:
                    'https://config-registry-fake-network.invalid/icon.png',
                  coingeckoPlatformId: 'config-registry-fake-network',
                  assets: {
                    native: {
                      assetId: `${FAKE_CONFIG_REGISTRY_CAIP_CHAIN_ID}/slip44:60`,
                      imageUrl:
                        'https://config-registry-fake-network.invalid/token.png',
                      name: FAKE_CONFIG_REGISTRY_NETWORK_NAME,
                      symbol: 'FakeCoin',
                      decimals: 18,
                    },
                  },
                  rpcProviders: {
                    default: {
                      url: 'https://responsive-rpc.test/',
                      type: 'custom',
                      networkClientId: 'config-registry-fake-network',
                    },
                    fallbacks: [],
                  },
                  blockExplorerUrls: {
                    default: 'https://config-registry-fake-network.invalid',
                    fallbacks: [],
                  },
                  config: {
                    isActive: true,
                    isTestnet: false,
                    isDefault: true,
                    isFeatured: true,
                    isDeprecated: false,
                    isDeletable: false,
                    isAutoEnabled: true,
                    priority: 1,
                  },
                },
              ],
            },
          },
        };
      }),
    // NetworkController validates the new network RPC while adding it. A dedicated mock
    // avoids reusing Localhost's endpoint, which would reject it as a duplicate.
    await mockServer
      .forPost('https://responsive-rpc.test/')
      .always()
      .thenCallback(async (request) => {
        const requestBody = (await request.body.getJson()) as { id: unknown };

        return {
          statusCode: 200,
          json: {
            id: requestBody.id,
            jsonrpc: '2.0',
            result: FAKE_CONFIG_REGISTRY_HEX_CHAIN_ID,
          },
        };
      }),
  ];
}

function buildTokenFilterFixtures() {
  return new FixtureBuilderV2()
    .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
    .withEnabledNetworks({ eip155: { '0x1': true } })
    .withAssetsController({
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          'eip155:1/slip44:60': { amount: '25' },
          'eip155:59144/slip44:60': { amount: '25' },
          [MUSD_MAINNET_ASSET_ID]: { amount: '100' },
          [MUSD_LINEA_ASSET_ID]: { amount: '100' },
        },
      },
      assetsPrice: getMockAssetsPrice(),
      assetsInfo: {
        'eip155:1/slip44:60': {
          type: 'native',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
        },
        'eip155:59144/slip44:60': {
          type: 'native',
          decimals: 18,
          symbol: 'ETH',
          name: 'Ethereum',
        },
        [MUSD_MAINNET_ASSET_ID]: {
          type: 'erc20',
          decimals: 6,
          symbol: 'MUSD',
          name: 'MUSD',
        },
        [MUSD_LINEA_ASSET_ID]: {
          type: 'erc20',
          decimals: 6,
          symbol: 'MUSD',
          name: 'MUSD',
        },
      },
    })
    .build();
}

async function mockLineaAndMusd(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v3/spot-prices')
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          'eip155:1/slip44:60': {
            id: 'ethereum',
            price: 2500,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
          'eip155:59144/slip44:60': {
            id: 'ethereum',
            price: 2500,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
          [`eip155:1/erc20:${MUSD_ADDRESS.toLowerCase()}`]: {
            price: 1,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
          [`eip155:59144/erc20:${MUSD_ADDRESS.toLowerCase()}`]: {
            price: 1,
            marketCap: 0,
            pricePercentChange1d: 0,
          },
        },
      })),
    await mockServer
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
            value: 1 / 2500,
            currencyType: 'crypto',
          },
        },
      })),
    await mockServer
      .forGet('https://accounts.api.cx.metamask.io/v2/supportedNetworks')
      .always()
      .thenJson(200, {
        fullSupport: [],
        partialSupport: [],
      }),
    await mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
      .always()
      .thenCallback((request) => {
        const url = new URL(request.url);
        const assetIds = url.searchParams.getAll('assetIds').join(',');
        const results = [];

        if (
          assetIds.includes('eip155:1/slip44:60') ||
          assetIds.includes('eip155:1/')
        ) {
          results.push({
            assetId: 'eip155:1/slip44:60',
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        if (assetIds.includes('eip155:59144')) {
          results.push({
            assetId: 'eip155:59144/slip44:60',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          });
        }

        if (
          assetIds
            .toLowerCase()
            .includes(`eip155:1/erc20:${MUSD_ADDRESS.toLowerCase()}`)
        ) {
          results.push({
            assetId: `eip155:1/erc20:${MUSD_ADDRESS}`,
            name: 'MUSD',
            symbol: 'MUSD',
            decimals: 6,
          });
        }

        if (
          assetIds
            .toLowerCase()
            .includes(`eip155:59144/erc20:${MUSD_ADDRESS.toLowerCase()}`)
        ) {
          results.push({
            assetId: `eip155:59144/erc20:${MUSD_ADDRESS}`,
            name: 'MUSD',
            symbol: 'MUSD',
            decimals: 6,
          });
        }

        return { statusCode: 200, json: { data: results } };
      }),
  ];
}

describe('Network Manager', function (this: Suite) {
  it('should reflect the enabled networks state in the network manager', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await selectNetworkModal.checkNetworkIsDeselected(NetworkId.LINEA);
      },
    );
  });

  it('should reflect the enabled networks state in the network manager, when multiple networks are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true, '0xe708': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { expectedBalance: '$0.00' });
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();

        // there cannot be an inbetween value, either 1 network or all networks. So the controller updates to all networks
        await selectNetworkModal.checkAllPopularNetworksIsSelected();
      },
    );
  });

  it('keeps Localhost selected when Config Registry auto-adds a network', async function () {
    // Regression: Arc originally exposed that adding an auto-enabled Config Registry
    // network could replace a user's single-network filter, switching Localhost to
    // the added network.
    let releaseConfigRegistryResponse: () => void;
    const configRegistryResponseReady = new Promise<void>((resolve) => {
      releaseConfigRegistryResponse = resolve;
    });

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.LOCALHOST)
          .withEnabledNetworks({ eip155: { '0x539': true } })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) =>
          mockConfigRegistryWithAutoEnabledFakeNetwork(
            mockServer,
            configRegistryResponseReady,
          ),
      },
      async ({ driver }: { driver: Driver }) => {
        // Start with the fixture's single Localhost selection fully rendered.
        await login(driver);

        const networkFilter = new NetworkFilter(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        await networkFilter.checkLabelIs('Network: Localhost 8545');

        // Only now return the fake network from Config Registry, then wait until both the
        // NetworkController and NetworkEnablementController have handled it.
        releaseConfigRegistryResponse();
        await waitForFakeNetworkToBeAutoEnabled(driver);

        // The fake network must be available but must not replace the Localhost-only filter.
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();

        await selectNetworkModal.checkNetworkIsListed(
          FAKE_CONFIG_REGISTRY_NETWORK_NAME,
        );
        await selectNetworkModal.checkNetworkIsDeselected(
          FAKE_CONFIG_REGISTRY_CAIP_CHAIN_ID,
        );
        await selectNetworkModal.checkNetworkIsSelected('eip155:1337');
        await selectNetworkModal.close();
        await networkFilter.checkLabelIs('Network: Localhost 8545');
      },
    );
  });

  it('should select and deselect multiple default networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();

        // Assert - initial Network Manager State (eth selected, linea deselected)
        await selectNetworkModal.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await selectNetworkModal.checkNetworkIsDeselected(NetworkId.LINEA);

        // Act Assert - select linea will deselect etherum and select linea
        await selectNetworkModal.selectNetworkByChainId(NetworkId.LINEA);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsSelected(NetworkId.LINEA);
        await selectNetworkModal.checkNetworkIsDeselected(NetworkId.ETHEREUM);
        await selectNetworkModal.close();

        // Act Assert - select ethereum will deselect linea and select ethereum
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.ETHEREUM);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsDeselected(NetworkId.LINEA);
        await selectNetworkModal.checkNetworkIsSelected(NetworkId.ETHEREUM);
        await selectNetworkModal.close();
      },
    );
  });

  it('should filter tokens by enabled networks', async function () {
    await withFixtures(
      {
        fixtures: buildTokenFilterFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockLineaAndMusd,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const tokensTab = new TokensTab(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);

        // Only Ethereum native token and MUSD
        await tokensTab.checkTokenItemNumber(2);

        // Change to Linea, only Linea native token and MUSD visible
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.LINEA);
        await tokensTab.checkTokenItemNumber(2);

        // Change to Ethereum, only Ethereum native token and MUSD visible
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.selectNetworkByChainId(NetworkId.ETHEREUM);
        await tokensTab.checkTokenItemNumber(2);
      },
    );
  });

  it('should preserve existing enabled networks when adding a network via dapp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Add network via dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const addEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xa86a', // avalanche mainnet
              chainName: 'Avalanche',
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8546'],
              blockExplorerUrls: ['https://snowtrace.io'],
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${addEthereumChainRequest})`,
        );

        // Approve the network addition
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.checkPageIsLoaded('Avalanche');
        await addNetworkConfirmation.approveAddNetwork();

        // Switch back to MetaMask to verify preservation
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Now verify both networks are preserved in network manager
        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();

        // New network is selected (we do not keep both networks on, as UI does only supports single or all popular networks)
        await selectNetworkModal.checkNetworkIsSelected(NetworkId.AVALANCHE);
      },
    );
  });

  it('should deselect all networks when adding a custom network via dapp', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withEnabledNetworks({
            eip155: {
              '0x1': true, // Start with only Ethereum
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
              chainId: 1338, // Custom network
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Add custom network via dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const addEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x53a',
              chainName: 'Custom Test Network',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://localhost:8546'],
              blockExplorerUrls: ['https://example.com'],
            },
          ],
        });

        await driver.executeScript(
          `window.ethereum.request(${addEthereumChainRequest})`,
        );

        // Approve the network addition
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.checkPageIsLoaded('Custom Test Network');
        await addNetworkConfirmation.approveAddNetwork();

        // Switch back to MetaMask to verify behavior
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const selectNetworkModal = new SelectNetworkModal(driver);
        const networkFilter = new NetworkFilter(driver);

        // Now check the network manager state
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();

        // Verify Ethereum is deselected
        await selectNetworkModal.checkNetworkIsDeselected(NetworkId.ETHEREUM);
      },
    );
  });
});
