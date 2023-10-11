import { connect } from 'react-redux';
import { setSeedPhraseBackedUp } from '../../../../store/actions';
import ConfirmSeedPhrase from './confirm-seed-phrase.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) =>
      dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
  };
};

export default connect(null, mapDispatchToProps)(ConfirmSeedPhrase);
