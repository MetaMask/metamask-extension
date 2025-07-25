import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { calcTokenAmount } from '../../../../../../../shared/lib/transactions-controller-utils';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { formatAmount } from '../../../simulation-details/formatAmount';
import { useTokenTransactionData } from './useTokenTransactionData';

export const useTokenValues = (transactionMeta: TransactionMeta) => {
  const locale = useSelector(getIntlLocale);
  const parsedTransactionData = useTokenTransactionData();
  const exchangeRate = useTokenExchangeRate(transactionMeta?.txParams?.to);
  const fiatFormatter = useFiatFormatter();

  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
    transactionMeta.chainId,
  );

  const value = parsedTransactionData?.args?._value as BigNumber | undefined;

  const decodedTransferValue =
    decimals !== undefined && value
      ? calcTokenAmount(value, Number(decimals)).toFixed()
      : '0';

  const fiatValue =
    exchangeRate &&
    decodedTransferValue &&
    exchangeRate.times(decodedTransferValue, 10).toNumber();

  const isNonZeroSmallValue =
    fiatValue &&
    new BigNumber(String(fiatValue)).greaterThan(new BigNumber(0)) &&
    new BigNumber(String(fiatValue)).lt(new BigNumber(0.01));
  const fiatDisplayValue = isNonZeroSmallValue
    ? `< ${fiatFormatter(0.01, { shorten: true })}`
    : fiatValue && fiatFormatter(fiatValue, { shorten: true });

  const displayTransferValue = formatAmount(
    locale,
    new BigNumber(decodedTransferValue),
  );

  return {
    decodedTransferValue,
    displayTransferValue,
    fiatDisplayValue,
    fiatValue,
  };
};
