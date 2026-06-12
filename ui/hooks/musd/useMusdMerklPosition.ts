import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { isEmptyHexString } from '../../../shared/lib/hexstring-utils';
import { isZeroAmount } from '../../helpers/utils/number-utils';
import {
  MERKL_ELIGIBLE_MUSD_CHAIN_IDS,
  isMusdToken,
} from '../../components/app/musd/constants';
import { getAssetsBySelectedAccountGroup } from '../../selectors/assets';

export type UseMusdMerklPositionResult = {
  aggregatedFiat: number;
  hasAnyBalance: boolean;
};

/**
 * Aggregates the user's mUSD fiat value and positive-balance flag across the
 * Merkl-eligible chains (mainnet + Linea, excluding BSC). Pass `enabled: false`
 * to short-circuit the computation when the caller isn't in an mUSD context.
 * @param enabled
 */
export function useMusdMerklPosition(
  enabled: boolean = true,
): UseMusdMerklPositionResult {
  const accountGroupIdAssets = useSelector(getAssetsBySelectedAccountGroup);

  return useMemo(() => {
    if (!enabled) {
      return { aggregatedFiat: 0, hasAnyBalance: false };
    }

    const musdAssets = MERKL_ELIGIBLE_MUSD_CHAIN_IDS.map((chainId) =>
      (accountGroupIdAssets[chainId] ?? []).find(
        (a) => 'address' in a && isMusdToken(a.address),
      ),
    ).filter((a): a is NonNullable<typeof a> => Boolean(a));

    let aggregatedFiat = 0;
    let hasAnyBalance = false;
    for (const a of musdAssets) {
      const fiat = a.fiat?.balance;
      if (typeof fiat === 'number' && Number.isFinite(fiat)) {
        aggregatedFiat += fiat;
      }
      if (!hasAnyBalance) {
        const raw = a.rawBalance as string | undefined;
        hasAnyBalance =
          typeof raw === 'string' && raw.length > 0
            ? !isEmptyHexString(raw)
            : !isZeroAmount(a.balance ?? '0');
      }
    }

    return { aggregatedFiat, hasAnyBalance };
  }, [enabled, accountGroupIdAssets]);
}
