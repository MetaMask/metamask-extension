const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const genAccountLink = require('etherscan-link').createAccountLink
const copyToClipboard = require('copy-to-clipboard')

TokenMenuDropdown.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(TokenMenuDropdown)

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showHideTokenConfirmationModal: (token) => {
      dispatch(actions.showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
    },
  }
}


inherits(TokenMenuDropdown, Component)
function TokenMenuDropdown () {
  Component.call(this)

  this.onClose = this.onClose.bind(this)
}

TokenMenuDropdown.prototype.onClose = function (e) {
  e.stopPropagation()
  this.props.onClose()
}

TokenMenuDropdown.prototype.render = function () {
  const { showHideTokenConfirmationModal } = this.props

  return h('div.token-menu-dropdown', {}, [
    h('div.token-menu-dropdown__close-area', {
      onClick: this.onClose,
    }),
    h('div.token-menu-dropdown__container', {}, [
      h('div.token-menu-dropdown__options', {}, [

        h('div.token-menu-dropdown__option', {
          onClick: (e) => {
            e.stopPropagation()
            showHideTokenConfirmationModal(this.props.token)
            this.props.onClose()
          },
        }, this.context.t('hideToken')),
        h('div.token-menu-dropdown__option', {
          onClick: (e) => {
            e.stopPropagation()
            copyToClipboard(this.props.token.address)
            this.props.onClose()
          },
        }, this.context.t('copyContractAddress')),
        h('div.token-menu-dropdown__option', {
          onClick: (e) => {
            e.stopPropagation()
            const url = genAccountLink(this.props.token.address, this.props.network)
            global.platform.openWindow({ url })
            this.props.onClose()
          },
        }, this.context.t('viewOnEtherscan')),
      ]),
    ]),
  ])
}
