import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { defaultGanacheOptions, withFixtures, editGasFeeForm } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import ConfirmTxPage from '../../page-objects/pages/send/confirm-tx-page';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import { mockMultiNetworkBalancePolling } from '../../mock-balance-polling/mock-balance-polling';

describe('ENS', function (this: Suite) {
  const sampleAddress: string = '1111111111111111111111111111111111111111';

  // Having 2 versions of the address is a bug(#25286)
  const shortSampleAddress = '0x1111...1111';
  const shortSampleAddresV2 = '0x11111...11111';
  const chainId = 1;

  // ENS Contract Addresses and Function Signatures
  const ENSRegistryWithFallback: string =
    '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e';
  const resolverSignature: string = '0x0178b8bf';
  const ensNode: string =
    'eb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1';
  const resolverNodeAddress: string =
    '226159d592e2b063810a10ebf6dcbada94ed68b8';
  const supportsInterfaceSignature: string = '0x01ffc9a7';
  const addressSignature: string = '0x3b3b57de';
  const sampleEnsDomain: string = 'test.eth';

  async function mockInfura(mockServer: MockttpServer): Promise<void> {
    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_blockNumber' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x1',
        },
      }));

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBalance' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0xDE0B6B3A7640000', // 1 ETH in hex
        },
      }));

    await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: {},
        },
      }));
    await mockMultiNetworkBalancePolling(mockServer);

      await mockServer
      .forPost(infuraUrl)
      .withJsonBodyIncluding({ method: 'net_version' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: { id: 8262367391254633, jsonrpc: '2.0', result: '1' },
        };
      });

    await mockServerJsonRpc(mockServer, [
      ['eth_blockNumber'],
      ['eth_getBlockByNumber'],
      ['eth_chainId', { result: `0x${chainId}` }],
      // 1. Get the address of the resolver for the specified node
      [
        'eth_call',
        {
          params: [
            {
              to: ENSRegistryWithFallback,
              data: `${resolverSignature}${ensNode}`,
            },
          ],
          result: `0x000000000000000000000000${resolverNodeAddress}`,
        },
      ],
      // 2. Check supportsInterface from the public resolver
      [
        'eth_call',
        {
          params: [
            {
              to: `0x${resolverNodeAddress}`,
              data: `${supportsInterfaceSignature}9061b92300000000000000000000000000000000000000000000000000000000`,
            },
          ],
          result: `0x0000000000000000000000000000000000000000000000000000000000000000`,
        },
      ],
      // 3. Return the address associated with an ENS
      [
        'eth_call',
        {
          params: [
            {
              to: `0x${resolverNodeAddress}`,
              data: `${addressSignature}eb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1`,
            },
          ],
          result: `0x000000000000000000000000${sampleAddress}`,
        },
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
              data: '0xf0002ea90000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
              data: '0xf0002ea900000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x1111111111111111111111111111111111111111',
              data: '0x01ffc9a7d9b67a2600000000000000000000000000000000000000000000000000000000',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x1111111111111111111111111111111111111111',
              data: '0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x1111111111111111111111111111111111111111',
              data: '0x313ce567',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x1111111111111111111111111111111111111111',
              data: '0x95d89b41',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x1111111111111111111111111111111111111111',
              data: '0x70a082310000000000000000000000005cfe73b6021e818b776b421b1c4db2474086a7e1',
            },
          ],
          result: '0x1',
        }
      ],
      [
        'eth_gasPrice',
        {
          result: '0x09184e72a000', // 10000000000000 in hex
        },
      ],
      [
        'eth_getCode',
        {
          params: [`0x${mockResolver}`, 'latest'],
          result: '0x', // Assuming the contract code is empty
        },
      ],
      [
        'eth_getCode',
        {
          params: [`0x1111111111111111111111111111111111111111`, '0x1'],
          result: '0x1', // Assuming the contract code is empty
        },
      ],
      [
        'eth_getTransactionCount',
        {
          params: [`0x${mockResolver}`, 'latest'],
          result: '0x1', // Assuming the transaction count is 1
        },
      ],
      [
        'eth_getTransactionCount',
        {
          params: [`0x5cfe73b6021e818b776b421b1c4db2474086a7e1`, '0x1'],
          result: '0x1', // Assuming the transaction count is 1
        },
      ],
      [
        'eth_estimateGas',
        {
          params: [
            {
              to: '0x1111111111111111111111111111111111111111',
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            },
          ],
        },
      ],
    ]);
  }

  it('domain resolves to a correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
        .withNetworkControllerOnMainnet()
        .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          accounts:[
            {
              balance: '0xDE0B6B3A7640000', // 1 ETH in hex
            },
          ],
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },



      async ({ driver }: { driver: Driver }) => {
        await driver.delay(10000);

        await loginWithoutBalanceValidation(driver);

        // click send button on homepage to start send flow
        const homepage = new HomePage(driver);
        await homepage.check_pageIsLoaded();
        await homepage.check_expectedBalanceIsDisplayed('20');
        await homepage.startSendFlow();

        // fill ens address as recipient when user lands on send token screen
        const sendToPage = new SendTokenPage(driver);
        await sendToPage.check_pageIsLoaded();
        await sendToPage.fillRecipient(sampleEnsDomain);

        // verify that ens domain resolves to the correct address
        await sendToPage.check_ensAddressResolution(
          sampleEnsDomain,
          shortSampleAddress,
        );

        // Verify the resolved ENS address can be used as the recipient address
        await sendToPage.check_ensAddressAsRecipient(
          sampleEnsDomain,
          shortSampleAddresV2,
        );

         // Enter an amount
         await sendToPage.fillAmount('0.1');

         // Proceed to the confirmation screen
         await sendToPage.goToNextScreen();

         // Confirm the transaction
         const confirmTxPage = new ConfirmTxPage(driver);

         await confirmTxPage.openEditFeeModal();

         await confirmTxPage.check_pageIsLoaded(
          '0.000042',
          '0.100042'
      );

         // Edit gas fee form
         await editGasFeeForm(driver, '21000', '100');

         await confirmTxPage.check_pageIsLoaded(
          '0.0021',
          '0.1021'
      );

         await confirmTxPage.confirmTx();

         await driver.delay(50000);

         await homepage.check_confirmedTxNumberDisplayedInActivity();
      },
    );
  });
});
