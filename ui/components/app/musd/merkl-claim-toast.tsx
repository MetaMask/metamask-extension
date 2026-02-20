/**
 * MerklClaimToast Component
 *
 * Toast shown during and after Merkl rewards claim (in-progress, success, failed).
 */

import React from 'react';
import {
  Icon as DsIcon,
  IconColor as DsIconColor,
  IconName as DsIconName,
  IconSize as DsIconSize,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMerklClaimStatus } from '../../../hooks/musd/useMerklClaimStatus';
import { Toast } from '../../multichain';

export function MerklClaimToast() {
  const t = useI18nContext();
  const { toastState, dismissToast } = useMerklClaimStatus();

  const autoHideDelay = 5 * SECOND;

  if (!toastState) {
    return null;
  }

  const isInProgress = toastState === 'in-progress';
  const isSuccess = toastState === 'success';

  const toastText = (() => {
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
  })();

  const startAdornment = (() => {
    if (isInProgress) {
      return (
        <DsIcon
          name={DsIconName.Loading}
          color={DsIconColor.IconDefault}
          size={DsIconSize.Lg}
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
      );
    }
    if (isSuccess) {
      return (
        <DsIcon
          name={DsIconName.Confirmation}
          color={DsIconColor.SuccessDefault}
          size={DsIconSize.Lg}
        />
      );
    }
    return (
      <DsIcon
        name={DsIconName.CircleX}
        color={DsIconColor.ErrorDefault}
        size={DsIconSize.Lg}
      />
    );
  })();

  return (
    <Toast
      key="merkl-claim-toast"
      dataTestId="merkl-claim-toast"
      text={toastText}
      startAdornment={startAdornment}
      onClose={dismissToast}
      {...(!isInProgress && {
        autoHideTime: autoHideDelay,
        onAutoHideToast: dismissToast,
      })}
    />
  );
}
