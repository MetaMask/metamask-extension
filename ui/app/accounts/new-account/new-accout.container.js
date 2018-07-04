import { connect } from 'react-redux'
import AccountDetailsModal from './new-accout.component'
import actions from '../../actions'
import { getCurrentViewContext } from '../../selectors'

export default connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)

function mapStateToProps (state) {
  return {
    displayedForm: getCurrentViewContext(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    displayForm: form => dispatch(actions.setNewAccountForm(form)),
    showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
    showExportPrivateKeyModal: () => {
      dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
    },
    hideModal: () => dispatch(actions.hideModal()),
    setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
  }
}
