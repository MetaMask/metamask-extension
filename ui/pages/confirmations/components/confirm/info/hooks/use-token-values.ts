import { TransactionMeta } from '@metamask/transaction-controller';
import { isHexString } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { isBoolean } from 'lodash';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { calcTokenAmount } from '../../../../../../../shared/lib/transactions-controller-utils';
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

  const { decodedTransferValue, isDecodedTransferValuePending } =
    useMemo(() => {
      if (!value) {
        return {
          decodedTransferValue: '0',
          isDecodedTransferValuePending: false,
        };
      }

      if (!decimals) {
        return {
          decodedTransferValue: '0',
          isDecodedTransferValuePending: true,
        };
      }

      const paramIndex = value.data[0].params.findIndex(
        (param) =>
          param.value !== undefined &&
          !isHexString(param.value) &&
          param.value.length === undefined &&
          !isBoolean(param.value),
      );
      if (paramIndex === -1) {
        return {
          decodedTransferValue: '0',
          isDecodedTransferValuePending: false,
        };
      }

      return {
        decodedTransferValue: calcTokenAmount(
          value.data[0].params[paramIndex].value,
          decimals,
        ).toFixed(),
        isDecodedTransferValuePending: false,
      };
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
    decodedTransferValue,
    displayTransferValue,
    fiatDisplayValue,
    pending: pending || isDecodedTransferValuePending,
  };
};
