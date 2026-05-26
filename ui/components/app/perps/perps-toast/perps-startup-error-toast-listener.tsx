import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  isPerpsConfirmationStartupFlow,
  PERPS_CONFIRMATION_STARTUP_FLOW,
  PERPS_STARTUP_ERROR_ROUTE_STATE_KEY,
  type PerpsConfirmationStartupFlow,
} from '../../../../pages/confirmations/constants/perps';
import { usePerpsWithdrawNavigation } from '../hooks/usePerpsWithdrawNavigation';
import { usePerpsToast } from './perps-toast-provider';

type ParsedPerpsStartupErrorRouteState = {
  remainingState: Record<string, unknown> | undefined;
  startupError: PerpsConfirmationStartupFlow;
};

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

export function PerpsStartupErrorToastListener() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { replacePerpsToast } = usePerpsToast();
  const { trigger: triggerPerpsWithdrawNavigation } =
    usePerpsWithdrawNavigation();

  useEffect(() => {
    const parsedRouteState = parsePerpsStartupErrorRouteState(location.state);

    if (!parsedRouteState) {
      return;
    }

    if (
      parsedRouteState.startupError ===
      PERPS_CONFIRMATION_STARTUP_FLOW.DEPOSIT
    ) {
      replacePerpsToast({
        message: t('perpsDepositToastErrorTitle'),
        description: t('perpsDepositToastErrorDescription'),
        variant: 'error',
      });
    }

    if (
      parsedRouteState.startupError ===
      PERPS_CONFIRMATION_STARTUP_FLOW.WITHDRAW
    ) {
      replacePerpsToast({
        message: t('perpsWithdrawStartErrorTitle'),
        description: t('perpsWithdrawStartErrorDescription'),
        actionText: t('tryAgain'),
        onActionClick: () => {
          triggerPerpsWithdrawNavigation().catch(() => undefined);
        },
        variant: 'error',
      });
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: parsedRouteState.remainingState,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    replacePerpsToast,
    t,
    triggerPerpsWithdrawNavigation,
  ]);

  return null;
}
