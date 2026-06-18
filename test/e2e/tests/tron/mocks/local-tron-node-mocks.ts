/* eslint-disable @typescript-eslint/naming-convention */
import { Mockttp, MockedEndpoint } from 'mockttp';
import {
  createEmptyTronGridTransactionsResponse,
  createTronGridAccountResponse,
  normalizeTronHexAddress,
  TronNativeAccount,
} from '../../../seeder/tron/assets';
import { TronNode } from '../../../seeder/tron/node';

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

type CapturedTxFields = Pick<
  CapturedTx,
  'amount' | 'contractType' | 'ownerAddress' | 'toAddress'
>;

type TriggerSmartContractRequest = {
  call_value?: number;
  contract_address?: string;
  fee_limit?: number;
  function_selector?: string;
  owner_address?: string;
  parameter?: string;
};

function normalizeMaybeTronAddress(address?: string): string | undefined {
  if (!address) {
    return undefined;
  }
  try {
    return normalizeTronHexAddress(address).toLowerCase();
  } catch {
    return address.toLowerCase();
  }
}

function buildSeededTrc20ContractAddressSet(
  localNode: TronNodeLike | string,
): Set<string> {
  if (typeof localNode === 'string') {
    return new Set();
  }

  return new Set(
    Object.values(localNode.trc20Tokens)
      .flatMap((token) => [token?.address, token?.hexAddress])
      .map((address) => normalizeMaybeTronAddress(address))
      .filter((address): address is string => Boolean(address)),
  );
}

function getFunctionSelectorPrefix(functionSelector?: string): string {
  // transfer(address,uint256)
  if (functionSelector === 'transfer(address,uint256)') {
    return 'a9059cbb';
  }
  return '';
}

function buildTriggerSmartContractTransaction(
  request: TriggerSmartContractRequest,
): Record<string, unknown> {
  const timestamp = Date.now();
  const ownerAddress = request.owner_address
    ? normalizeTronHexAddress(request.owner_address)
    : '';
  const contractAddress = request.contract_address
    ? normalizeTronHexAddress(request.contract_address)
    : '';
  const data = `${getFunctionSelectorPrefix(request.function_selector)}${
    request.parameter ?? ''
  }`;

  return {
    result: { result: true },
    transaction: {
      txID: '0'.repeat(64),
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                data,
                owner_address: ownerAddress,
                contract_address: contractAddress,
                call_value: request.call_value ?? 0,
              },
              type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
            },
            type: 'TriggerSmartContract',
          },
        ],
        ref_block_bytes: '0000',
        ref_block_hash: '0000000000000000',
        expiration: timestamp + 60_000,
        fee_limit: request.fee_limit,
        timestamp,
      },
      // Large enough to force a realistic bandwidth cost when the account has
      // no free bandwidth. The exact bytes are not semantically parsed in tests.
      raw_data_hex: '00'.repeat(250),
      visible: false,
    },
  };
}

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

