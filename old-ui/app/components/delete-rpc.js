import ConfirmScreen from './confirm'
import React from 'react'
import { connect } from 'react-redux'
import actions from '../../../ui/app/actions'

class DeleteRpc extends ConfirmScreen {
  static propTypes = {
  }
  
  render () {
    const props = this.props
    return (
      <ConfirmScreen
        subtitle="Delete Custom RPC"
        question={`Are you sure to delete ${props.url} ?`}
        onCancelClick={() => props.showConfigPage()}
        onNoClick={() => props.showConfigPage()}
        onYesClick={() => {
          props.removeCustomRPC(props.url, props.provider)
            .then(() => {
              props.showConfigPage()
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

const mapDispatchToProps = dispatch => {
  return {
    showConfigPage: () => dispatch(actions.showConfigPage()),
    removeCustomRPC: (url, provider) => dispatch(actions.removeCustomRPC(url, provider)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(DeleteRpc)
