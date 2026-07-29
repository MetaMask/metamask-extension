import type { CaipAssetType } from '@metamask/utils';
import { parseCaipAssetType, isCaipAssetType } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { getSpendableForAccount } from '../../../selectors/stellar-assets';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';

type UseSpendableBalanceResult =
  | {
      hasSpendableBalance: true;
      minimumReserveBalance: string;
      spendableBalance: string;
    }
  | {
      hasSpendableBalance: false;
      minimumReserveBalance: undefined;
      spendableBalance: undefined;
    };

/**
 * Resolves native spendable balance data for an account/asset pair.
 *
 * @param params - Hook parameters.
 * @param params.accountId - Optional account id override.
 * @param params.assetId - CAIP asset id for the native asset.
 * @returns Minimum reserve and spendable balance when available.
 */
export const useSpendableBalance = ({
  accountId,
  assetId,
}: {
  accountId?: string;
  assetId?: CaipAssetType;
}): UseSpendableBalanceResult => {
  const chainId =
    assetId && isCaipAssetType(assetId)
      ? parseCaipAssetType(assetId).chainId
      : undefined;
  const selectedAccountId = useSelector((state) => {
    if (accountId || !chainId) {
      return undefined;
    }

    return getInternalAccountBySelectedAccountGroupAndCaip(state, chainId)?.id;
  });
  const resolvedAccountId = accountId ?? selectedAccountId;

  const spendableInfo = useSelector((state) =>
    getSpendableForAccount(state, resolvedAccountId, assetId),
  );

  if (
    spendableInfo?.minimumReserveBalance !== undefined &&
    spendableInfo?.spendableBalance !== undefined
  ) {
    return {
      hasSpendableBalance: true,
      minimumReserveBalance: spendableInfo.minimumReserveBalance,
      spendableBalance: spendableInfo.spendableBalance,
    };
  }

  return {
    hasSpendableBalance: false,
    minimumReserveBalance: undefined,
    spendableBalance: undefined,
  };
};
