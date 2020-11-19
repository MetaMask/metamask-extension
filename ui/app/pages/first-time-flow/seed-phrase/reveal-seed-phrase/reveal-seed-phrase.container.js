import { connect } from 'react-redux'
import {
  setCompletedOnboarding,
  setSeedPhraseBackedUp,
} from '../../../../store/actions'
import { getOnboardingInitiator } from '../../../../selectors'
import RevealSeedPhrase from './reveal-seed-phrase.component'

const mapStateToProps = (state) => {
  return {
    onboardingInitiator: getOnboardingInitiator(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSeedPhraseBackedUp: (seedPhraseBackupState) =>
      dispatch(setSeedPhraseBackedUp(seedPhraseBackupState)),
    setCompletedOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RevealSeedPhrase)
