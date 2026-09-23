import { useSelector } from 'react-redux';

import { getSpendableForAccount } from '../../../selectors/stellar-assets';

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
 * Resolves native spendable balance data for the selected account and asset.
 *
 * @param params - Hook parameters.
 * @param params.assetId - Asset id for the native asset.
 * @returns Minimum reserve and spendable balance when available.
 */
export const useSpendableBalance = ({
  assetId,
}: {
  assetId: string;
}): UseSpendableBalanceResult => {
  const spendableInfo = useSelector((state) =>
    getSpendableForAccount(state, { assetId }),
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
