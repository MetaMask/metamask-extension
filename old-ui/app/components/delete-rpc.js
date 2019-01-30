import ConfirmScreen from './confirm'
import React from 'react'
import { connect } from 'react-redux'
import actions from '../../../ui/app/actions'

class DeleteRpc extends ConfirmScreen {
  render () {
    return (
      <ConfirmScreen
        subtitle="Delete Custom RPC"
        question={`Are you sure to delete ${this.props.url} ?`}
        onCancelClick={() => this.props.dispatch(actions.showConfigPage())}
        onNoClick={() => this.props.dispatch(actions.showConfigPage())}
        onYesClick={() => {
          this.props.dispatch(actions.removeCustomRPC(this.props.url, this.props.provider))
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
    url: state.appState.RPC_URL ? state.appState.RPC_URL : state.metamask.provider.rpcTarget,
    provider: state.metamask.provider,
  }
}

module.exports = connect(mapStateToProps)(DeleteRpc)
