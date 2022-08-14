import { connect } from 'react-redux';

import { getOnboardingInitiator } from '../../../selectors';
import { setCompletedOnboarding } from '../../../store/actions';
import { EVENT_NAMES } from '../../../../shared/constants/metametrics';
import EndOfFlow from './end-of-flow.component';

const firstTimeFlowTypeNameMap = {
  create: EVENT_NAMES.NEW_WALLET_CREATED,
  import: EVENT_NAMES.NEW_WALLET_IMPORTED,
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
