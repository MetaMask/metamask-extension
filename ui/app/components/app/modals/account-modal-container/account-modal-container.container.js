import { connect } from 'react-redux'
import { hideModal } from '../../../../store/actions'
import { getSelectedIdentity } from '../../../../selectors/selectors'
import AccountModalContainer from './account-modal-container.component'

function mapStateToProps(state, ownProps) {
  const selectedIdentity =
    ownProps.selectedIdentity || getSelectedIdentity(state)
  return {
    selectedIdentity,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => {
      dispatch(hideModal())
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AccountModalContainer)
