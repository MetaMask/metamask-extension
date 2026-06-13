'use no memo';

import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import useAlerts from '../../../../hooks/useAlerts';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayQuoteValidationError } from '../pay/useTransactionPayData';
import { AlertsName } from '../alerts/constants';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectConfirmationAdvancedDetailsOpen } from '../../selectors/preferences';

const ALERTS_HIDE_RESULTS: string[] = [
  AlertsName.InsufficientPayTokenBalance,
  AlertsName.PayHardwareAccount,
  AlertsName.SigningOrSubmitting,
];

const ALERTS_DISABLE_UPDATE: string[] = [
  AlertsName.PayHardwareAccount,
  AlertsName.SigningOrSubmitting,
];

const QUOTE_SIMULATION_FAILED_PREFIX = /^Quote simulation failed\s*[-:]\s*/iu;

export function useTransactionCustomAmountAlerts(): {
  alertDetails?: string;
  alertMessage?: string;
  hideResults: boolean;
  disableUpdate: boolean;
} {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const quoteValidationError = useTransactionPayQuoteValidationError();
  const showAdvancedDetails = useSelector(selectConfirmationAdvancedDetailsOpen);
  const transactionId = currentConfirmation?.id ?? '';
  const { alerts: confirmationAlerts } = useAlerts(transactionId);

  const blockingAlerts = useMemo(
    () => confirmationAlerts.filter((a) => a.isBlocking),
    [confirmationAlerts],
  );

  const hideResults = useMemo(
    () => blockingAlerts.some((a) => ALERTS_HIDE_RESULTS.includes(a.key)),
    [blockingAlerts],
  );

  const disableUpdate = useMemo(
    () => blockingAlerts.some((a) => ALERTS_DISABLE_UPDATE.includes(a.key)),
    [blockingAlerts],
  );

  if (quoteValidationError) {
    return {
      alertDetails: showAdvancedDetails
        ? formatQuoteValidationDetails(quoteValidationError.message)
        : undefined,
      alertMessage: t('alertPayQuoteValidationTitle'),
      hideResults: true,
      disableUpdate,
    };
  }

  const firstAlert = blockingAlerts?.[0];

  if (!firstAlert) {
    return {
      hideResults,
      disableUpdate,
    };
  }

  const { reason, message } = firstAlert;
  const alertMessage =
    reason && message && reason !== message ? message : undefined;

  return {
    ...(alertMessage ? { alertMessage } : {}),
    hideResults,
    disableUpdate,
  };
}

function formatQuoteValidationDetails(message: string): string {
  return message.replace(QUOTE_SIMULATION_FAILED_PREFIX, '');
}
