import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { closeNetworkMenu, hideModal } from '../store/actions';

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
