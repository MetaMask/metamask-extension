import type { CaipAssetType } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  computeSpendableBalance,
  isSupportBaseReserve,
} from '../../../../shared/lib/multichain/spendable-balance';
import { getStellarBaseReserveForAccountAsset } from '../../../selectors/stellar-assets';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';

/**
 * Resolves native spendable balance data for an account/asset pair.
 *
 * @param params - Hook parameters.
 * @param params.accountId - Optional account id override.
 * @param params.assetId - CAIP asset id for the native asset.
 * @param params.totalBalance - Total balance display string used to compute spendable balance.
 * @returns Base reserve and spendable balance when available.
 */
export const useSpendableBalance = ({
  accountId,
  assetId,
  totalBalance,
}: {
  accountId?: string;
  assetId?: CaipAssetType;
  totalBalance?: string;
}) => {
  const chainId = assetId ? parseCaipAssetType(assetId).chainId : undefined;
  const selectedAccountId = useSelector((state) => {
    if (accountId || !chainId) {
      return undefined;
    }

    return getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)?.id;
  });
  const resolvedAccountId = accountId ?? selectedAccountId;

  const baseReserve = useSelector((state) => {
    if (!assetId || !resolvedAccountId || !isSupportBaseReserve(assetId)) {
      return undefined;
    }

    return getStellarBaseReserveForAccountAsset(
      state,
      resolvedAccountId,
      assetId,
    );
  });

  const spendableBalance = useMemo(() => {
    if (baseReserve === undefined || totalBalance === undefined) {
      return undefined;
    }

    return computeSpendableBalance(totalBalance, baseReserve);
  }, [baseReserve, totalBalance]);

  return {
    baseReserve,
    spendableBalance,
  };
};
