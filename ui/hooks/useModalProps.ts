import { useSelector, useDispatch } from 'react-redux';
import { hideModal } from '../store/actions';

interface ModalProps {
  props: Record<string, any>;
  hideModal: () => void;
}

export function useModalProps(): ModalProps {
  const modalProps = useSelector((state: any) => {
    return state.appState.modal.modalState?.props;
  });

  const dispatch = useDispatch();
  const onHideModal = () => dispatch(hideModal());

  return { props: modalProps, hideModal: onHideModal };
}
