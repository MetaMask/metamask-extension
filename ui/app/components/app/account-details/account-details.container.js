import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
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

export default compose(withRouter, connect(null, mapDispatchToProps))(AccountDetails)
