import { connect } from 'react-redux'
import ConfirmSeedPhrase from './confirm-seed-phrase.component'
import {
  setSeedPhraseBackedUp,
  hideSeedPhraseBackupAfterOnboarding,
  initializeThreeBox,
} from '../../../../store/actions'
import { getSelectedAddress } from '../../../../selectors/selectors'

const mapStateToProps = state => {
  const { appState: { showingSeedPhraseBackupAfterOnboarding } } = state

  return {
    showingSeedPhraseBackupAfterOnboarding,
    selectedAddress: getSelectedAddress(state),
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
