import { Hex, add0x } from '@metamask/utils';
import {
  BatchTransactionParams,
  GasFeeToken,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { useConfirmContext } from '../../../../context/confirm';
import { useEthFiatAmount } from '../../../../../../hooks/useEthFiatAmount';
import { formatAmount } from '../../../simulation-details/formatAmount';
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import {
  selectNetworkConfigurationByChainId,
  selectTransactionAvailableBalance,
} from '../../../../../../selectors';
import { useFeeCalculations } from './useFeeCalculations';

export const NATIVE_TOKEN_ADDRESS = '0x0'.padEnd(42, '0') as Hex;
export const RATE_WEI_NATIVE = '0xDE0B6B3A7640000'; // 1x10^18
export const METAMASK_FEE_PERCENTAGE = 0.35;

export function useGasFeeToken({ tokenAddress }: { tokenAddress: Hex }) {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const locale = useSelector(getIntlLocale);
  const nativeFeeToken = useNativeGasFeeToken();
  const { gasFeeTokens } = transactionMeta ?? {};

  let gasFeeToken = gasFeeTokens?.find(
    (token) => token.tokenAddress.toLowerCase() === tokenAddress.toLowerCase(),
  );

  if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
    gasFeeToken = nativeFeeToken;
  }

  const { amount, decimals } = gasFeeToken ?? { amount: '0x0', decimals: 0 };

  const metaMaskFee = add0x(
    new BigNumber(amount).times(METAMASK_FEE_PERCENTAGE).toString(16),
  );

  const amountFormatted = formatAmount(
    locale,
    new BigNumber(amount).shift(-decimals),
  );

  const amountFiat = useFiatTokenValue(gasFeeToken, gasFeeToken?.amount);
  const balanceFiat = useFiatTokenValue(gasFeeToken, gasFeeToken?.balance);
  const metamaskFeeFiat = useFiatTokenValue(gasFeeToken, metaMaskFee);

  if (!gasFeeToken) {
    return undefined;
  }

  const transferTransaction = getTransferTransaction(gasFeeToken);

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

  const { selectedGasFeeToken } = transactionMeta ?? {};

  return useGasFeeToken({ tokenAddress: selectedGasFeeToken ?? '0x' });
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
) {
  const { decimals, rateWei } = gasFeeToken ?? { decimals: 0, rateWei: '0x0' };

  const nativeWei = new BigNumber(tokenValue ?? '0x0')
    .shift(-decimals)
    .mul(new BigNumber(rateWei));

  const nativeEth = nativeWei.shift(-18);

  const fiatValue = useEthFiatAmount(nativeEth, {}, true);

  return gasFeeToken ? fiatValue : '';
}

function getTransferTransaction(
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
