import PropTypes from 'prop-types'
import React, { Component } from 'react'
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
import Identicon from '../../ui/identicon'

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    token: state.appState.modal.modalState.props.token,
    assetImages: state.metamask.assetImages,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    hideToken: address => {
      dispatch(actions.removeToken(address))
        .then(() => {
          dispatch(actions.hideModal())
        })
    },
  }
}

inherits(HideTokenConfirmationModal, Component)
function HideTokenConfirmationModal () {
  Component.call(this)

  this.state = {}
}

HideTokenConfirmationModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(HideTokenConfirmationModal)


HideTokenConfirmationModal.prototype.render = function HideTokenConfirmationModal () {
  const { token, network, hideToken, hideModal, assetImages } = this.props
  const { symbol, address } = token
  const image = assetImages[address]

  return (
    <div className="hide-token-confirmation">
      <div className="hide-token-confirmation__container">
        <div className="hide-token-confirmation__title">
          {this.context.t('hideTokenPrompt')}
        </div>
        <Identicon
          className="hide-token-confirmation__identicon"
          diameter={45}
          address={address}
          network={network}
          image={image}
        />
        <div className="hide-token-confirmation__symbol">{symbol}</div>
        <div className="hide-token-confirmation__copy">
          {this.context.t('readdToken')}
        </div>
        <div className="hide-token-confirmation__buttons">
          <button
            className="btn-default hide-token-confirmation__button btn--large"
            onClick={() => hideModal()}
          >
            {this.context.t('cancel')}
          </button>
          <button
            className="btn-secondary hide-token-confirmation__button btn--large"
            onClick={() => hideToken(address)}
          >
            {this.context.t('hide')}
          </button>
        </div>
      </div>
    </div>
  )
}
