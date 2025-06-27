import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import { mockMultiNetworkBalancePolling } from '../../mock-balance-polling/mock-balance-polling';

describe('ENS', function (this: Suite) {
  const sampleAddress: string = '1111111111111111111111111111111111111111';

  const shortSampleAddress = '0x11111...11111';
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
    await mockMultiNetworkBalancePolling(mockServer);

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
    ]);
  }

  it('domain resolves to a correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver }: { driver: Driver }) => {
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
          shortSampleAddress,
        );
      },
    );
  });
});
