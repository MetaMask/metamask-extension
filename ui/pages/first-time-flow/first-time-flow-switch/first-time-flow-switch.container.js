import { connect } from 'react-redux';
import FirstTimeFlowSwitch from './first-time-flow-switch.component';

const mapStateToProps = ({ metamask }) => {
  const {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    seedPhraseBackedUp,
  } = metamask;

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    seedPhraseBackedUp,
  };
};

export default connect(mapStateToProps)(FirstTimeFlowSwitch);
