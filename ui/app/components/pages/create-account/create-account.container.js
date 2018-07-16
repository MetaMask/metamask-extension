import { connect } from 'react-redux'
import actions from '../../../actions'
import { getCurrentViewContext } from '../../../selectors'
import CreateAccountPage from './create-account.component'


export default connect(mapStateToProps, mapDispatchToProps)(CreateAccountPage)

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
      dispatch(actions.showModal({name: 'EXPORT_PRIVATE_KEY'}))
    },
    hideModal: () => dispatch(actions.hideModal()),
    setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
  }
}
