import { MockedEndpoint, Mockttp } from 'mockttp';
import { SolanaNode } from '../../../seeder/solana/node';

const SOLANA_PROVIDER_RE =
  /^https:\/\/solana-(mainnet|devnet)\.infura\.io\/v3.*/u;

export async function proxySolanaBlockchainCalls(
  mockServer: Mockttp,
  solanaNode: SolanaNode,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(SOLANA_PROVIDER_RE)
      .always()
      .thenCallback(async (req) => {
        const body = await req.body.getText();
        const response = await fetch(solanaNode.baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        const responseText = await response.text();

        return {
          statusCode: response.status,
          headers: {
            'Content-Type':
              response.headers.get('Content-Type') ?? 'application/json',
          },
          body: responseText,
        };
      }),
  ];
}
