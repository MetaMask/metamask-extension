import { connect } from 'react-redux'
import RevealSeedPhrase from './reveal-seed-phrase.component'
import {
  setCompletedOnboarding,
  setSeedPhraseBackedUp,
} from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) => dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    setCompletedOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(null, mapDispatchToProps)(RevealSeedPhrase)
