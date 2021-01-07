import { connect } from 'react-redux'
import { setAccountLabel } from '../../../../store/actions'
import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
} from '../../../../selectors'
import AccountDetailsModal from './account-details-modal.component'

const mapStateToProps = (state) => {
  return {
    network: state.metamask.network,
    selectedIdentity: getSelectedIdentity(state),
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)
