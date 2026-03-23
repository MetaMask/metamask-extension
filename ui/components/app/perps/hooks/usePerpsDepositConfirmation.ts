import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { ConfirmationLoader } from '../../../../pages/confirmations/hooks/useConfirmationNavigation';
import { getSelectedInternalAccount } from '../../../../selectors';

export type PerpsDepositConfirmationResponse = {
  transactionId: string;
};

export type PerpsDepositConfirmationOptions = {
  onCreated?: (transactionId: string) => void;
  navigateOnCreate?: boolean;
};

export type PerpsDepositConfirmationResult = {
  trigger: () => Promise<PerpsDepositConfirmationResponse | null>;
  isLoading: boolean;
  error: string | null;
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
  const { onCreated, navigateOnCreate = true } = options;
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against accidental double-trigger in the same tick
  const isInFlightRef = useRef(false);

  const trigger = useCallback(async () => {
    if (isInFlightRef.current || isLoading) {
      return null;
    }

    setError(null);

    if (!selectedAccount?.address) {
      const message = 'No selected account';
      console.error(message);
      setError(message);
      return null;
    }

    isInFlightRef.current = true;
    setIsLoading(true);

    try {
      const { transactionId } = await createPerpsDepositTransaction({});

      if (navigateOnCreate) {
        const search = new URLSearchParams({
          loader: ConfirmationLoader.CustomAmount,
        }).toString();

        navigate({
          pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
          search,
        });
      }

      onCreated?.(transactionId);

      return { transactionId };
    } catch (caughtError) {
      const message = 'Failed to create perps deposit transaction';
      console.error(message, caughtError);
      setError(message);
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
    selectedAccount?.address,
  ]);

  return {
    trigger,
    isLoading,
    error,
  };
}
