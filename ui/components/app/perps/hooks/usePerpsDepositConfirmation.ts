import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { usePerpsEventTracking } from '../../../../hooks/perps/usePerpsEventTracking';
import {
  ConfirmationLoader,
  PayWithOption,
} from '../../../../pages/confirmations/hooks/useConfirmationNavigation';
import { setLastPerpsDepositEntryPoint } from '../../../../store/actions';
import { isUnfundedDepositFunnelActive } from '../utils/unfunded-deposit-funnel';
import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';
import { usePerpsNetworkManagement } from './usePerpsNetworkManagement';

export type PerpsDepositConfirmationResponse = {
  transactionId: string;
};

export type PerpsDepositConfirmationOptions = {
  onCreated?: (transactionId: string) => void;
  navigateOnCreate?: boolean;
  payWithOption?: PayWithOption;
  entryPoint?: string;
};

export type PerpsDepositConfirmationResult = {
  trigger: () => Promise<PerpsDepositConfirmationResponse | null>;
  isLoading: boolean;
};

/**
 * Pay/Confirmations-owned entrypoint for starting the Perps deposit confirmation flow.
 *
 * Encapsulates:
 * - transaction construction (perpsDeposit tx)
 * - optional routing into confirmations with the custom amount loader
 *
 * @param options
 */
export function usePerpsDepositConfirmation(
  options: PerpsDepositConfirmationOptions = {},
): PerpsDepositConfirmationResult {
  const {
    onCreated,
    navigateOnCreate = true,
    payWithOption,
    entryPoint,
  } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const selectedAddress = useSelector(getSelectedInternalAccount)?.address;
  const { ensureArbitrumNetworkExists } = usePerpsNetworkManagement();
  const { track } = usePerpsEventTracking();
  const [isLoading, setIsLoading] = useState(false);

  // Guard against accidental double-trigger in the same tick
  const isInFlightRef = useRef(false);

  const trigger = useCallback(async () => {
    if (isInFlightRef.current || isLoading) {
      return null;
    }

    if (!selectedAddress) {
      console.error('No selected account');
      return null;
    }

    isInFlightRef.current = true;
    setIsLoading(true);

    try {
      // Hyperliquid deposits settle USDC on Arbitrum; the controller resolves
      // the deposit tx against that network client and throws if it is missing.
      // Add it first (no-op when already present) so the deposit can start.
      await ensureArbitrumNetworkExists();

      // Set or clear the entry point (currently required for
      // hyperliquid-prompted deposits to show a custom toast message).
      setLastPerpsDepositEntryPoint(entryPoint ?? null);

      const { transactionId } = await createPerpsDepositTransaction({});

      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.DEPOSIT_FLOW_OPENED,
        // Always emit the property so a funded deposit is distinguishable from
        // an older client that did not report it at all.
        [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]:
          !isUnfundedDepositFunnelActive(selectedAddress),
      });

      if (navigateOnCreate) {
        const params = new URLSearchParams({
          loader: ConfirmationLoader.CustomAmount,
        });

        if (payWithOption) {
          params.set('payWithOption', payWithOption);
        }

        const goBackTo = location.pathname + location.search;
        if (goBackTo && goBackTo !== '/') {
          params.set('goBackTo', goBackTo);
        }

        navigate(
          {
            pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
            search: params.toString(),
          },
          { replace: true },
        );
      }

      onCreated?.(transactionId);

      return { transactionId };
    } catch (error) {
      console.error('Failed to create perps deposit transaction', error);
      return null;
    } finally {
      isInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [
    ensureArbitrumNetworkExists,
    entryPoint,
    isLoading,
    location.pathname,
    track,
    location.search,
    navigate,
    navigateOnCreate,
    onCreated,
    payWithOption,
    selectedAddress,
  ]);

  return {
    trigger,
    isLoading,
  };
}
