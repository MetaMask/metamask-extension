import { useEffect, useState } from 'react';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';

/**
 * Hook for handling redirect to transaction confirmation after revoking gator permissions.
 *
 * @param params - The parameters for the redirect hook
 * @param params.onRedirect - Optional callback to call when redirect is pending
 * @returns Object containing transaction ID setter and redirect check state
 */
export function useGatorPermissionRedirect({
  onRedirect,
}: {
  onRedirect?: () => void;
} = {}) {
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return {
    transactionId,
    setTransactionId,
    isRedirectPending,
  };
}
