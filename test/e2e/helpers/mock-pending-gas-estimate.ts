import type { Mockttp } from 'mockttp';
import { createDeferredPromise } from '@metamask/utils';

/**
 * Holds gas estimation at the mock RPC boundary until the test releases it.
 * Other RPC methods continue to reach the local node.
 *
 * @param mockServer - The E2E mock server.
 * @param rpcUrl - The proxied RPC URL configured in the test fixture.
 * @param targetUrl - The local node to forward requests to.
 * @returns Signals for awaiting and releasing the pending estimate.
 */
export async function mockPendingGasEstimate(
  mockServer: Mockttp,
  rpcUrl: string,
  targetUrl = 'http://localhost:8545',
): Promise<{ requested: Promise<void>; release: () => void }> {
  const requested = createDeferredPromise<void>();
  const released = createDeferredPromise<void>();

  await mockServer
    .forPost(rpcUrl)
    .withJsonBodyIncluding({ method: 'eth_estimateGas' })
    .thenPassThrough({
      beforeRequest: async () => {
        requested.resolve();
        await released.promise;
        return { url: targetUrl };
      },
    });
  await mockServer.forPost(rpcUrl).thenForwardTo(targetUrl);

  return { requested: requested.promise, release: () => released.resolve() };
}
