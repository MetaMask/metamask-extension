import { compose } from 'redux';
import { connect } from 'react-redux';
import withRouterHooks from '../with-router-hooks/with-router-hooks';
import Authenticated from './authenticated.component';

const mapStateToProps = (state) => {
  const {
    metamask: { isUnlocked, completedOnboarding },
  } = state;

  return {
    isUnlocked,
    completedOnboarding,
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps),
)(Authenticated);
