import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { TokenFeatureType } from '@metamask/bridge-controller';
import { getTokenAlerts, getTxAlerts } from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MinimalBridgeAlert } from '../prepare/types';
import {
  getTokenWarningSeverity,
  getTokenWarningTitle,
} from '../utils/quote-stream';

/**
 * Translates base tx and token alerts into {@link MinimalBridgeAlert} objects for display
 * @returns a list of {@link MinimalBridgeAlert} objects for token alerts
 * a single {@link MinimalBridgeAlert} object for the tx alert
 * and a list of security warnings for metrics
 */
export const useSecurityAlerts = (): {
  tokenAlerts: MinimalBridgeAlert[];
  txAlert: MinimalBridgeAlert | null;
  securityWarnings: string[];
} => {
  const t = useI18nContext();

  const baseTokenAlerts = useSelector(getTokenAlerts);
  const baseTxAlert = useSelector(getTxAlerts);

  // Combines hardcoded title/description translations with the token warnings from the controller
  const tokenAlerts = useMemo(() => {
    return baseTokenAlerts
      .filter((tokenFeature) =>
        [TokenFeatureType.MALICIOUS, TokenFeatureType.WARNING].includes(
          tokenFeature.type,
        ),
      )
      .map((tokenFeature, idx) => ({
        type: tokenFeature.type,
        id: `token-warning-${idx}` as const,
        description: tokenFeature.description,
        title: t(getTokenWarningTitle(tokenFeature.type)),
        severity: getTokenWarningSeverity(tokenFeature.type),
      }));
  }, [baseTokenAlerts, t]);

  const txAlert = useMemo(() => {
    return baseTxAlert
      ? {
          ...baseTxAlert,
          id: 'tx-alert' as const,
          title: t(baseTxAlert.titleId),
          description: `${baseTxAlert.description} ${t(baseTxAlert.descriptionId)}`,
          severity: 'danger' as const,
        }
      : null;
  }, [baseTxAlert, t]);

  const securityWarnings = useMemo(() => {
    return [
      ...tokenAlerts.map(({ description }) => description),
      txAlert?.description,
    ].filter((alert) => alert !== undefined);
  }, [tokenAlerts, txAlert?.description]);

  return { tokenAlerts, txAlert, securityWarnings };
};
