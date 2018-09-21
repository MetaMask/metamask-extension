import React, { Component } from 'react'
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const actions = require('../../../actions')
const { SETTINGS_ROUTE } = require('../../../routes')

class ErrorLoadingNetwork extends Component {
  static propTypes = {
    isErrorLoadingNetwork: PropTypes.bool,
    showErrorLoadingNetworkModal: PropTypes.func,
    hideErrorLoadingNetworkModal: PropTypes.func,
    networkDropdownOpen: PropTypes.bool,
    showNetworkDropdown: PropTypes.func,
    hideNetworkDropdown: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)
    console.log('creating component')

    const { showErrorLoadingNetworkModal } = props
    showErrorLoadingNetworkModal()
  }

  renderMessage () {
    return [
        <span 
          className="emoji"
          role="img"
          aria-label="Surprise"
          aria-hidden="true"
        >
          😮
        </span>,
        <p />,
        ('span', this.context.t('verifyNetworkTimeout')) 
    ]
  }
  renderButtons () {
    const { hideErrorLoadingNetworkModal } = this.props
    return h('div.hero-balance', {}, [
      h('div.flex-row.flex-center', [
        h('button.btn-primary', {
          onClick: (event) => {
            hideErrorLoadingNetworkModal()
            this.handleNetworkIndicatorClick(event) 
          }
        }, this.context.t('switchNetwork'), []),
        h('button.btn-confirm', {
          style: { 'margin-left': '12px' },
          onClick: (event) => {
            hideErrorLoadingNetworkModal()
            this.handleNetworkResetConnectionClick(event) 
          }
        }, this.context.t('tryAgain'), [])
      ])
    ])
  }

  handleNetworkResetConnectionClick (event) {
    //event.preventDefault()
    //event.stopPropagation()

    const props = this.props
    const { provider: { type: providerType, rpcTarget: activeNetwork } } = props
    console.log(activeNetwork)
    providerType === 'rpc' ? this.props.history.push(SETTINGS_ROUTE) : props.setProviderType(providerType)
      
  }
  handleNetworkIndicatorClick (event) {
    //event.preventDefault()
    //event.stopPropagation()

    const { networkDropdownOpen, showNetworkDropdown, hideNetworkDropdown } = this.props
    return networkDropdownOpen === false
      ? showNetworkDropdown()
      : hideNetworkDropdown()
  }

  render () {
    console.log('render modal component')
    return h('div', {style: { borderRadius: '6px' }}, [
        h('div.error-loading-network-modal-container', [
          h('div.error-loading-network-modal-close', {
            onClick: (event) => { this.props.hideErrorLoadingNetworkModal() }
          }),
          h('.error-loading-network-modal-message', [
            this.renderMessage()
          ]),
          this.renderButtons()
        ]),
      ])
  }
}


module.exports = ErrorLoadingNetwork
