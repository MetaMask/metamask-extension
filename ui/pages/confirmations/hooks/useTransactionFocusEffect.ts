import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { setTransactionActive } from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useWindowFocus } from '../../../hooks/useWindowFocus';

const shouldSetFocusedForType = (type: TransactionType) => {
  return (
    type === TransactionType.contractInteraction ||
    type === TransactionType.deployContract ||
    type === TransactionType.simpleSend ||
    type === TransactionType.smart ||
    type === TransactionType.tokenMethodTransfer ||
    type === TransactionType.tokenMethodTransferFrom ||
    type === TransactionType.tokenMethodSafeTransferFrom
  );
};

export const useTransactionFocusEffect = () => {
  const {
    currentConfirmation: { id, type },
  } = useConfirmContext();
  const isWindowFocused = useWindowFocus();
  const dispatch = useDispatch();
  const [focusedConfirmation, setFocusedConfirmation] = useState<string | null>(
    null,
  );

  const setTransactionFocus = useCallback(
    async (transactionId: string, isFocused: boolean) => {
      await dispatch(setTransactionActive(transactionId, isFocused));
    },
    [dispatch],
  );

  useEffect(() => {
    const shouldBeMarked = shouldSetFocusedForType(type as TransactionType);

    if (!shouldBeMarked) {
      // If the transaction type is not one of the types that should be focused,
      // we need to unfocus the previous focused confirmation and reset the focused confirmation
      if (focusedConfirmation) {
        setTransactionFocus(focusedConfirmation, false);
        setFocusedConfirmation(null);
      }
      return;
    }

    if (isWindowFocused && focusedConfirmation !== id) {
      // If the window is focused and the focused confirmation is not the current one,
      // we need to unfocus the previous focused confirmation and focus the current one
      if (focusedConfirmation) {
        setTransactionFocus(focusedConfirmation, false);
      }
      // Set the focused confirmation to the current one
      setFocusedConfirmation(id);
      setTransactionFocus(id, true);
    } else if (!isWindowFocused && focusedConfirmation) {
      // If the window is not focused and there is a focused confirmation,
      // we need to unfocus the focused confirmation
      setTransactionFocus(focusedConfirmation, false);
      setFocusedConfirmation(null);
    }
  }, [isWindowFocused, id, focusedConfirmation, setTransactionFocus, type]);
};
