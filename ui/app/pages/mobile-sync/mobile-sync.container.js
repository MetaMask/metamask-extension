import { connect } from 'react-redux'
import { displayWarning, requestRevealSeedWords, fetchInfoToSync } from '../../store/actions'
import MobileSyncPage from './mobile-sync.component'
import { getMostRecentOverviewPage } from '../../ducks/history/history'

const mapDispatchToProps = (dispatch) => {
  return {
    requestRevealSeedWords: (password) => dispatch(requestRevealSeedWords(password)),
    fetchInfoToSync: () => dispatch(fetchInfoToSync()),
    displayWarning: (message) => dispatch(displayWarning(message || null)),
  }
}

const mapStateToProps = (state) => {
  const {
    metamask: {
      selectedAddress,
    },
  } = state

  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    selectedAddress,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MobileSyncPage)
