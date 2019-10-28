import { connect } from 'react-redux'
import actions from '../../store/actions'
import NewAccountCreateForm from './new-account.component'

const mapStateToProps = state => {
  const { metamask: { network, selectedAddress, identities = {} } } = state
  const numberOfExistingAccounts = Object.keys(identities).length
  const newAccountNumber = numberOfExistingAccounts + 1

  return {
    network,
    address: selectedAddress,
    numberOfExistingAccounts,
    newAccountNumber,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    toCoinbase: address => dispatch(actions.buyEth({ network: '1', address, amount: 0 })),
    hideModal: () => dispatch(actions.hideModal()),
    createAccount: newAccountName => {
      return dispatch(actions.addNewAccount())
        .then(newAccountAddress => {
          if (newAccountName) {
            dispatch(actions.setAccountLabel(newAccountAddress, newAccountName))
          }
        })
    },
    showImportPage: () => dispatch(actions.showImportPage()),
    showConnectPage: () => dispatch(actions.showConnectPage()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewAccountCreateForm)
