import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { getSelectedInternalAccount } from '../../../../selectors';
import { PERPS_WITHDRAW_ROUTE } from '../../../../helpers/constants/routes';

export type PerpsWithdrawNavigationResponse = {
  /** Route opened (or that would be opened) for the withdraw flow */
  route: string;
};

export type PerpsWithdrawNavigationOptions = {
  /** When false, `trigger` still succeeds but does not call `navigate` */
  navigateOnTrigger?: boolean;
  onNavigated?: (route: string) => void;
};

export type PerpsWithdrawNavigationResult = {
  trigger: () => Promise<PerpsWithdrawNavigationResponse | null>;
  isLoading: boolean;
};

/**
 * Perps-owned entrypoint for opening the withdraw flow (dedicated route).
 *
 * Sibling to {@link usePerpsDepositConfirmation}: same `trigger` / `isLoading` shape,
 * but withdraw uses HyperLiquid `perpsWithdraw` on the withdraw page—not
 * `CONFIRM_TRANSACTION_ROUTE` / CustomAmount (deposits are transaction-prepared).
 *
 * @param options
 */
export function usePerpsWithdrawNavigation(
  options: PerpsWithdrawNavigationOptions = {},
): PerpsWithdrawNavigationResult {
  const { navigateOnTrigger = true, onNavigated } = options;
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const isInFlightRef = useRef(false);

  const trigger = useCallback(async () => {
    if (isInFlightRef.current || isLoading) {
      return null;
    }

    if (!selectedAccount?.address) {
      console.error('No selected account');
      return null;
    }

    isInFlightRef.current = true;
    setIsLoading(true);

    try {
      if (navigateOnTrigger) {
        navigate(PERPS_WITHDRAW_ROUTE);
      }

      onNavigated?.(PERPS_WITHDRAW_ROUTE);

      return { route: PERPS_WITHDRAW_ROUTE };
    } finally {
      isInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [isLoading, navigate, navigateOnTrigger, onNavigated, selectedAccount?.address]);

  return {
    trigger,
    isLoading,
  };
}
