import { connect } from 'react-redux'
import FirstTimeFlow from './first-time-flow.component'
import { getFirstTimeFlowTypeRoute } from './first-time-flow.selectors'
import {
  createNewVaultAndGetSeedPhrase,
  createNewVaultAndRestore,
  unlockAndGetSeedPhrase,
} from '../../../actions'

const mapStateToProps = state => {
  const { metamask: { completedOnboarding, isInitialized, isUnlocked } } = state

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    nextRoute: getFirstTimeFlowTypeRoute(state),
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
