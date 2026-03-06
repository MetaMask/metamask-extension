import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { getSelectedInternalAccount } from '../../../../selectors';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../useConfirmationNavigation';
import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';

export type PerpsDepositConfirmationResponse = {
  transactionId: string;
};

export type PerpsDepositConfirmationOptions = {
  returnTo?: string;
  onCreated?: (transactionId: string) => void;
  navigateOnCreate?: boolean;
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
 * - optional return routing after confirmation completes/cancels via router state
 *
 * @param options
 */
export function usePerpsDepositConfirmation(
  options: PerpsDepositConfirmationOptions = {},
): PerpsDepositConfirmationResult {
  const { returnTo, onCreated, navigateOnCreate = true } = options;
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  // Guard against accidental double-trigger in the same tick
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
      const { transactionId } = await createPerpsDepositTransaction({
        fromAddress: selectedAccount.address,
      });

      if (navigateOnCreate) {
        const search = new URLSearchParams({
          loader: ConfirmationLoader.CustomAmount,
        }).toString();

        navigate(
          {
            pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
            search,
          },
          {
            state: returnTo ? { returnTo } : undefined,
          },
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
    isLoading,
    navigate,
    navigateOnCreate,
    onCreated,
    returnTo,
    selectedAccount?.address,
  ]);

  return {
    trigger,
    isLoading,
  };
}
