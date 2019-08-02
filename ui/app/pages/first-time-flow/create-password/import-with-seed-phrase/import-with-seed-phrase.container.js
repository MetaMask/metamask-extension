import { connect } from 'react-redux'
import ImportWithSeedPhrase from './import-with-seed-phrase.component'
import {
  setSeedPhraseBackedUp,
} from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) => dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
  }
}

export default connect(null, mapDispatchToProps)(ImportWithSeedPhrase)
