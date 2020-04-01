import { compose } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import AccountDetailsDropdown from './account-details-dropdown.component'
import * as actions from '../../../../store/actions'
import { getSelectedIdentity, getRpcPrefsForCurrentProvider } from '../../../../selectors/selectors'
import genAccountLink from '../../../../../lib/account-link.js'

function mapStateToProps (state) {
  return {
    selectedIdentity: getSelectedIdentity(state),
    network: state.metamask.network,
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showAccountDetailModal: () => {
      dispatch(actions.showModal({ name: 'ACCOUNT_DETAILS' }))
    },
    viewOnEtherscan: (address, network, rpcPrefs) => {
      global.platform.openWindow({ url: genAccountLink(address, network, rpcPrefs) })
    },
    showRemoveAccountConfirmationModal: (identity) => {
      return dispatch(actions.showModal({ name: 'CONFIRM_REMOVE_ACCOUNT', identity }))
    },
  }
}

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(AccountDetailsDropdown)
