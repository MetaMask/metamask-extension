import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { getExtensionSkipTransactionStatusPage } from '../../../../shared/lib/selectors/smart-transactions';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  isPerpsConfirmationStartupFlow,
  PERPS_CONFIRMATION_STARTUP_FLOW,
  PERPS_STARTUP_ERROR_ROUTE_STATE_KEY,
  type PerpsConfirmationStartupFlow,
} from '../../../pages/confirmations/constants/perps';
import { PerpsDepositToast } from '../perps/perps-deposit-toast';
import { usePerpsWithdrawNavigation } from '../perps/hooks/usePerpsWithdrawNavigation';
import { toast, ToastContent } from '../../ui/toast/toast';
import { useSmartTransactionToasts } from './useSmartTransactionToasts';
import { usePerpsWithdrawTransactionToasts } from './usePerpsWithdrawTransactionToasts';

type ParsedPerpsStartupErrorRouteState = {
  remainingState: Record<string, unknown> | undefined;
  startupError: PerpsConfirmationStartupFlow;
};

const PERPS_STARTUP_ERROR_TOAST_ID = 'perps-startup-error';

const parsePerpsStartupErrorRouteState = (
  routeState: unknown,
): ParsedPerpsStartupErrorRouteState | null => {
  if (
    !routeState ||
    typeof routeState !== 'object' ||
    Array.isArray(routeState)
  ) {
    return null;
  }

  const routeStateRecord = routeState as Record<string, unknown>;
  const startupError =
    routeStateRecord[PERPS_STARTUP_ERROR_ROUTE_STATE_KEY];

  if (!isPerpsConfirmationStartupFlow(startupError)) {
    return null;
  }

  const remainingState = { ...routeStateRecord };
  delete remainingState[PERPS_STARTUP_ERROR_ROUTE_STATE_KEY];

  return {
    startupError,
    remainingState:
      Object.keys(remainingState).length > 0 ? remainingState : undefined,
  };
};

const SmartTransactionToastListener = () => {
  useSmartTransactionToasts();

  return null;
};

const PerpsWithdrawTransactionToastListener = () => {
  usePerpsWithdrawTransactionToasts();

  return null;
};

const PerpsStartupErrorToastListener = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trigger: triggerPerpsWithdrawNavigation } =
    usePerpsWithdrawNavigation();

  useEffect(() => {
    const parsedRouteState = parsePerpsStartupErrorRouteState(location.state);

    if (!parsedRouteState) {
      return;
    }

    const isWithdraw =
      parsedRouteState.startupError ===
      PERPS_CONFIRMATION_STARTUP_FLOW.WITHDRAW;

    toast.error(
      <ToastContent
        title={
          isWithdraw
            ? t('perpsWithdrawStartErrorTitle')
            : t('perpsDepositToastErrorTitle')
        }
        description={
          isWithdraw
            ? t('perpsWithdrawStartErrorDescription')
            : t('perpsDepositToastErrorDescription')
        }
        actionText={isWithdraw ? t('tryAgain') : undefined}
        onActionClick={
          isWithdraw
            ? () => triggerPerpsWithdrawNavigation().catch(() => undefined)
            : undefined
        }
      />,
      { id: PERPS_STARTUP_ERROR_TOAST_ID },
    );

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: parsedRouteState.remainingState,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    t,
    triggerPerpsWithdrawNavigation,
  ]);

  return null;
};

export function ToastListener() {
  const transactionToastEnabled = useSelector(
    getExtensionSkipTransactionStatusPage,
  );
  const isUnlocked = useSelector(getIsUnlocked);
  const isInteractive = isInteractiveUI();

  if (!isInteractive) {
    return null;
  }

  return (
    <>
      {isUnlocked ? <PerpsDepositToast /> : null}
      <PerpsStartupErrorToastListener />
      <PerpsWithdrawTransactionToastListener />

      {transactionToastEnabled ? <SmartTransactionToastListener /> : null}
    </>
  );
}
