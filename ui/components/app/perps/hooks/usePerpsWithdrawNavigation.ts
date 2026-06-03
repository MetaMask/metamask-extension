import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import type { RemoteFeatureFlagsState } from '../../../../../shared/lib/selectors/remote-feature-flags';
import {
  CONFIRM_TRANSACTION_ROUTE,
  PERPS_WITHDRAW_ROUTE,
} from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../../../../pages/confirmations/hooks/useConfirmationNavigation';
import { selectPayQuoteConfig } from '../../../../pages/confirmations/selectors/feature-flags';
import { createPerpsWithdrawTransaction } from './createPerpsWithdrawTransaction';

export type PerpsWithdrawNavigationResponse = {
  /** Route opened (or that would be opened) for the withdraw flow. */
  route: string;
  /** Created transaction ID when routed through the confirmation flow. */
  transactionId?: string;
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
 * Perps-owned entrypoint for opening the withdraw flow.
 *
 * When `confirmations_pay_post_quote.perpsWithdraw.enabled` is true, this
 * starts the custom amount confirmation flow. Otherwise it falls back to the
 * legacy standalone Perps withdraw route while the confirmation flow rolls out.
 *
 * @param options
 */
export function usePerpsWithdrawNavigation(
  options: PerpsWithdrawNavigationOptions = {},
): PerpsWithdrawNavigationResult {
  const { navigateOnTrigger = true, onNavigated } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const isConfirmationFlowEnabled = useSelector(
    (state: RemoteFeatureFlagsState) =>
      selectPayQuoteConfig(state, TransactionType.perpsWithdraw).enabled ===
      true,
  );
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
      if (isConfirmationFlowEnabled) {
        const { transactionId } = await createPerpsWithdrawTransaction({
          accountAddress: selectedAccount.address as Hex,
        });
        const route = `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`;

        if (navigateOnTrigger) {
          const params = new URLSearchParams({
            loader: ConfirmationLoader.CustomAmount,
          });

          const goBackTo = location.pathname + location.search;
          if (goBackTo && goBackTo !== '/') {
            params.set('goBackTo', goBackTo);
          }

          navigate({
            pathname: route,
            search: params.toString(),
          });
        }

        onNavigated?.(route);

        return { route, transactionId };
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
    isConfirmationFlowEnabled,
    isLoading,
    location.pathname,
    location.search,
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
