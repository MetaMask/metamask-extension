import { compose } from 'redux';
import { connect } from 'react-redux';
import { lockMetamask } from '../../store/actions';
import withRouterHooks, {
  RouterHooksProps,
} from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import { MetaMaskReduxDispatch, MetaMaskReduxState } from '../../store/store';
import Lock from './lock.component';

const mapStateToProps = (state: MetaMaskReduxState) => {
  const {
    metamask: { isUnlocked },
  } = state;

  return {
    isUnlocked,
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    lockMetamask: () => dispatch(lockMetamask()),
  };
};

const mergeProps = (
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: ReturnType<typeof mapDispatchToProps>,
  ownProps: RouterHooksProps,
) => {
  // Strip unused router props (location, params) — Lock only needs navigate to
  // redirect after locking. Excluding them prevents unnecessary re-renders when
  // the URL location or route params change.
  const { navigate } = ownProps;
  return {
    ...stateProps,
    ...dispatchProps,
    navigate,
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(Lock);
