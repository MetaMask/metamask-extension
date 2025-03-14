import { compose } from 'redux';
import { connect } from 'react-redux';
import { lockMetamask } from '../../store/actions';
import withOptimisedRouter from '../../helpers/higher-order-components/withOptimisedRouter';
import Lock from './lock.component';

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
  withOptimisedRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Lock);
