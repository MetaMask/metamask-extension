import { connect } from 'react-redux'
import { displayWarning, requestRevealSeedWords, fetchInfoToSync } from '../../store/actions'
import MobileSyncPage from './mobile-sync.component'

const mapDispatchToProps = (dispatch) => {
  return {
    requestRevealSeedWords: password => dispatch(requestRevealSeedWords(password)),
    fetchInfoToSync: () => dispatch(fetchInfoToSync()),
    displayWarning: (message) => dispatch(displayWarning(message || null)),
  }
}

const mapStateToProps = state => {
  const {
    metamask: {
      selectedAddress,
    },
  } = state

  return {
    selectedAddress,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(MobileSyncPage)