function getCapturedTxFields(
  transaction: Record<string, unknown>,
): Partial<CapturedTxFields> {
  const rawData = (transaction.raw_data ?? {}) as Record<string, unknown>;
  const contracts = (rawData.contract ?? []) as Record<string, unknown>[];
  const first = contracts[0] ?? {};
  const parameter = (first.parameter ?? {}) as Record<string, unknown>;
  const value = (parameter.value ?? {}) as Record<string, unknown>;

  return {
    amount: value.amount as number | undefined,
    contractType: first.type as string | undefined,
    ownerAddress: value.owner_address as string | undefined,
    toAddress: value.to_address as string | undefined,
  };
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

function getTxIdFromRequestBody(
  body: string | null | undefined,
): string | undefined {
  const parsed = body
    ? (JSON.parse(body) as { value?: string; txID?: string; txid?: string })
    : {};
  return parsed.value ?? parsed.txID ?? parsed.txid;
}

function buildTransactionInfo(tx: CapturedTx): Record<string, unknown> {
  return {
    id: tx.txID,
    fee: 0,
    blockNumber: 12345,
    blockTimeStamp: Date.now(),
    contractResult: [''],
    receipt: {
      result: 'SUCCESS',
      net_usage: 0,
      energy_usage_total: 0,
    },
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
 * @param accountAddresses - Tron account addresses used to scope history endpoints
 * @returns Array of registered MockedEndpoints
 */
export async function proxyTronBlockchainCalls(
  mockServer: Mockttp,
  localNode: TronNodeLike | string,
  accountAddresses: string[],
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
  await proxyPostPath('/wallet/getcontract');
  await proxyPostPath('/wallet/gettransactionbyid');

  const seededTrc20ContractAddresses =
    buildSeededTrc20ContractAddressSet(localNode);

  endpoints.push(
    await mockServer
      .forGet(tronProviderUrl('/wallet/getchainparameters'))
      .always()
      .thenJson(200, {
        chainParameter: [
          { key: 'getTransactionFee', value: 1000 },
          { key: 'getEnergyFee', value: 420 },
        ],
      }),

    await mockServer
      .forPost(tronProviderUrl('/wallet/getnextmaintenancetime'))
      .always()
      .thenJson(200, {
        num: Date.now() + 6 * 60 * 60 * 1000,
      }),

    await mockServer
      .forPost(tronProviderUrl('/wallet/gettransactioninfobyid'))
      .always()
      .thenCallback(async (req) => {
        const body = await req.body.getText();
        const txID = getTxIdFromRequestBody(body);
        const capturedTx = captured.find((tx) => tx.txID === txID);
        if (capturedTx) {
          return {
            statusCode: 200,
            json: buildTransactionInfo(capturedTx),
          };
        }
        return proxyPost(localNodeUrl, '/wallet/gettransactioninfobyid', body);
      }),

    await mockServer
      .forPost(tronProviderUrl('/wallet/triggersmartcontract'))
      .always()
      .thenCallback(async (req) => {
        const body = await req.body.getText();
        const parsed = body
          ? (JSON.parse(body) as TriggerSmartContractRequest)
          : {};
        const contractAddress = normalizeMaybeTronAddress(
          parsed.contract_address,
        );
        if (
          contractAddress &&
          seededTrc20ContractAddresses.has(contractAddress)
        ) {
          return {
            statusCode: 200,
            json: buildTriggerSmartContractTransaction(parsed),
          };
        }
        return proxyPost(localNodeUrl, '/wallet/triggersmartcontract', body);
      }),

    await mockServer
      .forPost(tronProviderUrl('/wallet/triggerconstantcontract'))
      .always()
      .thenCallback(async (req) => {
        const body = await req.body.getText();
        const parsed = body
          ? (JSON.parse(body) as { contract_address?: string })
          : {};
        const contractAddress = normalizeMaybeTronAddress(
          parsed.contract_address,
        );
        if (
          contractAddress &&
          seededTrc20ContractAddresses.has(contractAddress)
        ) {
          return {
            statusCode: 200,
            json: {
              result: { result: true },
              energy_used: 14000,
              constant_result: [
                '0000000000000000000000000000000000000000000000000000000000000001',
              ],
              transaction: {
                txID: '0'.repeat(64),
                ret: [{ ret: 'SUCCESS' }],
                raw_data: {
                  contract: [
                    {
                      parameter: {
                        value: {
                          data: '',
                          owner_address: '',
                          contract_address: parsed.contract_address,
                        },
                        type_url:
                          'type.googleapis.com/protocol.TriggerSmartContract',
                      },
                      type: 'TriggerSmartContract',
                    },
                  ],
                  ref_block_bytes: '0000',
                  ref_block_hash: '0000000000000000',
                  expiration: Date.now() + 60_000,
                  timestamp: Date.now(),
                },
                raw_data_hex: '',
                visible: false,
              },
            },
          };
        }
        return proxyPost(localNodeUrl, '/wallet/triggerconstantcontract', body);
      }),
  );

  // Custom broadcast handler: proxies to the local node AND captures the
  // transaction so subsequent history polls can replay it as confirmed. The
  // snap adds the optimistic pending row immediately after broadcast; history
  // is the confirmation signal.
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
            let fields = getCapturedTxFields(parsed);
            if (!fields.ownerAddress) {
              try {
                fields = getCapturedTxFields(
                  await fetchTxFromLocalNode(localNodeUrl, txID),
                );
              } catch {
                // Fallback: keep generic placeholder if we can't read the tx back.
              }
            }

            contractType = fields.contractType ?? contractType;
            ownerAddress = fields.ownerAddress ?? '';
            const { toAddress } = fields;
            const { amount } = fields;

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
  );

  for (const accountAddress of accountAddresses) {
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
        .thenCallback(async () => {
          const nativeTxs = captured.filter(
            (tx) => tx.contractType !== 'TriggerSmartContract',
          );
          const data = nativeTxs.map((tx) => {
            tx.pollsObserved += 1;
            return buildHistoryEntry(tx, 'Confirmed');
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
            return buildHistoryEntry(tx, 'Confirmed');
          });
          const base = createEmptyTronGridTransactionsResponse();
          return {
            statusCode: 200,
            json: { ...base, data },
          };
        }),
    );
  }

  return endpoints;
}
