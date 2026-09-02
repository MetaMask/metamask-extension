import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../hooks/perps/usePerpsEventTracking';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
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
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  useEffect(() => {
    if (!hasDepositResult) {
      return;
    }

    const isSuccess = lastDepositResultSuccess === true;
    const title = isSuccess
      ? t('perpsDepositToastSuccessTitle')
      : t('perpsDepositToastErrorTitle');
    const description = isSuccess
      ? t('perpsDepositToastSuccessDescription')
      : lastDepositResultError || t('perpsDepositToastErrorDescription');
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
