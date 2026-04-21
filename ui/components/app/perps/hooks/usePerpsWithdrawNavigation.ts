import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { getSelectedInternalAccount } from '../../../../selectors';
import { PERPS_WITHDRAW_ROUTE } from '../../../../helpers/constants/routes';
import { getRemoteFeatureFlags } from '../../../../selectors/remote-feature-flags';
import { usePerpsWithdrawConfirmation } from './usePerpsWithdrawConfirmation';

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
 * Sibling to {@link usePerpsDepositConfirmation}: same `trigger` / `isLoading` shape.
 * Deposit confirmation is backed by `depositWithConfirmation`, which builds an EVM
 * transaction and submits it through `TransactionController` (`perpsDeposit`).
 * Withdraw is API-only (`perpsWithdraw`) with no staged `TransactionMeta`, so it
 * cannot reuse that confirmations path without new controller support. Completion
 * feedback on the wallet home uses `PerpsWithdrawToast` and `lastWithdrawResult`.
 *
 * @param options
 */
export function usePerpsWithdrawNavigation(
  options: PerpsWithdrawNavigationOptions = {},
): PerpsWithdrawNavigationResult {
  const { navigateOnTrigger = true, onNavigated } = options;
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const [isLoading, setIsLoading] = useState(false);

  const isInFlightRef = useRef(false);

  const { trigger: triggerWithdrawConfirmation } = usePerpsWithdrawConfirmation(
    { navigateOnCreate: navigateOnTrigger },
  );

  // Remote feature flag that gates the new Perps Withdraw confirmation flow
  // (mm-pay + custom amount + HyperLiquid -> Relay). When disabled, the legacy
  // standalone `/perps/withdraw` page is used as before.
  const useConfirmationFlow = Boolean(
    remoteFeatureFlags?.perpsWithdrawConfirmation,
  );

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
      if (useConfirmationFlow) {
        const result = await triggerWithdrawConfirmation();
        if (!result) {
          return null;
        }
        onNavigated?.(`${PERPS_WITHDRAW_ROUTE}#confirmation`);
        return { route: `${PERPS_WITHDRAW_ROUTE}#confirmation` };
      }

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
    triggerWithdrawConfirmation,
    useConfirmationFlow,
  ]);

  return {
    trigger,
    isLoading,
  };
}
