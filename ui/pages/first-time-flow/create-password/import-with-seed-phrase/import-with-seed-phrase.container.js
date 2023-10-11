import { connect } from 'react-redux';
import { setSeedPhraseBackedUp } from '../../../../store/actions';
import ImportWithSeedPhrase from './import-with-seed-phrase.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) =>
      dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
  };
};

export default connect(null, mapDispatchToProps)(ImportWithSeedPhrase);
