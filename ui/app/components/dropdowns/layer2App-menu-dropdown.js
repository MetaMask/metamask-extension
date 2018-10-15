const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const genAccountLink = require('etherscan-link').createAccountLink
const { Menu, Item, CloseArea } = require('./components/menu')

Layer2AppMenuDropdown.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Layer2AppMenuDropdown)

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showHideLayer2AppConfirmationModal: (layer2App) => {
      dispatch(actions.showModal({ name: 'HIDE_LAYER2APP_CONFIRMATION', layer2App }))
    },
  }
}


inherits(Layer2AppMenuDropdown, Component)
function Layer2AppMenuDropdown () {
  Component.call(this)

  this.onClose = this.onClose.bind(this)
}

Layer2AppMenuDropdown.prototype.onClose = function (e) {
  e.stopPropagation()
  this.props.onClose()
}

Layer2AppMenuDropdown.prototype.render = function () {
  const { showHideLayer2AppConfirmationModal } = this.props

  return h(Menu, { className: 'layer2App-menu-dropdown', isShowing: true }, [
    h(CloseArea, {
      onClick: this.onClose,
    }),
    h(Item, {
      onClick: (e) => {
        e.stopPropagation()
        showHideLayer2AppConfirmationModal(this.props.layer2App)
        this.props.onClose()
      },
      text: this.context.t('hideLayer2App'),
    }),
    h(Item, {
      onClick: (e) => {
        e.stopPropagation()
        const url = genAccountLink(this.props.layer2App.address, this.props.network)
        global.platform.openWindow({ url })
        this.props.onClose()
      },
      text: this.context.t('viewOnEtherscan'),
    }),
  ])
}
