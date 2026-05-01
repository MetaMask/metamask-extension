import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { getSelectedInternalAccount } from '../../../../selectors';
import { PERPS_WITHDRAW_ROUTE } from '../../../../helpers/constants/routes';

export type PerpsWithdrawNavigationResponse = {
  route: string;
};

export type PerpsWithdrawNavigationOptions = {
  navigateOnTrigger?: boolean;
  onNavigated?: (route: string) => void;
};

export type PerpsWithdrawNavigationResult = {
  trigger: () => Promise<PerpsWithdrawNavigationResponse | null>;
  isLoading: boolean;
};

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
    } catch (error) {
      console.error('Failed to open perps withdraw flow', error);
      return null;
    } finally {
      isInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [
    isLoading,
    navigate,
    navigateOnTrigger,
    onNavigated,
    selectedAccount?.address,
  ]);

  return {
    trigger,
    isLoading,
  };
}
