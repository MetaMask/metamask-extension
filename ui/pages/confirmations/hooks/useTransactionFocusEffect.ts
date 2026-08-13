import { useCallback, useEffect, useRef } from 'react';
import { TransactionType } from '@metamask/transaction-controller';

import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { setTransactionActive } from '../../../store/actions';
import { useWindowFocus } from '../../../hooks/useWindowFocus';
import { useConfirmContext } from '../context/confirm';
import { useDispatch } from '../../../store/hooks';

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
  const focusedConfirmationIdRef = useRef<string | null>(null);
  const isSidepanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  const setTransactionFocus = useCallback(
    async (transactionId: string, isFocused: boolean) => {
      await dispatch(setTransactionActive(transactionId, isFocused));
    },
    [dispatch],
  );

  useEffect(() => {
    const isFocusable = FOCUSABLE_TYPES.has(type as TransactionType);
    const focusedConfirmationId = focusedConfirmationIdRef.current;

    if (!isFocusable) {
      // If the transaction type is not one of the types that should be focused,
      // we need to unfocus the previous focused confirmation and reset the focused confirmation
      if (focusedConfirmationId) {
        setTransactionFocus(focusedConfirmationId, false);
        focusedConfirmationIdRef.current = null;
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
      // Only activate when we have a real transaction id (currentConfirmation
      // can be null, which would otherwise pass undefined into setTransactionActive).
      if (id) {
        focusedConfirmationIdRef.current = id;
        setTransactionFocus(id, true);
      } else {
        focusedConfirmationIdRef.current = null;
      }
    } else if (!isFocused && focusedConfirmationId) {
      // If the window is not focused (and not sidepanel) and there is a focused confirmation,
      // we need to unfocus the focused confirmation
      setTransactionFocus(focusedConfirmationId, false);
      focusedConfirmationIdRef.current = null;
    }
  }, [id, isSidepanel, isWindowFocused, setTransactionFocus, type]);
};
