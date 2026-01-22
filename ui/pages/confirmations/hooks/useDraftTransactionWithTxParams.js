/**
 * Returns an empty object for backwards compatibility.
 * This hook was previously used with the old send flow's draft transaction state.
 * Now that the old send flow has been removed, this returns an empty object.
 * We can delete this hook once we have refactored the cancel / send gas components.
 *
 * @returns {object} Empty transaction data object
 * @deprecated This hook is deprecated and will be removed in a future version.
 */
export const useDraftTransactionWithTxParams = () => {
  return {};
};
