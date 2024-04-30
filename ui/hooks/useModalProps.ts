import { useSelector, useDispatch } from 'react-redux';
import { hideModal } from '../store/actions';

type ModalProps = {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  hideModal: () => void;
};

export function useModalProps(): ModalProps {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modalProps = useSelector((state: any) => {
    return state.appState.modal.modalState?.props;
  });

  const dispatch = useDispatch();
  const onHideModal = () => dispatch(hideModal());

  return { props: modalProps, hideModal: onHideModal };
}
