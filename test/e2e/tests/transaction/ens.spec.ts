import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  NETWORK_CLIENT_ID,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { mockServerJsonRpc } from '../ppom/mocks/mock-server-json-rpc';
import { mockMultiNetworkBalancePolling } from '../../mock-balance-polling/mock-balance-polling';
import SendPage from '../../page-objects/pages/send/send-page';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

/** 20 ETH in wei; matches mockMultiNetworkBalancePolling eth_getBalance mock. */
const MOCK_MAINNET_ETH_BALANCE_HEX = '0x1158E460913D00000';
const MOCK_MAINNET_ETH_BALANCE_HUMAN = '20';

describe('ENS', function (this: Suite) {
  const shortSampleAddress = shortenAddress(
    '0x225f137127d9067788314bc7fcc1f36746a3c3B5',
  );
  const chainId = 1;

  const UR_PROXY = '0xeeeeeeee14d718c2b47d9923deab1335e144eeee';
  const sampleEnsDomain = 'luc.eth';

  async function mockInfura(mockServer: MockttpServer): Promise<void> {
    await mockMultiNetworkBalancePolling(mockServer);

    await mockServerJsonRpc(mockServer, [
      ['eth_blockNumber'],
      ['eth_getBlockByNumber'],
      ['eth_chainId', { result: `0x${chainId}` }],
      // Get the address from the universal resolver
      [
        'eth_call',
        {
          params: [
            {
              to: UR_PROXY,
              data: '0xa1472844000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000009036c75630365746800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000243b3b57dee1e7bcf2ca33c28a806ee265cfedf02fedf1b124ca73b2203ca80cc7c91a02ad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000014782d62617463682d676174657761793a74727565000000000000000000000000',
            },
          ],
          result:
            '0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba410000000000000000000000000000000000000000000000000000000000000020000000000000000000000000225f137127d9067788314bc7fcc1f36746a3c3b5',
        },
      ],
    ]);
  }

  it('domain resolves to a correct address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withAccountTracker({
            accountsByChainId: {
              '0x1': {
                [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
                  balance: MOCK_MAINNET_ETH_BALANCE_HEX,
                  stakedBalance: '0x0',
                },
              },
            },
          })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                'eip155:1/slip44:60': {
                  amount: MOCK_MAINNET_ETH_BALANCE_HUMAN,
                },
              },
            },
          })
          .build(),
        unifiedEvmAccountsApiBalances: {
          mainnetNativeEthHuman: MOCK_MAINNET_ETH_BALANCE_HUMAN,
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          expectedBalance: '20 ETH',
          waitForNonEvmAccounts: false,
        });

        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.startSendFlow();

        // fill ens address as recipient when user lands on send token screen
        const sendToPage = new SendPage(driver);
        await sendToPage.selectToken('0x1', 'ETH');
        await sendToPage.fillRecipient(sampleEnsDomain);

        // Verify that ens is resolved to the correct address
        await sendToPage.checkEnsAddressResolution(
          sampleEnsDomain,
          shortSampleAddress,
        );
      },
    );
  });
});
