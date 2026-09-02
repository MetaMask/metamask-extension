import { MockedEndpoint, Mockttp } from 'mockttp';
import { SolanaNode } from '../../../seeder/solana/node';

const SOLANA_PROVIDER_URL_REGEX =
  /^https:\/\/solana-(mainnet|devnet)\.infura\.io\/v3\/.*/u;

async function proxyPost(
  localNodeUrl: string,
  body: string | null | undefined,
): Promise<{ statusCode: number; json: unknown }> {
  const response = await fetch(localNodeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ?? undefined,
  });

  return {
    statusCode: response.status,
    json: await response.json(),
  };
}

/**
 * Replaces Solana Infura JSON-RPC mocks with live proxied requests to a local
 * solana-test-validator instance. Uses stateful mocks for transaction history
 * so the initial funding airdrop does not pollute the activity list.
 *
 * Before a `sendTransaction` call, `getSignaturesForAddress` returns empty.
 * After a `sendTransaction`, it returns only the sent transaction signature.
 * All other RPCs are proxied directly to the local validator.
 *
 * @param mockServer - The mockttp server instance.
 * @param localNode - Local Solana node instance, or its base URL.
 * @returns The registered mocked endpoints.
 */
export async function proxySolanaBlockchainCalls(
  mockServer: Mockttp,
  localNode: Pick<SolanaNode, 'baseUrl'> | string,
): Promise<MockedEndpoint[]> {
  const localNodeUrl =
    typeof localNode === 'string' ? localNode : localNode.baseUrl;

  let sentTxSignature: string | null = null;

  return [
    // Intercept sendTransaction to capture the signature, then proxy to the
    // local validator. Priority 100 beats the general proxy (99).
    await mockServer
      .forPost(SOLANA_PROVIDER_URL_REGEX)
      .withJsonBodyIncluding({ method: 'sendTransaction' })
      .asPriority(100)
      .always()
      .thenCallback(async (req) => {
        const response = await proxyPost(
          localNodeUrl,
          await req.body.getText(),
        );
        const json = response.json as Record<string, unknown>;
        if (json?.result && typeof json.result === 'string') {
          sentTxSignature = json.result;
        }
        return response;
      }),

    // Stateful getSignaturesForAddress: empty before send, sent-tx only after.
    // Prevents the funding airdrop from appearing in the activity list while
    // still allowing the snap to discover the sent transaction during re-sync.
    await mockServer
      .forPost(SOLANA_PROVIDER_URL_REGEX)
      .withBodyIncluding('getSignaturesForAddress')
      .asPriority(100)
      .always()
      .thenCallback(async (req) => {
        const body = (await req.body.getJson()) as Record<string, unknown>;
        return {
          statusCode: 200,
          json: {
            id: body?.id ?? '1337',
            jsonrpc: '2.0',
            result: sentTxSignature
              ? [
                  {
                    blockTime: Math.floor(Date.now() / 1000),
                    confirmationStatus: 'finalized',
                    err: null,
                    memo: null,
                    signature: sentTxSignature,
                    slot: 342840492,
                  },
                ]
              : [],
          },
        };
      }),

    // General proxy for all other Solana RPCs. Priority 99 beats the default
    // mock-e2e.js rules (DEFAULT priority = 1).
    await mockServer
      .forPost(SOLANA_PROVIDER_URL_REGEX)
      .asPriority(99)
      .always()
      .thenCallback(async (req) =>
        proxyPost(localNodeUrl, await req.body.getText()),
      ),
  ];
}
