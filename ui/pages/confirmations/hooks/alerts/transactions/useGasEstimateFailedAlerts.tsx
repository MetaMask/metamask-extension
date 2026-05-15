/* eslint-disable @typescript-eslint/naming-convention */
'use no memo';

import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RevertReason } from '../../../components/revert-reason/revert-reason';
import { useEstimationFailed } from '../../gas/useEstimationFailed';
import { useIsCurrentTransactionGasSponsored } from './useIsCurrentTransactionGasSponsored';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext();
  const estimationFailed = useEstimationFailed();

  const { isCurrentTransactionGasSponsored } =
    useIsCurrentTransactionGasSponsored();

  return useMemo(() => {
    if (!estimationFailed || isCurrentTransactionGasSponsored) {
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
        content: <GasEstimateFailedAlertMessage />,
        field: RowAlertKey.EstimatedFee,
        key: 'gasEstimateFailed',
        reason: t('alertReasonGasEstimateFailed'),
        severity: Severity.Warning,
      },
    ];
  }, [t, estimationFailed, isCurrentTransactionGasSponsored]);
}

function GasEstimateFailedAlertMessage() {
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
      <RevertReason
        source="gas"
        data-testid="gas-estimate-failed-revert-reason"
      />
    </Box>
  );
}
