import { connect } from 'react-redux'
import ConfirmSeedPhrase from './confirm-seed-phrase.component'
import { setCompletedOnboarding, showModal } from '../../../../../actions'

const mapDispatchToProps = dispatch => {
  return {
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
    openBuyEtherModal: () => dispatch(showModal({ name: 'DEPOSIT_ETHER'})),
  }
}

export default connect(null, mapDispatchToProps)(ConfirmSeedPhrase)
