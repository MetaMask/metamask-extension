import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import { HYPERLIQUID_DEPOSIT_PROMPT } from '../../../../shared/constants/hyperliquid-deposit-prompt';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../hooks/perps/usePerpsEventTracking';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositEntryPoint,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { toast, ToastContent } from '../../ui/toast/toast';
import {
  clearUnfundedDepositFunnel,
  confirmUnfundedDepositFunnel,
  isUnfundedDepositFunnelActive,
} from './utils/unfunded-deposit-funnel';

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const clearDepositResult = () => {
  submitRequestToBackground('perpsClearDepositResult', []).catch(
    () => undefined,
  );
  submitRequestToBackground('setLastPerpsDepositEntryPoint', [null]).catch(
    () => undefined,
  );
};

export function PerpsDepositToast() {
  const t = useI18nContext();
  const { track } = usePerpsEventTracking();
  const selectedAddress = useSelector(getSelectedInternalAccount)?.address;
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const entryPoint = useSelector(selectPerpsLastDepositEntryPoint);
  const depositTransactionId = useSelector(selectPerpsLastDepositTransactionId);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;

  // The emit lives in a presentation effect whose deps (entryPoint, t) can
  // change while the same deposit result is still on screen, and the component
  // remounts on unlock. Key the guard on the result identity so
  // deposit_confirmed is emitted once per deposit.
  const trackedDepositResultRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasDepositResult) {
      return;
    }

    const isSuccess = lastDepositResultSuccess === true;
    const isHyperliquidDeposit = entryPoint === HYPERLIQUID_DEPOSIT_PROMPT;
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

    // `lastDepositTransactionId` is the per-deposit identity; pairing it with
    // the outcome also covers a pending result that later resolves.
    const depositResultKey = `${depositTransactionId ?? ''}:${String(isSuccess)}`;
    const isNewDepositResult =
      trackedDepositResultRef.current !== depositResultKey;

    if (isSuccess) {
      toast.success(content, options);
      if (isNewDepositResult) {
        trackedDepositResultRef.current = depositResultKey;
        const isUnfundedFunnel = isUnfundedDepositFunnelActive(selectedAddress);
        confirmUnfundedDepositFunnel(selectedAddress);
        track(MetaMetricsEventName.PerpsUiInteraction, {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.DEPOSIT_CONFIRMED,
          [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: !isUnfundedFunnel,
        });
      }
    } else {
      toast.error(content, options);
      if (isNewDepositResult) {
        trackedDepositResultRef.current = depositResultKey;
        // A failed deposit must not let a later unrelated order report itself
        // as a post-deposit trade. Only this address's funnel is dropped.
        if (isUnfundedDepositFunnelActive(selectedAddress)) {
          clearUnfundedDepositFunnel();
        }
      }
    }

    const timeoutId = setTimeout(() => {
      clearDepositResult();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss(id);
    };
  }, [
    depositTransactionId,
    entryPoint,
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    selectedAddress,
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
