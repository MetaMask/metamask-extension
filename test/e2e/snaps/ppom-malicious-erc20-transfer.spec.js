const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { mockServerJsonRpc } = require('../mock-server-json-rpc');

const {
  defaultGanacheOptions,
  getWindowHandles,
  openDapp,
  unlockWallet,
  withFixtures,
} = require('../helpers');

const {
  CHAIN_IDS,
  NETWORK_TYPES,
} = require('../../../shared/constants/network');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';
const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const mainnetProviderConfig = {
  providerConfig: {
    chainId: CHAIN_IDS.MAINNET,
    nickname: '',
    rpcUrl: '',
    type: NETWORK_TYPES.MAINNET,
  },
};

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [['eth_getBlockByNumber']]);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x27d17a5b79f77509541',
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ accessList: [], data: '0x00000000' }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
              {
                error: 'execution reverted',
                from: USDC_ADDRESS,
                gas: '0x1d55c2c7',
                gasUsed: '0xf0',
                input: '0x00000000',
                to: '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf',
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x6f79',
            input: '0x00000000',
            to: USDC_ADDRESS,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ from: selectedAddress }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
              {
                from: USDC_ADDRESS,
                gas: '0x2923d',
                gasUsed: '0x4cac',
                input:
                  '0xa9059cbb0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa30000000000000000000000000000000000000000000000000000000000000064',
                logs: [
                  {
                    address: USDC_ADDRESS,
                    data: '0x0000000000000000000000000000000000000000000000000000000000000064',
                    topics: [
                      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                      '0x0000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1',
                      '0x0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3',
                    ],
                  },
                ],
                output:
                  '0x0000000000000000000000000000000000000000000000000000000000000001',
                to: '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf',
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            from: selectedAddress,
            gas: '0x30d40',
            gasUsed: '0xbd69',
            input:
              '0xa9059cbb0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa30000000000000000000000000000000000000000000000000000000000000064',
            output:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            to: USDC_ADDRESS,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_blockNumber' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x116fecf',
        },
      };
    });

  // balanceOf (address) to USDC
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          accessList: [],
          data: `0x70a082310000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1`,
          to: USDC_ADDRESS,
        },
      ],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result:
            '0x000000000000000000000000000000000000000000000000000000000001ea4c',
        },
      };
    });

  // get contract code USDC
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_getCode',
      params: [USDC_ADDRESS],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result:
            '0x60806040526004361061006d576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680633659cfe6146100775780634f1ef286146100ba5780635c60da1b146101085780638f2839701461015f578063f851a440146101a2575b6100756101f9565b005b34801561008357600080fd5b506100b8600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610213565b005b610106600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001908201803590602001919091929391929390505050610268565b005b34801561011457600080fd5b5061011d610308565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b34801561016b57600080fd5b506101a0600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610360565b005b3480156101ae57600080fd5b506101b761051e565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610201610576565b61021161020c610651565b610682565b565b61021b6106a8565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561025c57610257816106d9565b610265565b6102646101f9565b5b50565b6102706106a8565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156102fa576102ac836106d9565b3073ffffffffffffffffffffffffffffffffffffffff163483836040518083838082843782019150509250505060006040518083038185875af19250505015156102f557600080fd5b610303565b6103026101f9565b5b505050565b60006103126106a8565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614156103545761034d610651565b905061035d565b61035c6101f9565b5b90565b6103686106a8565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561051257600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614151515610466576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260368152602001807f43616e6e6f74206368616e6765207468652061646d696e206f6620612070726f81526020017f787920746f20746865207a65726f20616464726573730000000000000000000081525060400191505060405180910390fd5b7f7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f61048f6106a8565b82604051808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a161050d81610748565b61051b565b61051a6101f9565b5b50565b60006105286106a8565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561056a576105636106a8565b9050610573565b6105726101f9565b5b90565b61057e6106a8565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614151515610647576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260328152602001807f43616e6e6f742063616c6c2066616c6c6261636b2066756e6374696f6e20667281526020017f6f6d207468652070726f78792061646d696e000000000000000000000000000081525060400191505060405180910390fd5b61064f610777565b565b6000807f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c36001029050805491505090565b3660008037600080366000845af43d6000803e80600081146106a3573d6000f35b3d6000fd5b6000807f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b6001029050805491505090565b6106e281610779565b7fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b81604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390a150565b60007f10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b60010290508181555050565b565b60006107848261084b565b151561081e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603b8152602001807f43616e6e6f742073657420612070726f787920696d706c656d656e746174696f81526020017f6e20746f2061206e6f6e2d636f6e74726163742061646472657373000000000081525060400191505060405180910390fd5b7f7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c360010290508181555050565b600080823b9050600081119150509190505600a165627a7a72305820a4a547cfc7202c5acaaae74d428e988bc62ad5024eb0165532d3a8f91db4ed240029',
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_estimateGas' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x5cec',
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({ method: 'eth_gasPrice' })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: '0x09184e72a000',
        },
      };
    });

  // balance checker
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{ to: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39' }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000091d6cb8fbf55100000000000000000000000000000000000000000000000000014e4d6652a8200000000000000000000000000000000000000000000000000001beca58919dc000000000000000000000000000000000000000000000000000177480e2c2667f0000000000000000000000000000000000000000000000000001d9ae54845818000000000000000000000000000000000000000000000000000009184e72a000',
        },
      };
    });

  // oracle
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{ to: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b' }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result:
            '0x0000000000000000000000000000000000000000000000000ddfe4d79cbd3de5',
        },
      };
    });

  // Balance of USDC
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{ to: USDC_ADDRESS }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result:
            '0x000000000000000000000000000000000000000000000000000000000001ea4c',
        },
      };
    });
}

describe('PPOM Blockaid Alert - Malicious ERC20 Transfer', function () {
  it('should show banner alert', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController(mainnetProviderConfig)
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.title,
      },

      async ({ driver }) => {
        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, a third party known for scams will take all your assets.';

        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousERC20TransferButton');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await getWindowHandles(driver, 3); // TODO: delete. triple-check race-condition issue
        await driver.switchToWindowWithTitle('MetaMask Notification');

        const bannerAlertFoundByTitle = await driver.findElement({
          css: bannerAlertSelector,
          text: expectedTitle,
        });

        assert(
          bannerAlertFoundByTitle,
          `Banner alert not found. Expected Title: ${expectedTitle} \nExpected reason: transfer_farming\n`,
        );
        assert(
          bannerAlertFoundByTitle.includes(expectedDescription),
          `Unexpected banner alert description. Expected: ${expectedDescription} \nExpected reason: transfer_farming\n`,
        );
      },
    );
  });
});
