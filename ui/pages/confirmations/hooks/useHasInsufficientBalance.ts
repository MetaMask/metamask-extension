import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { sumHexes } from '../../../../shared/lib/conversion.utils';
import { getNativeTokenCachedBalanceByChainIdSelector } from '../../../selectors';
import { useConfirmContext } from '../context/confirm';
import { isBalanceSufficient } from '../send-utils/send.utils';
import { useFeeCalculations } from '../components/confirm/info/hooks/useFeeCalculations';
import { useNativeCurrencySymbol } from '../components/confirm/info/hooks/useNativeCurrencySymbol';

const NO_NATIVE_ASSET_CHAIN_IDS = new Set(['0x1079', '0xa5bf']);

const ZERO_HEX_FALLBACK = '0x0';

export function useHasInsufficientBalance(): {
  hasInsufficientBalance: boolean;
  nativeCurrency?: string;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    chainId,
    excludeNativeTokenForFee,
    txParams: { value = ZERO_HEX_FALLBACK, from: fromAddress = '' } = {},
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? ZERO_HEX_FALLBACK,
    ) ?? [];

  const chainBalances = useSelector((state) =>
    getNativeTokenCachedBalanceByChainIdSelector(state, fromAddress ?? ''),
  ) as Record<Hex, Hex>;

  const balance = chainBalances?.[chainId as Hex] ?? ZERO_HEX_FALLBACK;

  const totalValue = sumHexes(value, ...batchTransactionValues);

  const { maxFeeHex } = useFeeCalculations(
    currentConfirmation?.txParams
      ? currentConfirmation
      : ({ txParams: {} } as TransactionMeta),
  );

  const { nativeCurrencySymbol } = useNativeCurrencySymbol(chainId);
  const hasNoNativeAsset = NO_NATIVE_ASSET_CHAIN_IDS.has(chainId);
  /**
   * Tempo (7702) special case: Force "enough native balance" in legacy flow
   * (when `excludeNativeTokenForFee` is false) to restore old MetaMask behavior.
   * New MM reports "0" balance, breaking legacy flow. Temporary fix until HW
   * supports gasless/7702.
   */
  const hasInsufficientBalance = hasNoNativeAsset
    ? Boolean(excludeNativeTokenForFee)
    : !isBalanceSufficient({
        amount: totalValue,
        gasTotal: maxFeeHex,
        balance,
      });

  return {
    hasInsufficientBalance,
    nativeCurrency: nativeCurrencySymbol,
  };
}
