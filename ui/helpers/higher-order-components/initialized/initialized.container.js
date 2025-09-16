import { compose } from 'redux';
import { connect } from 'react-redux';
import withRouterHooks from '../with-router-hooks/with-router-hooks';
import Initialized from './initialized.component';

const mapStateToProps = (state) => {
  const {
    metamask: { completedOnboarding },
  } = state;

  return {
    completedOnboarding,
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps),
)(Initialized);
