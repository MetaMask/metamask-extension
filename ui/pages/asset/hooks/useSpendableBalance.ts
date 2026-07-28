import type { CaipAssetType } from '@metamask/utils';
import { parseCaipAssetType, isCaipAssetType } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { getSpendableForAccount } from '../../../selectors/stellar-assets';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';

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
}) => {
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

  return {
    minimumReserveBalance: spendableInfo?.minimumReserveBalance,
    spendableBalance: spendableInfo?.spendableBalance,
  };
};
