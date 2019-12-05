import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
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

const AccountDetailsContainer = compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(AccountDetails)

AccountDetailsContainer.propTypes = {
  label: PropTypes.string.isRequired,
  checksummedAddress: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  showConnectedSites: PropTypes.func.isRequired,
}

export default AccountDetailsContainer
