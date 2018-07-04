import { connect } from 'react-redux'
import actions from '../../../../actions'
import NewAccountCreateForm from './new-account.component'


export default connect(mapStateToProps, mapDispatchToProps)(NewAccountCreateForm)

function mapStateToProps (state) {
  const { metamask: { network, selectedAddress, identities = {} } } = state
  const numberOfExistingAccounts = Object.keys(identities).length

  return {
    network,
    address: selectedAddress,
    numberOfExistingAccounts,
  }
}

function mapDispatchToProps (dispatch) {
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
  }
}
