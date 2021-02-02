import { connect } from 'react-redux'
import { showModal, setAccountLabel } from '../../../../store/actions'
import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
} from '../../../../selectors/selectors'
import AccountDetailsModal from './account-details-modal.component'
import { hexToBase32 } from '../../../../../../app/scripts/cip37'

const mapStateToProps = state => {
  const selectedIdentity = getSelectedIdentity(state)
  return {
    network: state.metamask.network,
    mainnetBase32Address: hexToBase32(selectedIdentity.address, 1029),
    testnetBase32Address: hexToBase32(selectedIdentity.address, 1),
    selectedIdentity,
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showExportPrivateKeyModal: () =>
      dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' })),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)
