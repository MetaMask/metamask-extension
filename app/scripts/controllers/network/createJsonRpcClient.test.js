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
        const providerType = 'custom';
        const method = 'net_version';
        const result = '1';

        await withMockedCommunications({ providerType }, async (comms) => {
          comms.mockRpcCall({
            request: { method },
            response: { result },
          });

          const networkId = await withClient(
            { providerType },
            ({ makeRpcCall }) => {
              return makeRpcCall({
                method,
              });
            },
          );

          expect(networkId).toStrictEqual(result);
        });
      });
    });

    describe('eth_chainId', () => {
      it('hits the RPC endpoint', async () => {
        const providerType = 'custom';
        const method = 'eth_chainId';
        const result = '0x1';

        await withMockedCommunications({ providerType }, async (comms) => {
          comms.mockRpcCall({
            request: { method },
            response: { result },
          });

          const networkId = await withClient(
            { providerType },
            ({ makeRpcCall }) => {
              return makeRpcCall({ method });
            },
          );

          expect(networkId).toStrictEqual(result);
        });
      });
    });
  });
});
