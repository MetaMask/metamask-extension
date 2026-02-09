import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { closeNetworkMenu, hideModal } from '../store/actions';
import { useAppSelector } from '../store/store';

export function useModalState() {
  const dispatch = useDispatch();
  const legacyModalName = useAppSelector(
    ({ appState }) => appState.modal.modalState?.name,
  );

  const closeModals = useCallback(() => {
    dispatch(closeNetworkMenu());
    // Close legacy modal if NETWORK_MANAGER is open
    if (legacyModalName === 'NETWORK_MANAGER') {
      dispatch(hideModal());
    }
  }, [dispatch, legacyModalName]);

  return {
    closeModals,
  };
}
