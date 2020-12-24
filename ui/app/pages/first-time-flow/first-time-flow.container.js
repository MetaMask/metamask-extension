import { connect } from 'react-redux'
import { getFirstTimeFlowTypeRoute } from '../../selectors'
import {
  importExternalWallet,
  createNewVaultAndGetSeedPhrase,
  createNewVaultAndRestore,
  unlockAndGetBidirectionalQrAccount,
  verifySeedPhrase,
  createNewEmptyVault,
} from '../../store/actions'
import { INITIALIZE_BACKUP_SEED_PHRASE_ROUTE } from '../../helpers/constants/routes'
import FirstTimeFlow from './first-time-flow.component'

const mapStateToProps = (state, ownProps) => {
  const {
    metamask: {
      completedOnboarding,
      isInitialized,
      isUnlocked,
      seedPhraseBackedUp,
    },
  } = state
  const showingSeedPhraseBackupAfterOnboarding = Boolean(
    ownProps.location.pathname.match(INITIALIZE_BACKUP_SEED_PHRASE_ROUTE),
  )

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    nextRoute: getFirstTimeFlowTypeRoute(state),
    showingSeedPhraseBackupAfterOnboarding,
    seedPhraseBackedUp,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    createNewAccount: (password) =>
      dispatch(createNewVaultAndGetSeedPhrase(password)),
    createNewVault: (password) => dispatch(createNewEmptyVault(password)),
    createNewAccountFromSeed: (password, seedPhrase) => {
      return dispatch(createNewVaultAndRestore(password, seedPhrase))
    },
    createNewExternalWallet: (extendedPublicKey, page) => {
      return dispatch(importExternalWallet(extendedPublicKey, page))
    },
    unlockAccount: (password) =>
      dispatch(unlockAndGetBidirectionalQrAccount(password)),
    verifySeedPhrase: () => verifySeedPhrase(),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FirstTimeFlow)
