import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AccountAbstractionState,
  selectUserOperationMetadata,
} from '../../../../../selectors/account-abstraction';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { currentConfirmationSelector } from '../../../selectors';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';

export function usePaymasterAlerts(): Alert[] {
  const t = useI18nContext();

  const currentConfirmation = useSelector(currentConfirmationSelector) as
    | TransactionMeta
    | undefined;

  const { id: transactionId, isUserOperation } = currentConfirmation ?? {};

  const userOperationMetadata = useSelector((state) =>
    selectUserOperationMetadata(
      state as AccountAbstractionState,
      transactionId as string,
    ),
  );

  const paymasterData = userOperationMetadata?.userOperation?.paymasterAndData;

  const isUsingPaymaster =
    isUserOperation && paymasterData?.length && paymasterData !== '0x';

  return useMemo(() => {
    if (!isUsingPaymaster) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        key: 'usingPaymaster',
        message: t('paymasterInUse'),
        reason: t('alertReasonUsingPaymaster'),
        severity: Severity.Info,
      },
    ];
  }, [isUsingPaymaster]);
}
