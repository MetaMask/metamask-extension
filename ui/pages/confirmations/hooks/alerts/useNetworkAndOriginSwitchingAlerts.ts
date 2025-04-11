import type { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import type { LastInteractedConfirmationInfo } from '../../../../../shared/types/confirm';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import type { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectNetworkConfigurationByChainId } from '../../../../selectors';
import {
  getLastInteractedConfirmationInfo,
  setLastInteractedConfirmationInfo,
} from '../../../../store/actions';
import { useConfirmContext } from '../../context/confirm';
import type { SignatureRequestType } from '../../types/confirm';

const CHANGE_THRESHOLD_MS = 60 * 1000; // 1 Minute

export const useNetworkAndOriginSwitchingAlerts = (): Alert[] => {
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext();
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
    (async () => {
      const lastConfirmation = await getLastInteractedConfirmationInfo();

      if (!isMounted) {
        return;
      }

      updateLastInteractedConfirmationInfo(lastConfirmation);

      const isNewId =
        !lastConfirmation || lastConfirmation?.id !== currentConfirmationId;
      if (!isNewId) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
