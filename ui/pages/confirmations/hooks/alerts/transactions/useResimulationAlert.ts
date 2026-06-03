'use no memo';

import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';

import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapContext } from '../../../context/dapp-swap';

export function useResimulationAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { isQuotedSwapDisplayedInInfo } = useDappSwapContext();

  const transactionMeta = currentConfirmation as TransactionMeta;

  const isUpdatedAfterSecurityCheck =
    transactionMeta?.simulationData?.isUpdatedAfterSecurityCheck;
  const isWalletInitiated = transactionMeta?.origin === ORIGIN_METAMASK;

  return useMemo(() => {
    if (
      !isUpdatedAfterSecurityCheck ||
      isWalletInitiated ||
      isQuotedSwapDisplayedInInfo
    ) {
      return [];
    }

    return [
      {
        actions: [],
        field: RowAlertKey.Resimulation,
        isBlocking: false,
        key: 'simulationDetailsTitle',
        message: t('alertMessageChangeInSimulationResults'),
        reason: t('alertReasonChangeInSimulationResults'),
        severity: Severity.Danger,
      },
    ];
  }, [
    isQuotedSwapDisplayedInInfo,
    isUpdatedAfterSecurityCheck,
    isWalletInitiated,
    t,
  ]);
}
