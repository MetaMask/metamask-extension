const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const { getSelectedIdentity } = require('../../../selectors')

function mapStateToProps (state, ownProps) {
  return {
    selectedIdentity: ownProps.selectedIdentity || getSelectedIdentity(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {}
}

inherits(ExternalSignModalContainer, Component)
function ExternalSignModalContainer () {
  Component.call(this)
}

ExternalSignModalContainer.contextTypes = {
  t: PropTypes.func,
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalSignModalContainer)


ExternalSignModalContainer.prototype.render = function () {
  let { children } = this.props

  if (children.constructor !== Array) {
    children = [children]
  }

  return h('div', { style: { borderRadius: '4px' }}, [
    h('div.account-modal-container', [

      h('div.account-modal-close', {
        onClick: this.props.hideModal,
      }),

      ...children,

    ]),
  ])
}
