import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toggleNetworkMenu } from '../store/actions';
import { useAppSelector } from '../store/store';

export function useModalState() {
  const dispatch = useDispatch();
  const isNetworkMenuOpen = useAppSelector(
    ({ appState }) => appState.isNetworkMenuOpen,
  );

  const closeModals = useCallback(() => {
    if (isNetworkMenuOpen) {
      dispatch(toggleNetworkMenu());
    }
  }, [dispatch, isNetworkMenuOpen]);

  return {
    closeModals,
  };
}
