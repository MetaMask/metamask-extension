import ConfirmScreen from './confirm'
import React from 'react'
import { connect } from 'react-redux'
import actions from '../../../ui/app/actions'

class DeleteImportedAccount extends ConfirmScreen {
  render () {
    return (
      <ConfirmScreen
        subtitle="Delete Imported Account"
        withDescription={true}
        description="Be sure, that you saved a private key or JSON keystore file of this account in a safe place. Otherwise, you will not be able to restore this account."
        question={`Are you sure to delete imported ${this.props.identity.name} (${this.props.identity.address})?`}
        onCancelClick={() => this.props.dispatch(actions.showConfigPage())}
        onNoClick={() => this.props.dispatch(actions.showConfigPage())}
        onYesClick={() => {
          this.props.dispatch(actions.removeAccount(this.props.identity.address, this.props.metamask.network))
            .then(() => {
              this.props.dispatch(actions.showConfigPage())
            })
        }}
      />
    )
  }
}

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    identity: state.appState.identity,
    provider: state.metamask.provider,
  }
}

module.exports = connect(mapStateToProps)(DeleteImportedAccount)
