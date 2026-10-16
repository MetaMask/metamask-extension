/** @jest-environment node */
import { request } from 'node:http';
import { getLocal } from 'mockttp';
import { mockPendingGasEstimate } from './mock-pending-gas-estimate';

describe('mockPendingGasEstimate', () => {
  it('holds gas estimation until released while forwarding other RPC methods', async () => {
    const node = getLocal();
    const proxy = getLocal();
    await node.start();
    await proxy.start();
    const rpcUrl = 'http://rpc.metamask.test/';
    const estimates = await node
      .forPost()
      .withJsonBodyIncluding({ method: 'eth_estimateGas' })
      .thenJson(200, { jsonrpc: '2.0', id: 1, result: '0x5208' });
    await node
      .forPost()
      .withJsonBodyIncluding({ method: 'eth_chainId' })
      .thenJson(200, { jsonrpc: '2.0', id: 1, result: '0x539' });
    const pendingEstimate = await mockPendingGasEstimate(
      proxy,
      rpcUrl,
      node.url,
    );
    const callRpc = (method: string): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const rpcRequest = request(
          proxy.url,
          {
            method: 'POST',
            path: rpcUrl,
            headers: { 'content-type': 'application/json' },
          },
          (response) => {
            let body = '';
            response.on('data', (chunk) => {
              body += chunk;
            });
            response.on('end', () => {
              resolve(JSON.parse(body));
            });
          },
        );
        rpcRequest.on('error', reject);
        rpcRequest.end(
          JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] }),
        );
      });

    try {
      const gasEstimate = callRpc('eth_estimateGas');
      await pendingEstimate.requested;
      expect(await callRpc('eth_chainId')).toStrictEqual({
        jsonrpc: '2.0',
        id: 1,
        result: '0x539',
      });
      expect(await estimates.getSeenRequests()).toHaveLength(0);

      pendingEstimate.release();
      expect(await gasEstimate).toStrictEqual({
        jsonrpc: '2.0',
        id: 1,
        result: '0x5208',
      });
      // Releasing the gate also allows subsequent estimates through.
      expect(await callRpc('eth_estimateGas')).toStrictEqual({
        jsonrpc: '2.0',
        id: 1,
        result: '0x5208',
      });
    } finally {
      pendingEstimate.release();
      await proxy.stop();
      await node.stop();
    }
  });
});
