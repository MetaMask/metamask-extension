import { useCallback, useState } from 'react';

/**
 * Determine whether a transaction can be approved and provide a method to
 * kick off the approval process.
 *
 * Provides a reusable hook that, given a transactionGroup, will manage
 * the process of editing gas for approvals
 *
 * @returns {[boolean, Function]}
 */
export function useApproveTransaction() {
  const [showCustomizeGasPopover, setShowCustomizeGasPopover] = useState(false);

  const closeCustomizeGasPopover = () => setShowCustomizeGasPopover(false);

  const approveTransaction = useCallback(() => {
    return setShowCustomizeGasPopover(true);
  }, []);

  return {
    approveTransaction,
    showCustomizeGasPopover,
    closeCustomizeGasPopover,
  };
}
