const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const App = require('./app')
const OldApp = require('../../old-ui/app/app')
const { autoAddToBetaUI } = require('./selectors')
const { setFeatureFlag } = require('./actions')

function mapStateToProps (state) {
	return {
		betaUI: state.metamask.featureFlags.betaUI,
		autoAdd: autoAddToBetaUI(state),
		isUnlocked: state.metamask.isUnlocked,
	}
}

function mapDispatchToProps (dispatch) {
  return {
    setFeatureFlagToBeta: () => dispatch(setFeatureFlag('betaUI', true)),
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(SelectedApp)

inherits(SelectedApp, Component)
function SelectedApp () {
	this.state = {
		autoAdd: false,
	}
	Component.call(this)
}

SelectedApp.prototype.componentWillReceiveProps = function (nextProps) {
	const { isUnlocked, setFeatureFlagToBeta } = this.props

	if (!isUnlocked && nextProps.isUnlocked && nextProps.autoAdd) {
		this.setState({ autoAdd: nextProps.autoAdd })
		setFeatureFlagToBeta()
	}
}

SelectedApp.prototype.render = function () {
  const { betaUI } = this.props
  const { autoAdd } = this.state 
  const Selected = betaUI ? App : OldApp
  return h(Selected)
}
