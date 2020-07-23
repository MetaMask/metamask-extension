import { connect } from 'react-redux'
import ConfirmSeedPhrase from './confirm-seed-phrase.component'
import {
  setSeedPhraseBackedUp,
  initializeThreeBox,
} from '../../../../store/actions'

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) => dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    initializeThreeBox: () => dispatch(initializeThreeBox()),
  }
}

export default connect(null, mapDispatchToProps)(ConfirmSeedPhrase)
