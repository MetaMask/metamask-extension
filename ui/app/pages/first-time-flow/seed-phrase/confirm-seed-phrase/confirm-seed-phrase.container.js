import { connect } from 'react-redux'
import ConfirmSeedPhrase from './confirm-seed-phrase.component'
import {
  setSeedPhraseBackedUp,
  hideSeedPhraseBackupAfterOnboarding,
  initializeThreeBox,
} from '../../../../store/actions'

const mapStateToProps = state => {
  const { appState: { showingSeedPhraseBackupAfterOnboarding } } = state

  return {
    showingSeedPhraseBackupAfterOnboarding,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) => dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    hideSeedPhraseBackupAfterOnboarding: () => dispatch(hideSeedPhraseBackupAfterOnboarding()),
    initializeThreeBox: () => dispatch(initializeThreeBox()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmSeedPhrase)
