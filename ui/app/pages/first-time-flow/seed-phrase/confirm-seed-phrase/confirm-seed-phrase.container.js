import { connect } from 'react-redux'
import {
  setSeedPhraseBackedUp,
  initializeThreeBox,
  setCompletedOnboarding,
} from '../../../../store/actions'
import ConfirmSeedPhrase from './confirm-seed-phrase.component'

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) =>
      dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    initializeThreeBox: () => dispatch(initializeThreeBox()),
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(null, mapDispatchToProps)(ConfirmSeedPhrase)
