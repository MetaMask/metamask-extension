import { connect } from 'react-redux';
import { compose } from 'redux';
import withOptimisedRoute from '../withOptimisedRoute';
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
  withOptimisedRoute,
  connect(mapStateToProps),
)(Authenticated);
