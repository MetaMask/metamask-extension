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

async function proxyGet(
  localNodeUrl: string,
  path: string,
): Promise<{ statusCode: number; json: unknown }> {
  const resp = await fetch(`${localNodeUrl}${path}`);
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
 * @param localNodeUrl - Base URL of the local Tron node (e.g. http://localhost:8090)
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
    await mockServer
      .forGet(tronInfuraUrl(`/v1/accounts/${accountAddress}`))
      .always()
      .thenCallback(async () =>
        proxyGet(localNodeUrl, `/v1/accounts/${accountAddress}`),
      ),

    // Native TRX transaction history
    await mockServer
      .forGet(tronInfuraUrl(`/v1/accounts/${accountAddress}/transactions`))
      .always()
      .thenCallback(async () =>
        proxyGet(localNodeUrl, `/v1/accounts/${accountAddress}/transactions`),
      ),

    // TRC20 token transaction history (empty on local node — no TRC20 tokens deployed)
    await mockServer
      .forGet(
        tronInfuraUrl(`/v1/accounts/${accountAddress}/transactions/trc20`),
      )
      .always()
      .thenCallback(async () =>
        proxyGet(
          localNodeUrl,
          `/v1/accounts/${accountAddress}/transactions/trc20`,
        ),
      ),
  ];
}
