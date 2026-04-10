import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { sumHexes } from '../../../../shared/lib/conversion.utils';
import { getNativeTokenCachedBalanceByChainIdSelector } from '../../../selectors';
import { useConfirmContext } from '../context/confirm';
import { isBalanceSufficient } from '../send-utils/send.utils';
import { useFeeCalculations } from '../components/confirm/info/hooks/useFeeCalculations';
import { useNativeCurrencySymbol } from '../components/confirm/info/hooks/useNativeCurrencySymbol';

const ZERO_HEX_FALLBACK = '0x0';

export function useHasInsufficientBalance(): {
  hasInsufficientBalance: boolean;
  nativeCurrency?: string;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    chainId,
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
  const insufficientBalance = !isBalanceSufficient({
    amount: totalValue,
    gasTotal: maxFeeHex,
    balance,
  });

  return {
    hasInsufficientBalance: insufficientBalance,
    nativeCurrency: nativeCurrencySymbol,
  };
}
