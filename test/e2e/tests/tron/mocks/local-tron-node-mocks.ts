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

type CapturedTx = {
  txID: string;
  rawDataHex: string;
  contractType: string;
  ownerAddress: string;
  toAddress?: string;
  amount?: number;
  pollsObserved: number;
};

async function fetchTxFromLocalNode(
  localNodeUrl: string,
  txID: string,
): Promise<Record<string, unknown>> {
  const resp = await fetch(`${localNodeUrl}/wallet/gettransactionbyid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: txID }),
  });
  return (await resp.json()) as Record<string, unknown>;
}

function buildHistoryEntry(
  tx: CapturedTx,
  status: 'Pending' | 'Confirmed',
): Record<string, unknown> {
  return {
    ret: status === 'Pending' ? [] : [{ contractRet: 'SUCCESS' }],
    signature: ['00'],
    txID: tx.txID,
    net_usage: 0,
    raw_data_hex: tx.rawDataHex,
    net_fee: 0,
    energy_usage: 0,
    blockNumber: status === 'Confirmed' ? 12345 : undefined,
    block_timestamp: Date.now(),
    energy_fee: 0,
    energy_usage_total: 0,
    raw_data: {
      contract: [
        {
          parameter: {
            value: {
              amount: tx.amount,
              owner_address: tx.ownerAddress,
              to_address: tx.toAddress,
            },
            type_url: `type.googleapis.com/protocol.${tx.contractType}`,
          },
          type: tx.contractType,
        },
      ],
      ref_block_bytes: '0000',
      ref_block_hash: '0000000000000000',
      expiration: Date.now() + 60_000,
      timestamp: Date.now(),
    },
    internal_transactions: [],
  };
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
  const captured: CapturedTx[] = [];

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
  await proxyPostPath('/wallet/triggersmartcontract');
  await proxyPostPath('/wallet/triggerconstantcontract');

  // Custom broadcast handler: proxies to the local node AND captures the
  // transaction so subsequent history polls can replay it as Pending then
  // Confirmed (mirroring TronGrid behavior, which the upstream code expects).
  endpoints.push(
    await mockServer
      .forPost(tronProviderUrl('/wallet/broadcasttransaction'))
      .always()
      .thenCallback(async (req) => {
        const bodyText = await req.body.getText();
        const result = await proxyPost(
          localNodeUrl,
          '/wallet/broadcasttransaction',
          bodyText,
        );

        try {
          const parsed = bodyText ? JSON.parse(bodyText) : {};
          const txID: string | undefined = parsed.txID ?? parsed.txid;
          const rawDataHex: string = parsed.raw_data_hex ?? '';
          if (txID) {
            let contractType = 'TransferContract';
            let ownerAddress = '';
            let toAddress: string | undefined;
            let amount: number | undefined;
            try {
              const fetched = await fetchTxFromLocalNode(localNodeUrl, txID);
              const rawData = (fetched.raw_data ?? {}) as Record<
                string,
                unknown
              >;
              const contracts = (rawData.contract ?? []) as Array<
                Record<string, unknown>
              >;
              const first = contracts[0] ?? {};
              contractType = (first.type as string) ?? contractType;
              const parameter = (first.parameter ?? {}) as Record<
                string,
                unknown
              >;
              const value = (parameter.value ?? {}) as Record<string, unknown>;
              ownerAddress = (value.owner_address as string) ?? '';
              toAddress = value.to_address as string | undefined;
              amount = value.amount as number | undefined;
            } catch {
              // Fallback: keep generic placeholder if we can't read the tx back.
            }

            captured.push({
              txID,
              rawDataHex,
              contractType,
              ownerAddress,
              toAddress,
              amount,
              pollsObserved: 0,
            });
          }
        } catch {
          // Ignore capture failures — the proxied broadcast result is what
          // matters for the snap; activity history will simply remain empty
          // for an un-capturable tx.
        }

        return result;
      }),

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
      .thenCallback(async () => {
        const nativeTxs = captured.filter(
          (tx) => tx.contractType !== 'TriggerSmartContract',
        );
        const data = nativeTxs.map((tx) => {
          tx.pollsObserved += 1;
          return buildHistoryEntry(
            tx,
            tx.pollsObserved === 1 ? 'Pending' : 'Confirmed',
          );
        });
        const base = createEmptyTronGridTransactionsResponse();
        return {
          statusCode: 200,
          json: { ...base, data },
        };
      }),

    await mockServer
      .forGet(
        tronProviderUrl(`/v1/accounts/${accountAddress}/transactions/trc20`),
      )
      .always()
      .thenCallback(async () => {
        const trc20Txs = captured.filter(
          (tx) => tx.contractType === 'TriggerSmartContract',
        );
        const data = trc20Txs.map((tx) => {
          tx.pollsObserved += 1;
          return buildHistoryEntry(
            tx,
            tx.pollsObserved === 1 ? 'Pending' : 'Confirmed',
          );
        });
        const base = createEmptyTronGridTransactionsResponse();
        return {
          statusCode: 200,
          json: { ...base, data },
        };
      }),
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
