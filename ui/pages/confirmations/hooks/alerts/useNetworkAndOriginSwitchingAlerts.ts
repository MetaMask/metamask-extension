import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { TransactionMeta } from '@metamask/transaction-controller';
import { LastInteractedConfirmationInfo } from '../../../../../shared/types/confirm';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  getLastInteractedConfirmationInfo,
  setLastInteractedConfirmationInfo,
} from '../../../../store/actions';
import { selectNetworkConfigurationByChainId } from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SignatureRequestType } from '../../types/confirm';
import { useSignatureRequestOptional } from '../useSignatureRequest';
import { useTransactionMetadataRequestOptional } from '../useTransactionMetadataRequest';

const CHANGE_THRESHOLD_MS = 60 * 1000; // 1 Minute

export const useNetworkAndOriginSwitchingAlerts = (): Alert[] => {
  const t = useI18nContext();

  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;
  const { chainId: newChainId = '', id: currentConfirmationId } =
    currentConfirmation ?? {};
  const newOrigin =
    (currentConfirmation as TransactionMeta)?.origin ??
    (currentConfirmation as SignatureRequestType)?.msgParams?.origin ??
    '';
  const newNetwork = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, newChainId),
  );
  const [lastInteractedConfirmationInfo, updateLastInteractedConfirmationInfo] =
    useState<LastInteractedConfirmationInfo>();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const lastConfirmation = await getLastInteractedConfirmationInfo();

      if (!isMounted || !currentConfirmation) {
        return;
      }

      updateLastInteractedConfirmationInfo(lastConfirmation);

      const isNewId =
        !lastConfirmation || lastConfirmation?.id !== currentConfirmationId;
      if (!isNewId) {
        return;
      }

      setLastInteractedConfirmationInfo({
        id: currentConfirmationId,
        chainId: newChainId,
        origin: newOrigin,
        timestamp: new Date().getTime(),
      });
    })();
    return () => {
      isMounted = false;
    };
  }, [
    currentConfirmationId,
    newChainId,
    newOrigin,
    updateLastInteractedConfirmationInfo,
  ]);

  const networkAndOriginSwitchingAlerts = useMemo<Alert[]>((): Alert[] => {
    if (!currentConfirmationId || !lastInteractedConfirmationInfo) {
      return [];
    }

    const alerts: Alert[] = [];
    const currentTimestamp = new Date().getTime();

    const timeSinceLastConfirmation =
      currentTimestamp - lastInteractedConfirmationInfo.timestamp;

    const recentlyViewedOtherConfirmation =
      timeSinceLastConfirmation <= CHANGE_THRESHOLD_MS;

    if (!recentlyViewedOtherConfirmation) {
      return [];
    }

    const { chainId, origin } = lastInteractedConfirmationInfo;

    if (chainId !== newChainId) {
      alerts.push({
        key: 'networkSwitchInfo',
        reason: t('networkChanged'),
        field: RowAlertKey.Network,
        severity: Severity.Info,
        message: t('networkChangedMessage', [newNetwork?.name ?? '']),
      });
    }

    if (origin !== newOrigin) {
      alerts.push({
        key: 'originSwitchInfo',
        reason: t('originChanged'),
        field: RowAlertKey.RequestFrom,
        severity: Severity.Info,
        message: t('originChangedMessage', [newOrigin ?? '']),
      });
    }

    return alerts;
  }, [
    currentConfirmationId,
    lastInteractedConfirmationInfo,
    newNetwork?.name,
    newChainId,
    newOrigin,
    t,
  ]);

  return networkAndOriginSwitchingAlerts;
};
