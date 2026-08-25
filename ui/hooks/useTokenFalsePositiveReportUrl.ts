import { useEffect, useState } from 'react';
import { buildFalsePositiveReportUrl } from '../../shared/constants/security-provider';
import { mapChainIdToSupportedEVMChain } from '../../shared/lib/trust-signals';
import { fetchTokenScanRequestId } from '../../shared/lib/bridge-utils/security-alerts-api.util';

/**
 * Resolves a false-positive portal URL for a token by fetching Blockaid's
 * request_id from security-alerts-api when the token is flagged.
 *
 * Returns undefined while loading or when the id cannot be obtained.
 *
 * @param options.enabled - Whether to fetch (e.g. only for Malicious/Warning).
 * @param options.chainId - Hex chain id.
 * @param options.tokenAddress - Token contract address.
 */
export function useTokenFalsePositiveReportUrl({
  enabled,
  chainId,
  tokenAddress,
}: {
  enabled: boolean;
  chainId?: string;
  tokenAddress?: string;
}): string | undefined {
  const [reportUrl, setReportUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setReportUrl(undefined);
      if (!enabled || !chainId || !tokenAddress) {
        return;
      }

      const chain = mapChainIdToSupportedEVMChain(chainId);
      if (!chain) {
        return;
      }

      try {
        const requestId = await fetchTokenScanRequestId(chain, tokenAddress);
        if (!cancelled && requestId) {
          setReportUrl(buildFalsePositiveReportUrl({ requestId }));
        }
      } catch {
        // Leave reportUrl undefined — hide Report link.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, chainId, tokenAddress]);

  return reportUrl;
}
