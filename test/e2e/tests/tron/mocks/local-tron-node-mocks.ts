/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp, MockedEndpoint } from 'mockttp';
import {
  createEmptyTronGridTransactionsResponse,
  createTronGridAccountResponse,
  TronNativeAccount,
} from '../../../seeder/tron/assets';
import { TronNode, TRON_LOCAL_NODE_URL } from '../../../seeder/tron/node';

type TronNodeLike = Pick<
  TronNode,
  | 'baseUrl'
  | 'getTrc10Balances'
  | 'getTrc20Balances'
  | 'getTronGridAccountResponse'
  | 'trc10Tokens'
  | 'trc20Tokens'
>;

// Matches Infura Tron mainnet plus the public TronGrid hosts used by the Tron dapp.
const TRON_PROVIDER_BASE_URLS = [
  'https://tron-mainnet\\.infura\\.io/v3/[^/]+',
  'https://api\\.trongrid\\.io',
  'https://api\\.shasta\\.trongrid\\.io',
  'https://nile\\.trongrid\\.io',
];

function tronProviderUrl(path: string): RegExp {
  return new RegExp(
    `^(${TRON_PROVIDER_BASE_URLS.join('|')})${path}(\\?[^#]*)?$`,
    'u',
  );
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
 * @param localNode - Local Tron node instance, or its base URL.
 * @param accountAddress - Tron account address used to scope history endpoints
 * @returns Array of registered MockedEndpoints
 */
export async function proxyTronBlockchainCalls(
  mockServer: Mockttp,
  localNode: TronNodeLike | string,
  accountAddress: string,
): Promise<MockedEndpoint[]> {
  const localNodeUrl =
    typeof localNode === 'string' ? localNode : localNode.baseUrl;
  const endpoints: MockedEndpoint[] = [];
  const proxyPostPath = async (path: string) => {
    endpoints.push(
      await mockServer
        .forPost(tronProviderUrl(path))
        .always()
        .thenCallback(async (req) =>
          proxyPost(localNodeUrl, path, await req.body.getText()),
        ),
    );
  };

  await proxyPostPath('/wallet/getblock');
  await proxyPostPath('/wallet/getaccountresource');
  await proxyPostPath('/wallet/broadcasttransaction');
  await proxyPostPath('/wallet/triggersmartcontract');
  await proxyPostPath('/wallet/triggerconstantcontract');

  endpoints.push(
    await mockServer
      .forGet(tronProviderUrl(`/v1/accounts/${accountAddress}`))
      .always()
      .thenCallback(async () => {
        if (typeof localNode !== 'string') {
          return {
            statusCode: 200,
            json: await localNode.getTronGridAccountResponse(accountAddress),
          };
        }

        const { json: account } = await proxyPost(
          localNodeUrl,
          '/wallet/getaccount',
          JSON.stringify({ address: accountAddress, visible: true }),
        );
        return {
          statusCode: 200,
          json: createTronGridAccountResponse({
            address: accountAddress,
            nativeAccount: account as TronNativeAccount,
          }),
        };
      }),

    await mockServer
      .forGet(tronProviderUrl(`/v1/accounts/${accountAddress}/transactions`))
      .always()
      .thenCallback(async () => ({
        statusCode: 200,
        json: createEmptyTronGridTransactionsResponse(),
      })),

    await mockServer
      .forGet(
        tronProviderUrl(`/v1/accounts/${accountAddress}/transactions/trc20`),
      )
      .always()
      .thenCallback(async () => ({
        statusCode: 200,
        json: createEmptyTronGridTransactionsResponse(),
      })),
  );

  return endpoints;
}

export async function proxyDefaultTronBlockchainCalls(
  mockServer: Mockttp,
  accountAddress: string,
): Promise<MockedEndpoint[]> {
  return proxyTronBlockchainCalls(
    mockServer,
    TRON_LOCAL_NODE_URL,
    accountAddress,
  );
}
