import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';

import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { setTransactionActive } from '../../../store/actions';
import { useWindowFocus } from '../../../hooks/useWindowFocus';
import { useConfirmContext } from '../context/confirm';

const FOCUSABLE_TYPES: Set<TransactionType> = new Set([
  TransactionType.batch,
  TransactionType.contractInteraction,
  TransactionType.deployContract,
  TransactionType.simpleSend,
  TransactionType.smart,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
]);

export const useTransactionFocusEffect = () => {
  const { currentConfirmation } = useConfirmContext();
  const { id, type } = currentConfirmation ?? {};
  const isWindowFocused = useWindowFocus();
  const dispatch = useDispatch();
  const [focusedConfirmationId, setFocusedConfirmationId] = useState<
    string | null
  >(null);
  const isSidepanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  const setTransactionFocus = useCallback(
    async (transactionId: string, isFocused: boolean) => {
      await dispatch(setTransactionActive(transactionId, isFocused));
    },
    [dispatch],
  );

  useEffect(() => {
    const isFocusable = FOCUSABLE_TYPES.has(type as TransactionType);

    if (!isFocusable) {
      // If the transaction type is not one of the types that should be focused,
      // we need to unfocus the previous focused confirmation and reset the focused confirmation
      if (focusedConfirmationId) {
        setTransactionFocus(focusedConfirmationId, false);
        setFocusedConfirmationId(null);
      }
      return;
    }

    // Sidepanel is always considered focused since it's always visible alongside the dapp
    const isFocused = isWindowFocused || isSidepanel;

    if (isFocused && focusedConfirmationId !== id) {
      // If the window is focused (or sidepanel) and the focused confirmation is not the current one,
      // we need to unfocus the previous focused confirmation and focus the current one
      if (focusedConfirmationId) {
        setTransactionFocus(focusedConfirmationId, false);
      }
      // Set the focused confirmation to the current one
      setFocusedConfirmationId(id);
      setTransactionFocus(id, true);
    } else if (!isFocused && focusedConfirmationId) {
      // If the window is not focused (and not sidepanel) and there is a focused confirmation,
      // we need to unfocus the focused confirmation
      setTransactionFocus(focusedConfirmationId, false);
      setFocusedConfirmationId(null);
    }
  }, [
    focusedConfirmationId,
    id,
    isSidepanel,
    isWindowFocused,
    setTransactionFocus,
    type,
  ]);
};
