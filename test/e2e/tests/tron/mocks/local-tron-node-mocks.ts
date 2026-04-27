/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp, MockedEndpoint } from 'mockttp';

// Same regex pattern used in common-tron.ts — matches any Infura project ID
const TRON_INFURA_BASE_URL = 'https://tron-mainnet\\.infura\\.io/v3/[^/]+';

function tronInfuraUrl(path: string): RegExp {
  return new RegExp(`^${TRON_INFURA_BASE_URL}${path}$`, 'u');
}

async function proxyPost(
  localNodeUrl: string,
  path: string,
  body: string | null | undefined,
): Promise<{ statusCode: number; json: unknown }> {
  const resp = await fetch(`${localNodeUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ?? undefined,
  });
  return { statusCode: resp.status, json: await resp.json() };
}

/**
 * Replaces all blockchain-data mocks (getblock, account, resources, transactions,
 * broadcasttransaction) with live proxied requests to a local Tron node.
 *
 * External API mocks (price, tokens, feature flags) are NOT included here —
 * add them separately in testSpecificMock as usual.
 *
 * @param mockServer - The mockttp server instance
 * @param localNodeUrl - Base URL of the local Tron node (e.g. http://localhost:9090)
 * @param accountAddress - Tron account address used to scope history endpoints
 * @returns Array of registered MockedEndpoints
 */
export async function proxyTronBlockchainCalls(
  mockServer: Mockttp,
  localNodeUrl: string,
  accountAddress: string,
): Promise<MockedEndpoint[]> {
  return [
    // Block data
    await mockServer
      .forPost(tronInfuraUrl('/wallet/getblock'))
      .always()
      .thenCallback(async (req) =>
        proxyPost(localNodeUrl, '/wallet/getblock', await req.body.getText()),
      ),

    // Account resources (bandwidth, energy)
    await mockServer
      .forPost(tronInfuraUrl('/wallet/getaccountresource'))
      .always()
      .thenCallback(async (req) =>
        proxyPost(
          localNodeUrl,
          '/wallet/getaccountresource',
          await req.body.getText(),
        ),
      ),

    // Broadcast transaction — returns real txid from local node
    await mockServer
      .forPost(tronInfuraUrl('/wallet/broadcasttransaction'))
      .always()
      .thenCallback(async (req) =>
        proxyPost(
          localNodeUrl,
          '/wallet/broadcasttransaction',
          await req.body.getText(),
        ),
      ),

    // Account balance + TRC20 holdings
    // TRE exposes the same wallet APIs the snap already uses, but its HTTP
    // proxy does not give us a usable v1 account payload here. We fetch the
    // balance via /wallet/getaccount and wrap it in the v1 envelope the snap
    // expects.
    await mockServer
      .forGet(tronInfuraUrl(`/v1/accounts/${accountAddress}`))
      .always()
      .thenCallback(async () => {
        const resp = await fetch(`${localNodeUrl}/wallet/getaccount`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: accountAddress, visible: true }),
        });
        const account = await resp.json();
        const data =
          account && (account as Record<string, unknown>).address
            ? [account]
            : [];
        return {
          statusCode: 200,
          json: {
            data,
            success: true,
            meta: { at: Date.now(), page_size: data.length },
          },
        };
      }),

    // Native TRX transaction history — return empty; the snap tracks submitted
    // transactions locally so the activity list does not depend on node history.
    await mockServer
      .forGet(tronInfuraUrl(`/v1/accounts/${accountAddress}/transactions`))
      .always()
      .thenCallback(async () => ({
        statusCode: 200,
        json: {
          data: [],
          success: true,
          meta: { at: Date.now(), page_size: 0 },
        },
      })),

    // TRC20 token transaction history — always empty on the local TRE chain.
    await mockServer
      .forGet(
        tronInfuraUrl(`/v1/accounts/${accountAddress}/transactions/trc20`),
      )
      .always()
      .thenCallback(async () => ({
        statusCode: 200,
        json: {
          data: [],
          success: true,
          meta: { at: Date.now(), page_size: 0 },
        },
      })),
  ];
}
