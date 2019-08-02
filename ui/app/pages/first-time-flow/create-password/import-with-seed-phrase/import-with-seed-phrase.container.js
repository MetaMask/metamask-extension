import { connect } from 'react-redux'
import ImportWithSeedPhrase from './import-with-seed-phrase.component'
import {
  setSeedPhraseBackedUp,
  show3BoxModalAfterImport,
} from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) => dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    show3BoxModalAfterImport: () => dispatch(show3BoxModalAfterImport())
  }
}

export default connect(null, mapDispatchToProps)(ImportWithSeedPhrase)
