import ConfirmScreen from './confirm'
import React from 'react'
import { connect } from 'react-redux'
import actions from '../../../ui/app/actions'
import { ifContractAcc } from '../util'

class DeleteImportedAccount extends ConfirmScreen {
  static propTypes = {
  }

  render () {
  const withDescription = !ifContractAcc(this.props.keyring)
    return (
      <ConfirmScreen
        subtitle="Delete Imported Account"
        withDescription={withDescription}
        description="Be sure, that you saved a private key or JSON keystore file of this account in a safe place. Otherwise, you will not be able to restore this account."
        question={`Are you sure to delete imported ${this.props.identity.name} (${this.props.identity.address})?`}
        onCancelClick={() => this.onCancelClick()}
        onNoClick={() => this.onNoClick()}
        onYesClick={() => this.onYesClick()}
      />
    )
  }

  onCancelClick () {
    this.props.showAccountsPage()
  }

  onNoClick () {
    this.props.showAccountsPage()
  }

  onYesClick () {
    this.props.removeAccount(this.props.identity.address, this.props.metamask.network)
      .then(() => {
        this.props.showAccountsPage()
      })
  }

}

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    identity: state.appState.identity,
    keyring: state.appState.keyring,
    provider: state.metamask.provider,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeAccount: (address, network) => dispatch(actions.removeAccount(address, network)),
    showAccountsPage: () => dispatch(actions.showAccountsPage()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DeleteImportedAccount)
