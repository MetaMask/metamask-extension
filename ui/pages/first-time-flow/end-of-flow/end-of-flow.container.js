import { connect } from 'react-redux';
import { getOnboardingInitiator } from '../../../selectors';
import { setCompletedOnboarding } from '../../../store/actions';
import EndOfFlow from './end-of-flow.component';

const firstTimeFlowTypeNameMap = {
  create: 'New Wallet Created',
  import: 'New Wallet Imported',
};

const mapStateToProps = (state) => {
  const {
    metamask: { firstTimeFlowType },
  } = state;

  return {
    completionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
    onboardingInitiator: getOnboardingInitiator(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCompletedOnboarding: () => dispatch(setCompletedOnboarding()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow);
