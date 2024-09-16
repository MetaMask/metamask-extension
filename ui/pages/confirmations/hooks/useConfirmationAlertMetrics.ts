import { useCallback, useEffect, useState } from 'react';
import { validate as isUuid } from 'uuid';

import useAlerts from '../../../hooks/useAlerts';
import { updateEventFragment } from '../../../store/actions';
import { SignatureRequestType } from '../types/confirm';
import { isSignatureTransactionType } from '../utils';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { useConfirmContext } from '../context/confirm';
import { generateSignatureUniqueId } from '../../../helpers/utils/metrics';
import { AlertsName } from './alerts/constants';
import { useTransactionEventFragment } from './useTransactionEventFragment';

export type AlertMetricsProperties = {
  alert_visualized: string[];
  alert_visualized_count: number;
  alert_key_clicked: string[];
  alert_action_clicked: string[];
};

export const ALERTS_NAME_METRICS: Record<AlertsName | string, string> = {
  [AlertsName.GasEstimateFailed]: 'gas_estimate_failed',
  [AlertsName.GasFeeLow]: 'gas_fee_low',
  [AlertsName.GasTooLow]: 'gas_too_low',
  [AlertsName.InsufficientBalance]: 'insufficient_balance',
  [AlertsName.NetworkBusy]: 'network_busy',
  [AlertsName.NoGasPrice]: 'no_gas_price',
  [AlertsName.PendingTransaction]: 'pending_transaction',
  [AlertsName.SigningOrSubmitting]: 'signing_or_submitting',
  [AlertsName.Blockaid]: 'blockaid',
};

function uniqueFreshArrayPush<T>(array: T[], value: T): T[] {
  return [...new Set([...array, value])];
}

function getAlertNames(alerts: Alert[]): string[] {
  return alerts.map((alert) => getAlertName(alert.key));
}

function getAlertName(alertKey: string): string {
  return isUuid(alertKey)
    ? ALERTS_NAME_METRICS[AlertsName.Blockaid]
    : ALERTS_NAME_METRICS[alertKey] ?? alertKey;
}

export function useConfirmationAlertMetrics() {
  const { currentConfirmation } = useConfirmContext();
  const ownerId = currentConfirmation?.id ?? '';
  const { alerts, isAlertConfirmed } = useAlerts(ownerId);
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const [metricsProperties, setMetricsProperties] =
    useState<AlertMetricsProperties>({
      alert_visualized: [],
      alert_visualized_count: 0,
      alert_key_clicked: [],
      alert_action_clicked: [],
    });

  const properties =
    alerts.length > 0
      ? {
          alert_triggered_count: alerts.length,
          alert_triggered: getAlertNames(alerts),
          alert_resolved_count: alerts.filter((alert) =>
            isAlertConfirmed(alert.key),
          ).length,
          alert_resolved: getAlertNames(
            alerts.filter((alert) => isAlertConfirmed(alert.key)),
          ),
          ...metricsProperties,
        }
      : undefined;

  const trackAlertRender = useCallback((alertKey: string) => {
    setMetricsProperties((prevState) => {
      const newState = { ...prevState };
      const alertName = getAlertName(alertKey);
      newState.alert_visualized = uniqueFreshArrayPush(
        prevState.alert_visualized,
        alertName,
      );
      newState.alert_visualized_count = newState.alert_visualized.length;
      return newState;
    });
  }, []);

  const trackInlineAlertClicked = useCallback((alertKey: string) => {
    setMetricsProperties((prevState) => {
      const newState = { ...prevState };
      const alertName = getAlertName(alertKey);
      newState.alert_key_clicked = uniqueFreshArrayPush(
        prevState.alert_key_clicked,
        alertName,
      );
      return newState;
    });
  }, []);

  const trackAlertActionClicked = useCallback((alertKey: string) => {
    setMetricsProperties((prevState) => {
      const newState = { ...prevState };
      const alertName = getAlertName(alertKey);
      newState.alert_action_clicked = uniqueFreshArrayPush(
        prevState.alert_action_clicked,
        alertName,
      );
      return newState;
    });
  }, []);

  const updateAlertMetrics = useCallback(() => {
    if (!properties) {
      return;
    }

    if (isSignatureTransactionType(currentConfirmation)) {
      const requestId = (currentConfirmation as SignatureRequestType).msgParams
        ?.requestId as number;
      const fragmentUniqueId = generateSignatureUniqueId(requestId);
      updateEventFragment(fragmentUniqueId, {
        properties,
      });
    } else {
      updateTransactionEventFragment({ properties }, ownerId);
    }
  }, [JSON.stringify(properties), updateTransactionEventFragment, ownerId]);

  useEffect(() => {
    updateAlertMetrics();
  }, [updateAlertMetrics]);

  return {
    trackAlertRender,
    trackInlineAlertClicked,
    trackAlertActionClicked,
  };
}
