import { TransactionMeta } from '@metamask/transaction-controller';
import { isHexString } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { isBoolean } from 'lodash';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import useTokenExchangeRate from '../../../../../../components/app/currency-input/hooks/useTokenExchangeRate';
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useAssetDetails } from '../../../../hooks/useAssetDetails';
import { formatAmount } from '../../../simulation-details/formatAmount';
import { useDecodedTransactionData } from './useDecodedTransactionData';

export const useTokenValues = (transactionMeta: TransactionMeta) => {
  const { decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
    transactionMeta.chainId,
  );

  const decodedResponse = useDecodedTransactionData();
  const { value, pending } = decodedResponse;

  const decodedTransferValue = useMemo(() => {
    if (!value || !decimals) {
      return 0;
    }

    const paramIndex = value.data[0].params.findIndex(
      (param) =>
        param.value !== undefined &&
        !isHexString(param.value) &&
        param.value.length === undefined &&
        !isBoolean(param.value),
    );
    if (paramIndex === -1) {
      return 0;
    }

    return new BigNumber(value.data[0].params[paramIndex].value.toString())
      .dividedBy(new BigNumber(10).pow(Number(decimals)))
      .toNumber();
  }, [value, decimals]);

  const [exchangeRate, setExchangeRate] = useState<Numeric | undefined>();
  const fetchExchangeRate = async () => {
    const result = await useTokenExchangeRate(transactionMeta?.txParams?.to);

    setExchangeRate(result);
  };
  fetchExchangeRate();

  const fiatValue =
    exchangeRate &&
    decodedTransferValue &&
    exchangeRate.times(decodedTransferValue, 10).toNumber();
  const fiatFormatter = useFiatFormatter();
  const fiatDisplayValue =
    fiatValue && fiatFormatter(fiatValue, { shorten: true });

  const locale = useSelector(getIntlLocale);
  const displayTransferValue = formatAmount(
    locale,
    new BigNumber(decodedTransferValue),
  );

  return {
    decodedTransferValue: toNonScientificString(decodedTransferValue),
    displayTransferValue,
    fiatDisplayValue,
    pending,
  };
};

export function toNonScientificString(num: number): string {
  if (num >= 10e-18) {
    return num.toFixed(18).replace(/\.?0+$/u, '');
  }

  // keep in scientific notation
  return num.toString();
}
