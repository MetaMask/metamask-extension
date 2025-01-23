import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { updateTransactionFocus } from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';
import { useWindowFocus } from '../../../hooks/useWindowFocus';

const shouldSetFocused = (type: TransactionType) => {
  return (
    type === TransactionType.simpleSend ||
    type === TransactionType.contractInteraction ||
    type === TransactionType.tokenMethodTransfer ||
    type === TransactionType.deployContract
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
      await dispatch(updateTransactionFocus(transactionId, isFocused));
    },
    [dispatch],
  );

  useEffect(() => {
    const mustBeMarked = shouldSetFocused(type as TransactionType);
    const isAlreadyFocused = focusedConfirmation === id;

    if (!mustBeMarked) {
      if (focusedConfirmation) {
        // Previous focused transaction is no longer focused
        setTransactionFocus(focusedConfirmation, false);
        // No focused transaction
        setFocusedConfirmation(null);
      }
      return;
    }

    if (isWindowFocused) {
      if (!isAlreadyFocused) {
        if (focusedConfirmation) {
          // Previous focused transaction is no longer focused
          setTransactionFocus(focusedConfirmation, false);
        }
        // New transaction is focused
        setFocusedConfirmation(id);
        setTransactionFocus(id, true);
      }
    }

    if (!isWindowFocused) {
      if (focusedConfirmation) {
        // Previous focused transaction is no longer focused
        setTransactionFocus(focusedConfirmation, false);
      }
      // No focused transaction
      setFocusedConfirmation(null);
    }
  }, [isWindowFocused, id]);
};
