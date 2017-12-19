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
		isMascara: state.metamask.isMascara,
	}
}

function mapDispatchToProps (dispatch) {
  return {
    setFeatureFlagToBeta: notificationModal => dispatch(setFeatureFlag('betaUI', true, notificationModal)),
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
	const { isUnlocked, setFeatureFlagToBeta, isMascara } = this.props
	const notificationModal = isMascara ? null : 'BETA_UI_NOTIFICATION_MODAL'

	if (!isUnlocked && nextProps.isUnlocked && (nextProps.autoAdd || isMascara)) {
		this.setState({ autoAdd: nextProps.autoAdd })
		setFeatureFlagToBeta(notificationModal)
	}
}

SelectedApp.prototype.render = function () {
  const { betaUI, isMascara } = this.props
  const Selected = betaUI || isMascara ? App : OldApp
  return h(Selected)
}
