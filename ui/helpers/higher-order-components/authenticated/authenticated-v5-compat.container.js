import { connect } from 'react-redux';
import AuthenticatedV5Compat from './authenticated-v5-compat.component';

const mapStateToProps = (state) => {
  const {
    metamask: { isUnlocked, completedOnboarding },
  } = state;

  return {
    isUnlocked,
    completedOnboarding,
  };
};

export default connect(mapStateToProps)(AuthenticatedV5Compat);

