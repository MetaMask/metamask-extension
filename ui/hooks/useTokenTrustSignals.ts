import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  resolveChainName,
  type TokenScanResultResponse,
} from '@metamask/phishing-controller';
import { ResultType } from '../../shared/lib/trust-signals';
import { TrustSignalDisplayState, TrustSignalResult } from './useTrustSignals';

function getTrustState(
  resultType: string | undefined,
): TrustSignalDisplayState {
  if (!resultType) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (resultType) {
    case ResultType.Malicious:
      return TrustSignalDisplayState.Malicious;
    case ResultType.Warning:
      return TrustSignalDisplayState.Warning;
    case ResultType.Benign:
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

/**
 * Hook to get trust signals for tokens on a chain. The scan results are read
 * from (and kept fresh by) the PhishingDataService query cache.
 *
 * @param chainId - The chain the tokens live on.
 * @param tokenAddresses - The token addresses to check.
 * @returns One trust signal result per requested address, in the same order.
 */
export function useTokenTrustSignalsForAddresses(
  chainId: string | undefined,
  tokenAddresses: string[] | undefined,
): TrustSignalResult[] {
  const queries = useMemo(() => {
    if (!chainId || !tokenAddresses?.length) {
      return [];
    }

    const normalizedChainId = chainId.toLowerCase();
    const chain = resolveChainName(normalizedChainId);
    // EVM addresses are case-insensitive and are cached lowercased; non-EVM
    // addresses (e.g. Solana base58) are case-sensitive and must not be.
    const caseSensitive = !normalizedChainId.startsWith('0x');

    return tokenAddresses.map((tokenAddress) => ({
      queryKey: [
        'PhishingDataService:scanToken',
        chain ?? '',
        (caseSensitive ? tokenAddress : tokenAddress?.toLowerCase()) ?? '',
      ],
      enabled: Boolean(tokenAddress && chain),
      staleTime: 0,
      retry: false,
    }));
  }, [chainId, tokenAddresses]);

  const tokenScanResults = useQueries({ queries });

  return useMemo(
    () =>
      tokenScanResults.map(({ data }) => ({
        state: getTrustState(
          (data as TokenScanResultResponse | null | undefined)?.result_type,
        ),
        label: null,
      })),
    [tokenScanResults],
  );
}
