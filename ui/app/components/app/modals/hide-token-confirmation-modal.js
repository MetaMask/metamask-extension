<<<<<<< HEAD
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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
    hideToken: (address) => {
      dispatch(actions.removeToken(address))
        .then(() => {
          dispatch(actions.hideModal())
        })
    },
  }
}

class HideTokenConfirmationModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideToken: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    assetImages: PropTypes.object.isRequired,
    token: PropTypes.shape({
      symbol: PropTypes.string,
      address: PropTypes.string,
    }),
  }

  state = {}

<<<<<<< HEAD
HideTokenConfirmationModal.prototype.render = function () {
  const { token, network, hideToken, hideModal, assetImages } = this.props
  const { symbol, address } = token
  const image = assetImages[address]

  return h('div.hide-token-confirmation', {}, [
    h('div.hide-token-confirmation__container', {
    }, [
      h('div.hide-token-confirmation__title', {}, [
        this.context.t('hideTokenPrompt'),
      ]),

      h(Identicon, {
        className: 'hide-token-confirmation__identicon',
        diameter: 45,
        address,
        network,
        image,
      }),

      h('div.hide-token-confirmation__symbol', {}, symbol),

      h('div.hide-token-confirmation__copy', {}, [
        this.context.t('readdToken'),
      ]),

      h('div.hide-token-confirmation__buttons', {}, [
        h('button.btn-default.hide-token-confirmation__button.btn--large', {
          onClick: () => hideModal(),
        }, [
          this.context.t('cancel'),
        ]),
        h('button.btn-secondary.hide-token-confirmation__button.btn--large', {
          onClick: () => hideToken(address),
        }, [
          this.context.t('hide'),
        ]),
      ]),
    ]),
  ])
=======
  render () {
    const { token, hideToken, hideModal, assetImages } = this.props
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
}

export default connect(mapStateToProps, mapDispatchToProps)(HideTokenConfirmationModal)
