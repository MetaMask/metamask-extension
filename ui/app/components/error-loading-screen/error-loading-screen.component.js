import React, { Component } from 'react'
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const actions = require('../../actions')
const { SETTINGS_ROUTE } = require('../../routes')

class ErrorLoadingScreen extends Component {
  static propTypes = {
    errorLoadingMessage: PropTypes.string,
    networkDropdownOpen: PropTypes.bool,
    showNetworkDropdown: PropTypes.func,
    hideNetworkDropdown: PropTypes.func
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)

    const { showErrorLoadingScreen } = this.props
    showErrorLoadingScreen()
  }

  renderMessage () {
    const { loadingMessage } = this.props
    return ('span', loadingMessage)
  }
  renderButtons () {
    return h('div.hero-balance', {}, [
      h('div.flex-row.flex-center.hero-balance-buttons', [
        h('button.btn-primary.hero-balance-button', {
          onClick: event => this.handleNetworkIndicatorClick(event)
        }, this.context.t('switchNetwork'), []),
        h('button.btn-primary.hero-balance-button', {
          onClick: event => this.handleNetworkResetConnectionClick(event)
        }, this.context.t('tryAgain'), [])
      ])
    ])
  }
  handleClose () {
      this.props.hideErrorLoadingScreen()
  }

  handleNetworkResetConnectionClick (event) {
    event.preventDefault()
    event.stopPropagation()

    const props = this.props
    const { provider: { type: providerType, rpcTarget: activeNetwork } } = props
    console.log(activeNetwork)
    providerType === 'rpc' ? this.props.history.push(SETTINGS_ROUTE) : props.setProviderType(providerType)
      
  }
  handleNetworkIndicatorClick (event) {
    event.preventDefault()
    event.stopPropagation()

    const { networkDropdownOpen, showNetworkDropdown, hideNetworkDropdown } = this.props

    return networkDropdownOpen === false
      ? showNetworkDropdown()
      : hideNetworkDropdown()
  }

  render () {
    const isOpen = this.props.errorLoadingScreenOpen
    return !isOpen
       ? null
       : (
       h('.error-loading-overlay', [
        h('.error-loading-overlay__container', [
          <div
            className="info-box__close"
            onClick={() => this.handleClose()}
          />,
          h('.error-loading-overlay__message', [
            this.renderMessage()
          ]),
          this.renderButtons()
        ]),
      ])
    )
  }
}


module.exports = ErrorLoadingScreen
