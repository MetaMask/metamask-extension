import { connect } from 'react-redux'
import ConnectedSites from './connected-sites.component'
import {
  getFirstPermissionRequest,
  getNativeCurrency,
  getAccountsWithLabels,
} from '../../selectors/selectors'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal } from '../../store/actions'

const mapStateToProps = state => {
  const permissionsRequest = getFirstPermissionRequest(state)
  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithLabels = getAccountsWithLabels(state)

  return {
    permissionsRequest,
    accounts: accountsWithLabels,
    originName: origin,
    newAccountNumber: accountsWithLabels.length + 1,
    nativeCurrency,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    approvePermissionsRequest: (requestId, accounts) => dispatch(approvePermissionsRequest(requestId, accounts)),
    rejectPermissionsRequest: requestId => dispatch(rejectPermissionsRequest(requestId)),
    showNewAccountModal: ({ onCreateNewAccount, newAccountNumber }) => {
      return dispatch(showModal({
        name: 'NEW_ACCOUNT',
        onCreateNewAccount,
        newAccountNumber,
      }))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedSites)
