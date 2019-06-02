const h = require('react-hyperscript')
const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect

const APP_ID = '57914701-800a-4aa9-89f8-7274299fb910'

function mapStateToProps (state) {
  const { selectedAddress } = state.metamask

  return {
    selectedAddress,
  }
}

inherits(SafelloForm, Component)
function SafelloForm () {
  Component.call(this)
}

SafelloForm.prototype.render = function () {
  const { selectedAddress } = this.props

  return h('div.safello-form-wrapper', [
    h('iframe', {
      src: `https://app.safello.com/widget?appId=${APP_ID}&crypto=eth&address=${selectedAddress}&utm_source=Metamask&utm_medium=Wallet`,
    }),
  ])
}

module.exports = connect(mapStateToProps)(SafelloForm)
