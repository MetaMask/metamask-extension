const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const Identicon = require('../identicon')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    layer2App: state.appState.modal.modalState.props.layer2App,
    assetImages: state.metamask.assetImages,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    hideLayer2App: address => {
      dispatch(actions.removeLayer2App(address))
        .then(() => {
          dispatch(actions.hideModal())
        })
    },
  }
}

inherits(HideLayer2AppConfirmationModal, Component)
function HideLayer2AppConfirmationModal () {
  Component.call(this)

  this.state = {}
}

HideLayer2AppConfirmationModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(HideLayer2AppConfirmationModal)


HideLayer2AppConfirmationModal.prototype.render = function () {
  const { layer2App, network, hideLayer2App, hideModal, assetImages } = this.props
  const { name, address } = layer2App
  const image = assetImages[address]

  return h('div.hide-layer2App-confirmation', {}, [
    h('div.hide-layer2App-confirmation__container', {
    }, [
      h('div.hide-layer2App-confirmation__title', {}, [
        this.context.t('hideLayer2AppPrompt'),
      ]),

      h('div.hide-layer2App-confirmation__name', {}, name),

      h('div.hide-layer2App-confirmation__copy', {}, [
        this.context.t('readdLayer2App'),
      ]),

      h('div.hide-layer2App-confirmation__buttons', {}, [
        h('button.btn-cancel.hide-layer2App-confirmation__button.allcaps', {
          onClick: () => hideModal(),
        }, [
          this.context.t('cancel'),
        ]),
        h('button.btn-clear.hide-layer2App-confirmation__button.allcaps', {
          onClick: () => hideLayer2App(address),
        }, [
          this.context.t('hide'),
        ]),
      ]),
    ]),
  ])
}
