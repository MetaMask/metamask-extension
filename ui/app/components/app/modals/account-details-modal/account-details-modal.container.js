import { connect } from 'react-redux'
import actions from '../../../../store/actions'
import { getSelectedIdentity, getRpcPrefsForCurrentProvider } from '../../../../selectors/selectors'
import AccountDetailsModal from './account-details-modal.component'

const mapStateToProps = (state) => {
  return {
    network: state.metamask.network,
    selectedIdentity: getSelectedIdentity(state),
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    // Is this supposed to be used somewhere?
    showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
    showExportPrivateKeyModal: () => {
      dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
    },
    hideModal: () => dispatch(actions.hideModal()),
    setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)
