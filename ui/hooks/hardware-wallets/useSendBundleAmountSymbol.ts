import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import { parseStandardTokenTransactionData } from '../../../shared/lib/transaction.utils';
import { formatAmount } from '../../../shared/lib/format-amount';
import { getIntlLocale } from '../../ducks/locale/locale';
import { getAllTokens } from '../../selectors';
import { useI18nContext } from '../useI18nContext';

export type SendBundleAmountSymbol = {
  sendAmount?: string;
  sendSymbol?: string;
  gasSymbol?: string;
};

/**
 * Derives the display amount and symbol for a hardware-wallet sendBundle
 * transaction so the HW signing-page label matches the send confirmation.
 *
 * Self-contained (no confirmations route deps, ADR 0021).
 * Native send (TransactionType.simpleSend): amount from txParams.value,
 * preferring txParamsOriginal so enforced simulations don't zero it, formatted
 * via calcTokenAmount(value, 18) + formatAmount; symbol from the chain native
 * currency. Mirrors NativeSendHeading.
 * ERC20 token send (tokenMethod*): amount decoded from txParams.data via the
 * shared parseStandardTokenTransactionData, scaled by the token decimals and
 * formatted; symbol from the same token-list entry via getAllTokens. Mirrors
 * the ERC20 SendHeading derivation.
 *
 * Returns an empty object when there is no transaction.
 *
 * @param transactionMeta - The send transaction being signed.
 */
export function useSendBundleAmountSymbol(
  transactionMeta: TransactionMeta | undefined,
): SendBundleAmountSymbol {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const allTokens = useSelector(getAllTokens);

  if (!transactionMeta?.txParams) {
    return {};
  }

  const { txParams, chainId } = transactionMeta;

  // Resolve the symbol of the token used to pay the network fee, mirroring the
  // send confirmation (useSelectedGasFeeToken/useGasFeeToken): the selected fee
  // token from gasFeeTokens, falling back to the chain's native currency
  // symbol. Without this, the "Paying network fee with <symbol>" step label
  // rendered empty — most visibly when gas is paid in a non-native token.
  const nativeCurrency =
    networkConfigurationsByChainId?.[chainId]?.nativeCurrency;
  const gasSymbol =
    transactionMeta.gasFeeTokens?.find(
      (token) =>
        token.tokenAddress.toLowerCase() ===
        transactionMeta.selectedGasFeeToken?.toLowerCase(),
    )?.symbol ?? nativeCurrency;

  // Native send: mirror NativeSendHeading.
  if (transactionMeta.type === TransactionType.simpleSend) {
    const displayValue =
      transactionMeta.txParamsOriginal?.value ?? txParams.value;
    const nativeAssetTransferValue = displayValue
      ? calcTokenAmount(displayValue, 18)
      : undefined;

    return {
      sendAmount: nativeAssetTransferValue
        ? formatAmount(locale, nativeAssetTransferValue)
        : undefined,
      sendSymbol: nativeCurrency,
      gasSymbol,
    };
  }

  // ERC20 token send: decode the transfer amount from the tx data and look up
  // the token's symbol/decimals from the token list (same sources the ERC20
  // SendHeading derives from).
  const { to, from } = txParams;
  const tokenListToken = allTokens?.[chainId]?.[from]?.find(
    (token) => token.address?.toLowerCase() === to?.toLowerCase(),
  );

  const parsed = txParams.data
    ? parseStandardTokenTransactionData(txParams.data)
    : undefined;
  const transferAmount = calcTokenAmount(
    (parsed?.args?._value as string | number | BigNumber | undefined) ?? '0',
    tokenListToken?.decimals,
  );

  return {
    sendAmount: formatAmount(locale, transferAmount),
    sendSymbol: tokenListToken?.symbol ?? t('unknown'),
    gasSymbol,
  };
}
