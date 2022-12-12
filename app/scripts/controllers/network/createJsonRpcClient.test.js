/**
 * @jest-environment node
 */

import {
  withClient,
  withMockedCommunications,
} from './provider-api-tests/helpers';
import { testsForProviderType } from './provider-api-tests/shared-tests';

describe('createJsonRpcClient', () => {
  testsForProviderType('custom');

  describe('methods specially handled', () => {
    describe('net_version', () => {
      it('hits the RPC endpoint', async () => {
        await withMockedCommunications(
          { providerType: 'custom' },
          async (comms) => {
            comms.mockRpcCall({
              request: { method: 'net_version' },
              response: { result: '1' },
            });

            const networkId = await withClient(
              { providerType: 'custom' },
              ({ makeRpcCall }) => {
                return makeRpcCall({
                  method: 'net_version',
                });
              },
            );

            expect(networkId).toStrictEqual('1');
          },
        );
      });
    });

    describe('eth_chainId', () => {
      it('does not hit the RPC endpoint, instead returning the configured chain id', async () => {
        const networkId = await withClient(
          { providerType: 'custom', customChainId: '0x1' },
          ({ makeRpcCall }) => {
            return makeRpcCall({ method: 'eth_chainId' });
          },
        );

        expect(networkId).toStrictEqual('0x1');
      });
    });
  });
});
