const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const App = require('./app')
const OldApp = require('../../old-ui/app/app')

function mapStateToProps (state) {
	return { betaUI: state.metamask.featureFlags.betaUI }
}

module.exports = connect(mapStateToProps)(SelectedApp)

inherits(SelectedApp, Component)
function SelectedApp () { Component.call(this) }

SelectedApp.prototype.render = function () {
  const { betaUI } = this.props
  const Selected = betaUI ? App : OldApp
  return h(Selected)
}
