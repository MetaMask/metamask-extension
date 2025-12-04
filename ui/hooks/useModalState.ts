import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { closeNetworkMenu } from '../store/actions';

export function useModalState() {
  const dispatch = useDispatch();

  const closeModals = useCallback(
    () => dispatch(closeNetworkMenu()),
    [dispatch],
  );

  return {
    closeModals,
  };
}
