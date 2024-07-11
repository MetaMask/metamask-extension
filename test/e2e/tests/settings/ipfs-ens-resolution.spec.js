const { strict: assert } = require('node:assert');
const { PAGES } = require('../../webdriver/driver');
const {
  defaultGanacheOptions,
  tinyDelayMs,
  unlockWallet,
  withFixtures,
} = require('../../helpers');

const FixtureBuilder = require('../../fixture-builder');
const { mockServerJsonRpc } = require('../ppom/mocks/mock-server-json-rpc');

const BALANCE_CHECKER = '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39';
const ENS_PUBLIC_RESOLVER = '0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41';
const ENS_REGISTRY_WITH_FALLBACK = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    [
      'eth_blockNumber',
      {
        methodResultVariant: 'custom',
      },
    ],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    ['eth_getTransactionCount'],
    ['net_version'],
  ]);

  // Resolver Call
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          to: ENS_REGISTRY_WITH_FALLBACK,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41',
        },
      };
    });

  // Supports Interface Call
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          data: '0x01ffc9a7bc1c58d100000000000000000000000000000000000000000000000000000000',
          to: ENS_PUBLIC_RESOLVER,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
      };
    });

  // Supports Interface Call
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          data: '0x01ffc9a7d8389dc500000000000000000000000000000000000000000000000000000000',
          to: ENS_PUBLIC_RESOLVER,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      };
    });

  // Content Hash Call
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          data: '0xbc1c58d1e650784434622eeb4ffbbb3220ebb371e26ad1a77f388680d42d8b1624baa6df',
          to: ENS_PUBLIC_RESOLVER,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
        },
      };
    });

  // Token Balance Call
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          to: BALANCE_CHECKER,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      };
    });
}

describe('Settings', function () {
  const ENS_NAME = 'metamask.eth';
  const ENS_NAME_URL = `https://${ENS_NAME}/`;
  const ENS_DESTINATION_URL = `https://app.ens.domains/name/${ENS_NAME}`;

  it(`Redirects to ENS domains when user inputs ENS into address bar`, async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
        driverOptions: {
          proxyPort: '8001',
        },
      },
      async ({ driver }) => {
        // if the background/offscreen pages are ready metamask should be ready
        // to handle ENS domain resolution
        const page =
          process.env.ENABLE_MV3 === 'false'
            ? PAGES.BACKGROUND
            : PAGES.OFFSCREEN;
        await driver.navigate(page);

        // The setting defaults to "on" so we can simply enter an ENS address
        // into the address bar and listen for address change
        try {
          await driver.openNewPage(ENS_NAME_URL);
        } catch (e) {
          // Ignore ERR_CONNECTION_RESET as it's an intentional return value
          // by our mocks
          if (!e.message.includes('ERR_CONNECTION_RESET')) {
            throw e;
          }
        }

        const currentUrl = await driver.getCurrentUrl();
        assert.equal(currentUrl, ENS_DESTINATION_URL);
      },
    );
  });

  it('Does not fetch ENS data for ENS Domain when ENS and IPFS switched off', async function () {
    let server;

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        testSpecificMock: (mockServer) => {
          server = mockServer;
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // goes to the settings screen
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        // turns off IPFS setting
        await driver.clickElement('[data-testid="ipfsToggle"] .toggle-button');

        // turns off ENS domain resolution
        await driver.clickElement(
          '[data-testid="ipfs-gateway-resolution-container"] .toggle-button',
        );

        // Now that we no longer need the MetaMask UI, and want the browser
        // to handle the request error, we need to stop the server
        await server.stop();

        try {
          await driver.openNewPage(ENS_NAME_URL);
        } catch (e) {
          // Ignore ERR_PROXY_CONNECTION_FAILED error
          // since all we care about is getting to the correct URL
        }

        // Ensure that the redirect to ENS Domains does not happen
        // Instead, the domain will be kept which is a 404
        await driver.wait(async () => {
          const currentUrl = await driver.getCurrentUrl();
          return currentUrl === ENS_NAME_URL;
        }, tinyDelayMs);
      },
    );
  });
});
