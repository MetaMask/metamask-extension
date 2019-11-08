import { connect } from 'react-redux'
import PermissionApproval from './permissions-connect.component'
import {
  accountsWithSendEtherInfoSelector,
  getFirstPermissionRequest,
  getNativeCurrency,
} from '../../selectors/selectors'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal } from '../../store/actions'

const mapStateToProps = state => {
  const permissionsRequest = getFirstPermissionRequest(state)
  console.log('permissionsRequest', permissionsRequest)
  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithoutLabel = accountsWithSendEtherInfoSelector(state)
  const accountsWithLabel = accountsWithoutLabel.map(account => {
    const { address, name, balance } = account
    return {
      address,
      truncatedAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      addressLabel: `${name} (...${address.slice(address.length - 4)})`,
      label: name,
      balance,
    }
  })

  return {
    permissionsRequest,
    accounts: accountsWithLabel,
    originName: origin,
    newAccountNumber: accountsWithLabel.length + 1,
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

export default connect(mapStateToProps, mapDispatchToProps)(PermissionApproval)
