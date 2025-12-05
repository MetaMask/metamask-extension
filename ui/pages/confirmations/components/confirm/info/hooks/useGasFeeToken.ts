import { Hex } from '@metamask/utils';
import {
  BatchTransactionParams,
  GasFeeToken,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../shared/constants/transaction';
import { getNetworkConfigurationsByChainId } from '../../../../../../../shared/modules/selectors/networks';
import { getCurrencyRates } from '../../../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useEthFiatAmount } from '../../../../../../hooks/useEthFiatAmount';
import {
  getShouldShowFiat,
  selectNetworkConfigurationByChainId,
  selectTransactionAvailableBalance,
} from '../../../../../../selectors';
import { formatAmount } from '../../../simulation-details/formatAmount';
import { useConfirmContext } from '../../../../context/confirm';
import { useFeeCalculations } from './useFeeCalculations';

export const RATE_WEI_NATIVE = '0xDE0B6B3A7640000'; // 1x10^18

export function useGasFeeToken({ tokenAddress }: { tokenAddress?: Hex }) {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const locale = useSelector(getIntlLocale);
  const nativeFeeToken = useNativeGasFeeToken();
  const { gasFeeTokens, chainId } = transactionMeta ?? {};

  let gasFeeToken = gasFeeTokens?.find(
    (token) => token.tokenAddress.toLowerCase() === tokenAddress?.toLowerCase(),
  );

  // This is just a legacy fallback for if `useGasFeeToken` were to be called
  // with no `tokenAddress`. Even if it's `NATIVE_TOKEN_ADDRESS` we don't rely
  // on `useNativeGasFeeToken`.
  if (!gasFeeToken) {
    gasFeeToken = nativeFeeToken;
  }

  const { amount, decimals } = gasFeeToken ?? { amount: '0x0', decimals: 0 };

  const metaMaskFee = gasFeeToken?.fee;

  const amountFormatted = formatAmount(
    locale,
    new BigNumber(amount).shift(-decimals),
  );

  const amountFiat = useFiatTokenValue(
    gasFeeToken,
    gasFeeToken?.amount,
    'AMOUNT',
    chainId,
  );
  const balanceFiat = useFiatTokenValue(
    gasFeeToken,
    gasFeeToken?.balance,
    'BALANCE',
    chainId,
  );
  const metamaskFeeFiat = useFiatTokenValue(
    gasFeeToken,
    metaMaskFee,
    'FEE',
    chainId,
  );

  const transferTransaction =
    tokenAddress === NATIVE_TOKEN_ADDRESS
      ? getNativeTransferTransaction(gasFeeToken)
      : getTokenTransferTransaction(gasFeeToken);

  return {
    ...gasFeeToken,
    amountFormatted,
    amountFiat,
    balanceFiat,
    metaMaskFee,
    metamaskFeeFiat,
    transferTransaction,
  };
}

export function useSelectedGasFeeToken() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { selectedGasFeeToken: tokenAddress } = transactionMeta ?? {};
  const selectedToken = useGasFeeToken({ tokenAddress });

  return tokenAddress ? selectedToken : undefined;
}

function useNativeGasFeeToken(): GasFeeToken {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { id: transactionId, txParams } = transactionMeta ?? {};

  const { estimatedFeeNativeHex } = useFeeCalculations(
    transactionMeta?.txParams
      ? transactionMeta
      : ({ txParams: {} } as TransactionMeta),
  );

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, transactionMeta?.chainId),
  );

  const balance = useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId),
  );

  const { nativeCurrency } = networkConfiguration ?? {};
  const { gas, maxFeePerGas, maxPriorityFeePerGas } = txParams ?? {};

  return {
    amount: estimatedFeeNativeHex,
    balance,
    decimals: 18,
    gas: gas as Hex,
    gasTransfer: '0x0',
    maxFeePerGas: maxFeePerGas as Hex,
    maxPriorityFeePerGas: maxPriorityFeePerGas as Hex,
    rateWei: RATE_WEI_NATIVE,
    recipient: NATIVE_TOKEN_ADDRESS,
    symbol: nativeCurrency,
    tokenAddress: NATIVE_TOKEN_ADDRESS,
  };
}

function useFiatTokenValue(
  gasFeeToken: GasFeeToken | undefined,
  tokenValue: Hex | undefined,
  _label: string,
  chainId?: Hex,
) {
  const { decimals, rateWei } = gasFeeToken ?? { decimals: 0, rateWei: '0x0' };

  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const showFiat = useSelector(getShouldShowFiat);
  const fiatFormatter = useFiatFormatter();

  // Get the correct conversion rate for the transaction's chainId
  const conversionRateForChain = chainId
    ? currencyRates?.[networkConfigurationsByChainId[chainId]?.nativeCurrency]
        ?.conversionRate
    : undefined;

  const nativeWei = new BigNumber(tokenValue ?? '0x0')
    .shift(-decimals)
    .mul(new BigNumber(rateWei));

  const nativeEth = nativeWei.shift(-18);

  // Always call the hook (even if not used) to avoid conditional hook errors
  const fallbackFiatValue = useEthFiatAmount(nativeEth, {}, true);

  // Calculate fiat value using the correct conversion rate
  if (!gasFeeToken || !tokenValue || !showFiat) {
    return '';
  }

  const conversionRate = conversionRateForChain;

  if (!conversionRate || conversionRate <= 0) {
    return fallbackFiatValue ?? '';
  }

  const fiatAmount = nativeEth.times(conversionRate.toString());

  if (fiatAmount.lt(new BigNumber(0.01)) && fiatAmount.gt(new BigNumber(0))) {
    return `< ${fiatFormatter(0.01)}`;
  }

  return fiatFormatter(fiatAmount.toNumber());
}

function getTokenTransferTransaction(
  gasFeeToken: GasFeeToken,
): BatchTransactionParams {
  const data = new Interface(abiERC20).encodeFunctionData('transfer', [
    gasFeeToken.recipient,
    gasFeeToken.amount,
  ]) as Hex;

  return {
    data,
    gas: gasFeeToken.gasTransfer,
    maxFeePerGas: gasFeeToken.maxFeePerGas,
    maxPriorityFeePerGas: gasFeeToken.maxPriorityFeePerGas,
    to: gasFeeToken.tokenAddress,
  };
}

function getNativeTransferTransaction(
  gasFeeToken: GasFeeToken,
): BatchTransactionParams {
  return {
    gas: gasFeeToken.gasTransfer,
    maxFeePerGas: gasFeeToken.maxFeePerGas,
    maxPriorityFeePerGas: gasFeeToken.maxPriorityFeePerGas,
    to: gasFeeToken.recipient,
    value: gasFeeToken.amount,
  };
}
