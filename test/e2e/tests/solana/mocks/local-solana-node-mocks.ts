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
 * solana-test-validator instance. External service mocks such as prices,
 * phishing detection, and token metadata should still be registered separately.
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

  return [
    await mockServer
      .forPost(SOLANA_PROVIDER_URL_REGEX)
      .always()
      .thenCallback(async (req) =>
        proxyPost(localNodeUrl, await req.body.getText()),
      ),
  ];
}
