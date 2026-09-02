import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TokenAsset } from '@metamask/assets-controllers';
import { type CaipAssetType } from '@metamask/utils';
import { getUseExternalServices } from '../../selectors';
import { getIsSecurityTrustTdpEnabled } from '../../selectors/multichain/feature-flags';
import { useTokenAssetQueries } from './useTokenAssetQueries';
import { getUniqueTokenAssetIds } from './tokenAssetQuery';

const emptyResults: Record<string, string | undefined> = {};

function selectSecurityResultType(token: TokenAsset | null | undefined) {
  return token?.securityData?.resultType;
}

type Props = {
  assetIds: CaipAssetType[];
};

/**
 * Loads security result types for multiple tokens from the shared TokenAsset cache.
 *
 * @param props.assetIds - CAIP-19 asset identifiers to resolve.
 * @returns Map of asset ID to security resultType (e.g. Verified, Warning, Malicious).
 */
export function useTokenAssetSecurityResults({ assetIds }: Props) {
  const allowExternalServices = useSelector(getUseExternalServices);
  const isSecurityTrustEnabled = useSelector(getIsSecurityTrustTdpEnabled);
  const isEnabled = allowExternalServices && isSecurityTrustEnabled;

  const uniqueAssetIds = useMemo(
    () => getUniqueTokenAssetIds(assetIds),
    [assetIds],
  );

  const queries = useTokenAssetQueries({
    assetIds,
    enabled: isEnabled,
    select: selectSecurityResultType,
  });

  return useMemo(() => {
    if (!isEnabled) {
      return emptyResults;
    }

    return uniqueAssetIds.reduce<Record<string, string | undefined>>(
      (results, assetId, index) => {
        results[assetId] = queries[index]?.data;
        return results;
      },
      {},
    );
  }, [isEnabled, uniqueAssetIds, queries]);
}
