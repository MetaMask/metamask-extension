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

  let hasInsufficientBalance;
  /**
   * Specific cases for chains with no native asset like Tempo.
   * - On normal Tempo 7702 flows, there is never enough native balance because there is no native.
   * - However, in some conditions we want to force-disable 7702 (like for with HW), causing Tempo to fall
   * into a degraded "legacy" flow. In this flow (detected when `excludeNativeTokenForFee` is false on a Tempo chain)
   * the old version of MetaMask used to read the RPC `getbalance` with a big number 424242424242...
   * This made MetaMask assume that the user had enough native token at all times, allowing the user to
   * be able to try to interact with the chain. The newest version of MetaMask sets "0" for Tempo native balance
   * which means that this "legacy flow" won't work anymore because MetaMask "sees" that there is not enough native token.
   * The line below restores the old "has enough balance no matter what" behavior that we had previously,
   * in the specific cases where 7702 is disabled for Tempo.
   * This should be a temporary solution until gasless/7702 is supported by hardware wallets.
   */
  if (NO_NATIVE_ASSET_CHAIN_IDS.has(chainId)) {
    /**
     * In Tempo:
     * - When `excludeNativeTokenForFee` is `true`, we are in the 7702 flow (force no native token).
     * - When `excludeNativeTokenForFee` is unset, we are in a non-7702 fallback (assume unlimited native token).
     */
    hasInsufficientBalance = Boolean(excludeNativeTokenForFee);
  } else {
    hasInsufficientBalance = !isBalanceSufficient({
      amount: totalValue,
      gasTotal: maxFeeHex,
      balance,
    });
  }

  return {
    hasInsufficientBalance,
    nativeCurrency: nativeCurrencySymbol,
  };
}
