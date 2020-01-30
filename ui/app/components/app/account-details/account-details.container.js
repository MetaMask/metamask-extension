import { connect } from 'react-redux'
import { hideSidebar, showModal } from '../../../store/actions'
import AccountDetails from './account-details.component'

function mapDispatchToProps (dispatch) {
  return {
    hideSidebar: () => dispatch(hideSidebar()),
    showAccountDetailModal: () => {
      dispatch(showModal({ name: 'ACCOUNT_DETAILS' }))
    },
  }
}

export default connect(null, mapDispatchToProps)(AccountDetails)
