/**
 * MerklClaimToast Component
 *
 * Toast shown during and after Merkl rewards claim (in-progress, success, failed).
 */

import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
  toast,
} from '@metamask/design-system-react';
import React, { useEffect } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMerklClaimStatus } from '../../../hooks/musd/useMerklClaimStatus';
import { SECOND } from '../../../../shared/constants/time';

const getMerklToastTitle = (toastState: string, t: (key: string) => string) => {
  switch (toastState) {
    case 'in-progress':
      return t('merklRewardsToastInProgress');
    case 'success':
      return t('merklRewardsToastSuccess');
    case 'failed':
      return t('merklRewardsToastFailed');
    default:
      return '';
  }
};

const getMerklToastAccessory = (toastState: string) => {
  switch (toastState) {
    case 'in-progress':
      return (
        <DsIcon
          name={DsIconName.Loading}
          color={DsIconColor.IconDefault}
          size={DsIconSize.Lg}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      );
    case 'success':
      return (
        <DsIcon
          name={DsIconName.Confirmation}
          color={DsIconColor.SuccessDefault}
          size={DsIconSize.Lg}
        />
      );
    default:
      return (
        <DsIcon
          name={DsIconName.CircleX}
          color={DsIconColor.ErrorDefault}
          size={DsIconSize.Lg}
        />
      );
  }
};

const getMerklToastSeverity = (toastState: string) => {
  switch (toastState) {
    case 'in-progress':
      return 'default';
    case 'success':
      return 'success';
    default:
      return 'danger';
  }
};

export function MerklClaimToast() {
  const t = useI18nContext();
  const { toastState, dismissToast } = useMerklClaimStatus();
  useEffect(() => {
    if (!toastState) {
      return undefined;
    }

    const isInProgress = toastState === 'in-progress';
    const timeoutMs = 5 * SECOND;
    const clearToast = isInProgress
      ? undefined
      : setTimeout(() => {
          dismissToast();
        }, timeoutMs);

    toast({
      severity: getMerklToastSeverity(toastState),
      title: getMerklToastTitle(toastState, t),
      startAccessory: getMerklToastAccessory(toastState),
      'data-testid': 'merkl-claim-toast',
      hasNoTimeout: isInProgress,
      onClose: dismissToast,
    });

    return () => {
      if (clearToast) {
        clearTimeout(clearToast);
      }
      toast.dismiss();
    };
  }, [dismissToast, t, toastState]);

  return null;
}
