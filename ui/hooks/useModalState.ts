import { useCallback } from 'react';
import { closeNetworkMenu, hideModal } from '../store/actions';
import { useAppDispatch } from '../store/hooks';

export function useModalState() {
  const dispatch = useAppDispatch();

  const closeModals = useCallback(() => {
    dispatch(closeNetworkMenu());
    dispatch(hideModal()); // Close any open legacy modals
  }, [dispatch]);

  return {
    closeModals,
  };
}
