import { connect } from 'react-redux'
import FirstTimeFlow from './first-time-flow.component'
import {
  createNewVaultAndGetSeedPhrase,
  createNewVaultAndRestore,
  unlockAndGetSeedPhrase,
} from '../../../actions'

const mapStateToProps = state => {
  const { metamask: { completedOnboarding, isInitialized, isUnlocked, noActiveNotices } } = state

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    noActiveNotices,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createNewAccount: password => dispatch(createNewVaultAndGetSeedPhrase(password)),
    createNewAccountFromSeed: (password, seedPhrase) => {
      return dispatch(createNewVaultAndRestore(password, seedPhrase))
    },
    unlockAccount: password => dispatch(unlockAndGetSeedPhrase(password)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FirstTimeFlow)
