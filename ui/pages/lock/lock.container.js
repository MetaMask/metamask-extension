import { compose } from 'redux';
import { connect } from 'react-redux';
import { lockMetamask } from '../../store/actions';
import Lock from './lock.component';
import withRouterHooks from "../../helpers/higher-order-components/with-router-hooks/with-router-hooks";

const mapStateToProps = (state) => {
  const {
    metamask: { isUnlocked },
  } = state;

  return {
    isUnlocked,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    lockMetamask: () => dispatch(lockMetamask()),
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(Lock);
