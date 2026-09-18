import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { getTxAlerts } from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MinimalBridgeAlert } from '../prepare/types';
import { BridgeToken } from '../../../ducks/bridge/types';
import { BridgeAssetSecurityDataType } from '../utils/tokens';
import { useAssetSecurityData } from './useAssetSecurityData';

/**
 * Translates base tx and token alerts into {@link MinimalBridgeAlert} objects for display
 * @param asset
 * @returns a list of {@link MinimalBridgeAlert} objects for token alerts
 * a single {@link MinimalBridgeAlert} object for the tx alert
 * and a list of security warnings for metrics
 */
export const useSecurityAlerts = (
  asset: BridgeToken,
): {
  txAlert: MinimalBridgeAlert | null;
  securityWarnings: string[];
} => {
  const t = useI18nContext();

  const baseTxAlert = useSelector(getTxAlerts);
  const securityData = useMemo(
    () =>
      asset.securityData?.metadata?.features.map(
        (feature) => `[${feature.featureId}]: ${feature.description}`,
      ) ?? [],
    [asset],
  );

  // Combines hardcoded title/description translations with the token warnings from the controller

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
    return [...securityData, txAlert?.description].filter(
      (alert) => alert !== undefined,
    );
  }, [securityData, txAlert?.description]);

  return { securityWarnings, txAlert };
};
