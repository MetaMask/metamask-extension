import ConfirmScreen from './components/confirm'
import React from 'react'
import { connect } from 'react-redux'
import actions from '../../ui/app/actions'

class RemoveTokenScreen extends ConfirmScreen {
  render () {
    return (
      <ConfirmScreen
        subtitle="Remove Token"
        question={`Are you sure you want to remove token "${this.props.symbol}"?`}
        onCancelClick={() => this.props.goHome()}
        onNoClick={() => this.props.goHome()}
        onYesClick={() => {
          this.props.removeToken(this.props.address)
            .then(() => {
              this.props.goHome()
            })
        }}
      />
    )
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeToken: address => dispatch(actions.removeToken(address)),
    goHome: () => dispatch(actions.goHome()),
  }
}

export default connect(null, mapDispatchToProps)(RemoveTokenScreen)
