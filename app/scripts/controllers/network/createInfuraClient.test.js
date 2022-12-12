/**
 * @jest-environment node
 */

import { withClient } from './provider-api-tests/helpers';
import { testsForProviderType } from './provider-api-tests/shared-tests';

describe('createInfuraClient', () => {
  testsForProviderType('infura');

  describe('methods specially handled', () => {
    describe('net_version', () => {
      it('does not hit Infura, instead returning the network ID that maps to the Infura network, as a decimal string', async () => {
        const networkId = await withClient(
          { providerType: 'infura', infuraNetwork: 'goerli' },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'net_version',
            });
          },
        );
        expect(networkId).toStrictEqual('5');
      });
    });

    describe('eth_chainId', () => {
      it('does not hit Infura, instead returning the chain id that maps to the Infura network, as a hex string', async () => {
        const chainId = await withClient(
          { providerType: 'infura', infuraNetwork: 'goerli' },
          ({ makeRpcCall }) => {
            return makeRpcCall({
              method: 'eth_chainId',
            });
          },
        );

        expect(chainId).toStrictEqual('0x5');
      });
    });
  });
});
