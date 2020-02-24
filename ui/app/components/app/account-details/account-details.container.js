import { connect } from 'react-redux'
<<<<<<< HEAD
=======
import PropTypes from 'prop-types'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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

<<<<<<< HEAD
export default connect(null, mapDispatchToProps)(AccountDetails)
=======
const AccountDetailsContainer = connect(null, mapDispatchToProps)(AccountDetails)

AccountDetailsContainer.propTypes = {
  label: PropTypes.string.isRequired,
  checksummedAddress: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  showConnectedSites: PropTypes.func.isRequired,
}

export default AccountDetailsContainer
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
