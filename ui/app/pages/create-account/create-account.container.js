import { connect } from 'react-redux'
import actions from '../../store/actions'
import { getCurrentViewContext } from '../../selectors/selectors'
import CreateAccountPage from './create-account.component'

const mapStateToProps = state => ({
  displayedForm: getCurrentViewContext(state),
})

const mapDispatchToProps = dispatch => ({
  displayForm: form => dispatch(actions.setNewAccountForm(form)),
  showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
  showExportPrivateKeyModal: () => {
    dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
  },
  hideModal: () => dispatch(actions.hideModal()),
  setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateAccountPage)
