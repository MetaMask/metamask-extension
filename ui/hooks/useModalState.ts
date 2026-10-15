import { useCallback } from 'react';
import { closeNetworkMenu, hideModal } from '../store/actions';
import { useDispatch } from '../store/hooks';

export function useModalState() {
  const dispatch = useDispatch();

  const closeModals = useCallback(() => {
    dispatch(closeNetworkMenu());
    dispatch(hideModal()); // Close any open legacy modals
  }, [dispatch]);

  return {
    closeModals,
  };
}
