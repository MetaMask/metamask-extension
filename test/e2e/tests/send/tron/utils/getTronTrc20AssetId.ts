import { TronNode } from '../../../../seeder/tron/node';
import { TRON_CHAIN_ID } from '../../../tron/mocks/common-tron';

/**
 * Builds the asset id for a TRC20 token seeded on the local Tron node, in the
 * `chainId/trc20:<address>` format expected by the send-flow deep link.
 *
 * @param localNodes - Local nodes started by the fixture harness.
 * @param symbol - Symbol of the seeded TRC20 token to look up.
 * @returns The asset id of the seeded TRC20 token.
 */
export function getTronTrc20AssetId(
  localNodes: unknown[],
  symbol: 'USDT' | 'USDD' | 'HTX' | 'SEED',
): string {
  const tronNode = localNodes.find(
    (node): node is TronNode => node instanceof TronNode,
  );
  const token = tronNode?.trc20Tokens[symbol];
  if (!token) {
    throw new Error(`Seeded ${symbol} token was not found on the Tron node`);
  }
  return `${TRON_CHAIN_ID}/trc20:${token.address}`;
}
