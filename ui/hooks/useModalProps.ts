import { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { MetaMaskReduxState } from '../store/store';
import { hideModal } from '../store/actions';

type ModalProps = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  hideModal: () => void;
};

export function useModalProps(): ModalProps {
  const modalProps = useSelector((state: MetaMaskReduxState) => {
    return state.appState.modal.modalState?.props;
  });

  const dispatch = useDispatch();
  const onHideModal = useCallback(() => dispatch(hideModal()), [dispatch]);

  return useMemo(
    () => ({ props: modalProps, hideModal: onHideModal }),
    [modalProps, onHideModal],
  );
}
