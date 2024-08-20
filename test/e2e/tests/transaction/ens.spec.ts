import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import {
  defaultGanacheOptions,
  withFixtures,
  WALLET_PASSWORD,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';

describe('ENS', function (this: Suite) {
  const sampleAddress: string = '1111111111111111111111111111111111111111';

  // Having 2 versions of the address is a bug(#25286)
  const shortSampleAddress = '0x1111...1111';
  const shortSampleAddresV2 = '0x11111...11111';
  const chainId = 1;
  const mockResolver = '226159d592e2b063810a10ebf6dcbada94ed68b8';

  const sampleEnsDomain: string = 'test.eth';
  const infuraUrl: string =
    'https://mainnet.infura.io/v3/00000000000000000000000000000000';

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
          result: '0x1',
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

    await mockServerJsonRpc(mockServer, [
      ['eth_chainId', { result: `0x${chainId}` }],
      [
        'eth_call',
        {
          params: [
            {
              to: '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
              data: '0x0178b8bfeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1',
            },
          ],
          result: `0x000000000000000000000000${mockResolver}`,
        },
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: `0x${mockResolver}`,
              data: '0x01ffc9a79061b92300000000000000000000000000000000000000000000000000000000',
            },
          ],
          result: `0x0000000000000000000000000000000000000000000000000000000000000000`,
        },
      ],
      [
        'eth_call',
        {
          params: [
            {
              to: `0x${mockResolver}`,
              data: '0x3b3b57deeb4f647bea6caa36333c816d7b46fdcb05f9466ecacc140ea8c66faf15b3d9f1',
            },
          ],
          result: `0x000000000000000000000000${sampleAddress}`,
        },
      ],
    ]);
  }

  it('domain resolves to a correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver, WALLET_PASSWORD, '<0.000001');

        // click send button on homepage to start send flow
        await new HomePage(driver).startSendFlow();

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
      },
    );
  });
});
