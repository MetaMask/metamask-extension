import { connect } from 'react-redux'
import { displayWarning, requestRevealSeedWords, fetchInfoToSync, exportAccount } from '../../store/actions'
import MobileSyncPage from './mobile-sync.component'
import { getMostRecentOverviewPage } from '../../ducks/history/history'
import { getMetaMaskKeyrings } from '../../selectors'

const mapDispatchToProps = (dispatch) => {
  return {
    requestRevealSeedWords: (password) => dispatch(requestRevealSeedWords(password)),
    fetchInfoToSync: () => dispatch(fetchInfoToSync()),
    displayWarning: (message) => dispatch(displayWarning(message || null)),
    exportAccount: (password, address) => dispatch(exportAccount(password, address)),
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
    keyrings: getMetaMaskKeyrings(state),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MobileSyncPage)
