import React, { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setEditedNetwork } from '../../store/actions';
import { NetworkListMenu } from '../../components/multichain/network-list-menu';
import { useModalState } from '../../hooks/useModalState';

export const Modals = () => {
  const dispatch = useAppDispatch();
  const { closeModals } = useModalState();
  const isNetworkMenuOpen = useAppSelector(
    ({ appState }) => appState.isNetworkMenuOpen,
  );

  const handleClose = useCallback(() => {
    closeModals();
    dispatch(setEditedNetwork());
  }, [closeModals, dispatch]);

  const modal = isNetworkMenuOpen ? 'network' : undefined;

  return (
    <>{modal === 'network' && <NetworkListMenu onClose={handleClose} />}</>
  );
};
