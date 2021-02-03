import { connect } from 'react-redux';
import {
  setSeedPhraseBackedUp,
  initializeThreeBox,
} from '../../../../store/actions';
import ConfirmSeedPhrase from './confirm-seed-phrase.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) =>
      dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    initializeThreeBox: () => dispatch(initializeThreeBox()),
  };
};

export default connect(null, mapDispatchToProps)(ConfirmSeedPhrase);
