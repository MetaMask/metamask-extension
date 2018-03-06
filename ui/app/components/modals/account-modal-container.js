const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const { getSelectedIdentity } = require('../../selectors')
const Identicon = require('../identicon')

function mapStateToProps (state) {
  return {
    selectedIdentity: getSelectedIdentity(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

inherits(AccountModalContainer, Component)
function AccountModalContainer () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountModalContainer)

AccountModalContainer.prototype.render = function () {
  const {
    selectedIdentity,
    showBackButton = false,
    backButtonAction,
  } = this.props
  let { children } = this.props

  if (children.constructor !== Array) {
    children = [children]
  }

  return h('div', { style: { borderRadius: '4px' }}, [
    h('div.account-modal-container', [

      h('div', [

        // Needs a border; requires changes to svg
        h(Identicon, {
          address: selectedIdentity.address,
          diameter: 64,
          style: {},
        }),

      ]),

      showBackButton && h('div.account-modal-back', {
        onClick: backButtonAction,
      }, [

        h('i.fa.fa-angle-left.fa-lg'),

        h('span.account-modal-back__text', ' Back'),

      ]),

      h('div.account-modal-close', {
        onClick: this.props.hideModal,
      }),

      ...children,

    ]),
  ])
}
