/* eslint-disable @typescript-eslint/naming-convention */
'use no memo';

import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useMemo } from 'react';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RevertReason } from '../../../components/revert-reason/revert-reason';
import { useConfirmContext } from '../../../context/confirm';
import { useEstimationFailed } from '../../gas/useEstimationFailed';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext();
  const estimationFailed = useEstimationFailed();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const hasGasRevert = Boolean(currentConfirmation?.revert?.gas?.message);

  return useMemo(() => {
    if (!estimationFailed) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.ShowAdvancedGasFeeModal,
            label: t('alertActionUpdateGas'),
          },
        ],
        content: <GasEstimateFailedAlertMessage hasGasRevert={hasGasRevert} />,
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        reason: t('alertReasonGasEstimateFailed'),
        severity: Severity.Warning,
      },
    ];
  }, [estimationFailed, hasGasRevert, t]);
}

function GasEstimateFailedAlertMessage({
  hasGasRevert,
}: {
  hasGasRevert: boolean;
}) {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextDefault}
        data-testid="alert-modal__selected-alert"
      >
        {t('alertMessageGasEstimateFailed')}
      </Text>
      {hasGasRevert && (
        <RevertReason
          source="gas"
          data-testid="gas-estimate-failed-revert-reason"
        />
      )}
    </Box>
  );
}
