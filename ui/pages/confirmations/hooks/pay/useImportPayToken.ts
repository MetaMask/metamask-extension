import type { Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';
import { parseTokenDetailDecimals } from '../../utils/token';
import { useAddToken } from '../tokens/useAddToken';

/**
 * Imports a pay token (e.g. a post-quote withdraw destination) into the
 * user's wallet, resolving its metadata automatically.
 *
 * Metadata is resolved via `getTokenStandardAndDetailsByChain`, which checks
 * the token lists and the user's tokens before falling back to an on-chain
 * lookup. When the decimals cannot be resolved, the import is skipped;
 * guessing (e.g. `Token`/18 for USDC) corrupts amounts.
 *
 * @param token - The token to import.
 * @param token.address - The token address.
 * @param token.chainId - The chain the token is on.
 * @param token.enabled - When false, no metadata is resolved and nothing is
 * imported.
 */
export function useImportPayToken({
  address,
  chainId,
  enabled = true,
}: {
  address?: Hex;
  chainId?: Hex;
  enabled?: boolean;
}) {
  const { value: metadata } = useAsyncResult(async () => {
    if (!enabled || !address || !chainId) {
      return undefined;
    }

    return getImportMetadata({ address, chainId });
  }, [address, chainId, enabled]);

  useAddToken({
    chainId,
    decimals: metadata?.decimals,
    symbol: metadata?.symbol,
    tokenAddress: address,
  });
}

/**
 * Metadata to import the token with, or `undefined` when the decimals are
 * unknown.
 *
 * @param token - The token to resolve metadata for.
 * @param token.address - The token address.
 * @param token.chainId - The chain the token is on.
 */
async function getImportMetadata({
  address,
  chainId,
}: {
  address: Hex;
  chainId: Hex;
}): Promise<{ symbol: string; decimals: number } | undefined> {
  const details = await getTokenStandardAndDetailsByChain(
    address,
    undefined,
    undefined,
    chainId,
  );

  const decimals = parseTokenDetailDecimals(details?.decimals);

  if (decimals === undefined) {
    return undefined;
  }

  return { symbol: details?.symbol ?? 'Token', decimals };
}
