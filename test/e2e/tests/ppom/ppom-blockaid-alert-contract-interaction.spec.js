const FixtureBuilder = require('../../fixture-builder');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_estimateGas'],
    [
      'eth_call',
      {
        params: [
          {
            to: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
            data: '0xf0002ea90000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
          },
        ],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000006c8aafe1077a8',
      },
    ],
    [
      'eth_call',
      {
        params: [
          {
            to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
            data: '0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000',
          },
        ],
        error: {
          code: -32000,
          message: 'execution reverted',
        },
      },
    ],
    [
      'eth_call',
      {
        params: [
          {
            to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
            data: '0x01ffc9a7d9b67a2600000000000000000000000000000000000000000000000000000000',
          },
        ],
        error: {
          code: -32000,
          message: 'execution reverted',
        },
      },
    ],
    [
      'eth_call',
      {
        params: [
          {
            to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
            data: '0x95d89b41',
          },
        ],
        error: {
          code: -32000,
          message: 'execution reverted',
        },
      },
    ],
    [
      'eth_call',
      {
        params: [
          {
            to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
            data: '0x313ce567',
          },
        ],
        error: {
          code: -32000,
          message: 'execution reverted',
        },
      },
    ],
    [
      'eth_getStorageAt',
      {
        params: [
          '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
          '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',
        ],
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    ],
    [
      'eth_getStorageAt',
      {
        params: [
          '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
          '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
        ],
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    ],
    ['eth_getBlockByNumber'],
    ['eth_getBalance'],
    [
      'eth_getCode',
      {
        params: ['0x00008f1149168c1d2fa1eba1ad3e9cd644510000'],
        result:
          '0x6080604052600436106100545760003560e01c8062f714ce1461005957806312065fe0146100825780633158952e146100ad578063715018a6146100b75780638da5cb5b146100ce578063f2fde38b146100f9575b600080fd5b34801561006557600080fd5b50610080600480360381019061007b91906104d4565b610122565b005b34801561008e57600080fd5b50610097610227565b6040516100a49190610523565b60405180910390f35b6100b561022f565b005b3480156100c357600080fd5b506100cc610231565b005b3480156100da57600080fd5b506100e3610245565b6040516100f0919061054d565b60405180910390f35b34801561010557600080fd5b50610120600480360381019061011b9190610568565b61026e565b005b61012a6102f1565b4782111561016d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161016490610618565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036101dc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016101d3906106aa565b60405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff166108fc839081150290604051600060405180830381858888f19350505050158015610222573d6000803e3d6000fd5b505050565b600047905090565b565b6102396102f1565b610243600061036f565b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6102766102f1565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036102e5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016102dc9061073c565b60405180910390fd5b6102ee8161036f565b50565b6102f9610433565b73ffffffffffffffffffffffffffffffffffffffff16610317610245565b73ffffffffffffffffffffffffffffffffffffffff161461036d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610364906107a8565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b600033905090565b600080fd5b6000819050919050565b61045381610440565b811461045e57600080fd5b50565b6000813590506104708161044a565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006104a182610476565b9050919050565b6104b181610496565b81146104bc57600080fd5b50565b6000813590506104ce816104a8565b92915050565b600080604083850312156104eb576104ea61043b565b5b60006104f985828601610461565b925050602061050a858286016104bf565b9150509250929050565b61051d81610440565b82525050565b60006020820190506105386000830184610514565b92915050565b61054781610496565b82525050565b6000602082019050610562600083018461053e565b92915050565b60006020828403121561057e5761057d61043b565b5b600061058c848285016104bf565b91505092915050565b600082825260208201905092915050565b7f52657175657374656420616d6f756e7420657863656564732074686520636f6e60008201527f74726163742062616c616e63652e000000000000000000000000000000000000602082015250565b6000610602602e83610595565b915061060d826105a6565b604082019050919050565b60006020820190508181036000830152610631816105f5565b9050919050565b7f526563697069656e7420616464726573732063616e6e6f74206265207468652060008201527f7a65726f20616464726573732e00000000000000000000000000000000000000602082015250565b6000610694602d83610595565b915061069f82610638565b604082019050919050565b600060208201905081810360008301526106c381610687565b9050919050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b6000610726602683610595565b9150610731826106ca565b604082019050919050565b6000602082019050818103600083015261075581610719565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b6000610792602083610595565b915061079d8261075c565b602082019050919050565b600060208201905081810360008301526107c181610785565b905091905056fea2646970667358221220ac74f30418aa2326105b7dea03d605de28d6069773bd4b434837ceb2008a023a64736f6c63430008130033',
      },
    ],
    [
      'eth_getTransactionCount',
      {
        params: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
        result: '0x0',
      },
    ],
  ]);

  await mockServer
    .forPost(/infura/u)
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [
        {
          accessList: [],
          data: '0xef5cfb8c0000000000000000000000000b3e87a076ac4b0d1975f0f232444af6deb96c59',
          from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          gas: '0x1c9c380',
          maxFeePerGas: '0x1fc3f678c',
          maxPriorityFeePerGas: '0x0',
          to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
          type: '0x02',
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          error: {
            code: -32601,
            message:
              'The method debug_traceCall does not exist/is not available',
          },
        },
      };
    });

  await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    .withQuery({ hex_signature: '0xef5cfb8c' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 187294,
            created_at: '2021-05-12T10:20:16.502438Z',
            text_signature: 'claimRewards(address)',
            hex_signature: '0xef5cfb8c',
            bytes_signature: 'ï\\û',
          },
        ],
      },
    }));
}

describe('PPOM Blockaid Alert - Malicious Contract interaction @no-mmi', function () {
  it('should show banner alert', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp({
            useLocalhostHostname: true,
          })
          .withPreferencesController({
            securityAlertsEnabled: true,
            preferences: {
              redesignedTransactionsEnabled: true,
              redesignedConfirmationsEnabled: true,
              isRedesignedConfirmationsDeveloperEnabled: true,
            },
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver, null, 'http://localhost:8080');

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, a third party known for scams will take all your assets.';

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousContractInteractionButton');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.assertElementNotPresent('.loading-indicator');

        await driver.findElement({
          css: '[data-testid="confirm-banner-alert"]',
          text: expectedTitle,
        });

        await driver.findElement({
          css: '[data-testid="confirm-banner-alert"]',
          text: expectedDescription,
        });
      },
    );
  });
});
