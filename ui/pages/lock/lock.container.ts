import { compose } from 'redux';
import { connect } from 'react-redux';
import { lockMetamask } from '../../store/actions';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
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

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(Lock);
