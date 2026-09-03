/* eslint-disable @typescript-eslint/naming-convention */

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
import { simulationIndicatesMonadReserveBalanceViolation } from '../../../../../../shared/lib/monad-reserve-balance';
import { RevertReason } from '../../../components/revert-reason/revert-reason';
import { useConfirmContext } from '../../../context/confirm';
import { useEstimationFailed } from '../../gas/useEstimationFailed';
import { useIsGasSponsored } from '../../gas/useIsGasSponsored';

export function useGasEstimateFailedAlerts(): Alert[] {
  const t = useI18nContext();
  const estimationFailed = useEstimationFailed();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, simulationData, simulationFails } =
    currentConfirmation ?? {};

  const isGasSponsored = useIsGasSponsored();
  const isMonadReserveViolation =
    Boolean(chainId) &&
    simulationIndicatesMonadReserveBalanceViolation({
      simulationData,
      simulationFails,
    });

  return useMemo(() => {
    // Prefer the specific Monad reserve alert over a generic estimate-failed warning.
    if (!estimationFailed || isGasSponsored || isMonadReserveViolation) {
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
  }, [t, estimationFailed, isGasSponsored, isMonadReserveViolation]);
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
