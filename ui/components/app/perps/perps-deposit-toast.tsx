import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import { HYPERLIQUID_DEPOSIT_PROMPT } from '../../../../shared/constants/hyperliquid-deposit-prompt';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../hooks/perps/usePerpsEventTracking';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositEntryPoint,
  selectPerpsLastDepositResult,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { toast, ToastContent } from '../../ui/toast/toast';
import { isUnfundedDepositFunnelActive } from './utils/unfunded-deposit-funnel';

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const clearDepositResult = () =>
  submitRequestToBackground('perpsClearDepositResult', []).catch(
    () => undefined,
  );

export function PerpsDepositToast() {
  const t = useI18nContext();
  const { track } = usePerpsEventTracking();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const entryPoint = useSelector(selectPerpsLastDepositEntryPoint);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  // Track the entry point when the toast was first shown for a deposit result
  const entryPointRef = useRef<{
    timestamp: number | undefined;
    entryPoint: string | undefined;
  }>({ timestamp: undefined, entryPoint: undefined });

  useEffect(() => {
    if (!hasDepositResult) {
      return;
    }

    // Capture the entry point when we first show the toast for a deposit result.
    // This is to show entry point-specific toast content that will persist
    // through subsequent renders (even if the event fragment is cleaned up).
    let capturedEntryPoint = entryPoint;
    if (entryPointRef.current.timestamp === lastDepositResultTimestamp) {
      capturedEntryPoint = entryPointRef.current.entryPoint;
    } else {
      entryPointRef.current = {
        timestamp: lastDepositResultTimestamp,
        entryPoint,
      };
    }

    const isSuccess = lastDepositResultSuccess === true;
    const isHyperliquidDeposit =
      capturedEntryPoint === HYPERLIQUID_DEPOSIT_PROMPT;
    let title = t('perpsDepositToastSuccessTitle');
    let description: string;

    if (isSuccess && isHyperliquidDeposit) {
      description = t('hyperliquidDepositToastSuccessDescription');
    } else if (isSuccess) {
      description = t('perpsDepositToastSuccessDescription');
    } else {
      title = t('perpsDepositToastErrorTitle');
      description =
        lastDepositResultError || t('perpsDepositToastErrorDescription');
    }
    const content = (
      <ToastContent title={title} description={description} dataTestId={id} />
    );
    const options = { id, duration };

    if (isSuccess) {
      toast.success(content, options);
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.DEPOSIT_CONFIRMED,
        ...(isUnfundedDepositFunnelActive()
          ? { [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: false }
          : {}),
      });
    } else {
      toast.error(content, options);
    }

    const timeoutId = setTimeout(() => {
      clearDepositResult();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss(id);
    };
  }, [
    entryPoint,
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    lastDepositResultTimestamp,
    t,
    track,
  ]);

  useEffect(() => {
    if (hasDepositResult) {
      return;
    }

    if (!shouldShowDepositToast) {
      toast.dismiss(id);
      return;
    }

    if (!depositInProgress) {
      toast.dismiss(id);
      return;
    }

    toast.loading(
      <ToastContent
        title={t('perpsDepositToastPendingTitle')}
        description={t('perpsDepositToastPendingDescription')}
        dataTestId={id}
      />,
      {
        id,
        duration: Infinity,
      },
    );

    return () => {
      toast.dismiss(id);
    };
  }, [depositInProgress, hasDepositResult, shouldShowDepositToast, t]);

  return null;
}
