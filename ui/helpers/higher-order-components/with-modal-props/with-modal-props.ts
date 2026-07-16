import { connect } from 'react-redux';
import type { ComponentType } from 'react';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../store/store';
import { hideModal } from '../../../store/actions';

const mapStateToProps = (state: MetaMaskReduxState) => {
  const { appState } = state;
  const { props: modalProps } = appState.modal.modalState;

  return {
    ...modalProps,
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
  };
};

export default function withModalProps(Component: ComponentType) {
  return connect(mapStateToProps, mapDispatchToProps)(Component);
}
