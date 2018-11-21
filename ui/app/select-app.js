const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const { HashRouter } = require('react-router-dom')
const App = require('./app')
const OldApp = require('../../old-ui/app/app')
const { autoAddToBetaUI } = require('./selectors')
const { setFeatureFlag } = require('./actions')
const I18nProvider = require('./i18n-provider')

function mapStateToProps (state) {
  return {
    darkMode: state.metamask.featureFlags.darkMode,
    betaUI: state.metamask.featureFlags.betaUI,
    autoAdd: autoAddToBetaUI(state),
    isUnlocked: state.metamask.isUnlocked,
    isMascara: state.metamask.isMascara,
    firstTime: Object.keys(state.metamask.identities).length === 0,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setFeatureFlagWithModal: () => {
      return dispatch(setFeatureFlag('betaUI', true, 'BETA_UI_NOTIFICATION_MODAL'))
    },
    setFeatureFlagWithoutModal: () => {
      return dispatch(setFeatureFlag('betaUI', true))
    },
  }
}
module.exports = connect(mapStateToProps, mapDispatchToProps)(SelectedApp)

inherits(SelectedApp, Component)
function SelectedApp () {
  Component.call(this)
}

SelectedApp.prototype.componentWillReceiveProps = function (nextProps) {
  // Code commented out until we begin auto adding users to NewUI
  const {
    // isUnlocked,
    // setFeatureFlagWithModal,
    setFeatureFlagWithoutModal,
    isMascara,
    // firstTime,
  } = this.props

  // if (isMascara || firstTime) {
  if (isMascara) {
    setFeatureFlagWithoutModal()
  }
  // } else if (!isUnlocked && nextProps.isUnlocked && (nextProps.autoAdd)) {
  //   setFeatureFlagWithModal()
  // }
}

SelectedApp.prototype.render = function () {
  // Code commented out until we begin auto adding users to NewUI
  // const { betaUI, isMascara, firstTime } = this.props
  // const Selected = betaUI || isMascara || firstTime ? App : OldApp

  const { betaUI, isMascara } = this.props

  return betaUI || isMascara
  ? h(HashRouter, {
      hashType: 'noslash',
    }, [
      h(I18nProvider, [ h(App) ]),
    ])
  : h(OldApp)
}
