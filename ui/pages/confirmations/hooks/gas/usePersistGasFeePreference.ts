import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { type TransactionMeta } from '@metamask/transaction-controller';
import { type Hex } from '@metamask/utils';
import { type AdvancedGasFeePreferences } from '../../../../../shared/constants/gas';
import { setAdvancedGasFee } from '../../../../store/actions';

export function usePersistGasFeePreference() {
  const dispatch = useDispatch();

  return useCallback(
    async (
      transactionMeta: TransactionMeta | undefined,
      gasFeePreferences: AdvancedGasFeePreferences,
    ) => {
      const account = transactionMeta?.txParams?.from as Hex | undefined;
      const chainId = transactionMeta?.chainId;

      if (!account || !chainId) {
        return;
      }

      await dispatch(
        setAdvancedGasFee({
          account,
          chainId,
          gasFeePreferences,
        }),
      );
    },
    [dispatch],
  );
}
