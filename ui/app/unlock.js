const inherits = require('util').inherits
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const getCaretCoordinates = require('textarea-caret')
const EventEmitter = require('events').EventEmitter
const { OLD_UI_NETWORK_TYPE } = require('../../app/scripts/config').enums
const environmentType = require('../../app/scripts/lib/environment-type')

const Mascot = require('./components/mascot')

UnlockScreen.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps)(UnlockScreen)


inherits(UnlockScreen, Component)
function UnlockScreen () {
  Component.call(this)
  this.animationEventEmitter = new EventEmitter()
}

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
  }
}

UnlockScreen.prototype.render = function () {
  const state = this.props
  const warning = state.warning
  return (
    h('.unlock-screen', [

      // h(Mascot, {
      //   animationEventEmitter: this.animationEventEmitter,
      // }),

      h('img', {
        style: {
          width: '225',
          height: '225',
        },
        src: 'images/icon-512.png',
      }),

      h('h1', {
        style: {
          fontSize: '1.4em',
          textTransform: 'uppercase',
          color: '#7F8082',
        },
      }, this.context.t('appName')),

      h('input.large-input', {
        type: 'password',
        id: 'password-box',
        placeholder: 'enter password',
        style: {
          background: 'white',
        },
        onKeyPress: this.onKeyPress.bind(this),
        onInput: this.inputChanged.bind(this),
      }),

      h('.error', {
        style: {
          display: warning ? 'block' : 'none',
          padding: '0 20px',
          textAlign: 'center',
        },
      }, warning),

      h('button.primary.cursor-pointer', {
        onClick: this.onSubmit.bind(this),
        style: {
          margin: 10,
        },
      }, this.context.t('login')),

      h('p.pointer', {
        onClick: () => {
          this.props.dispatch(actions.markPasswordForgotten())
          if (environmentType() === 'popup') {
            global.platform.openExtensionInBrowser()
          }
        },
        style: {
          fontSize: '0.8em',
          color: 'rgb(247, 134, 28)',
          textDecoration: 'underline',
        },
      }, this.context.t('restoreFromSeed')),

      // h('p.pointer', {
      //   onClick: () => {
      //     this.props.dispatch(actions.setFeatureFlag('betaUI', false, 'OLD_UI_NOTIFICATION_MODAL'))
      //       .then(() => this.props.dispatch(actions.setNetworkEndpoints(OLD_UI_NETWORK_TYPE)))
      //   },
      //   style: {
      //     fontSize: '0.8em',
      //     color: '#aeaeae',
      //     textDecoration: 'underline',
      //     marginTop: '32px',
      //   },
      // }, this.context.t('classicInterface')),
    ])
  )
}

UnlockScreen.prototype.componentDidMount = function () {
  document.getElementById('password-box').focus()
}

UnlockScreen.prototype.onSubmit = function (event) {
  const input = document.getElementById('password-box')
  const password = input.value
  this.props.dispatch(actions.tryUnlockMetamask(password))
}

UnlockScreen.prototype.onKeyPress = function (event) {
  if (event.key === 'Enter') {
    this.submitPassword(event)
  }
}

UnlockScreen.prototype.submitPassword = function (event) {
  var element = event.target
  var password = element.value
  // reset input
  element.value = ''
  this.props.dispatch(actions.tryUnlockMetamask(password))
}

UnlockScreen.prototype.inputChanged = function (event) {
  // tell mascot to look at page action
  var element = event.target
  var boundingRect = element.getBoundingClientRect()
  var coordinates = getCaretCoordinates(element, element.selectionEnd)
  this.animationEventEmitter.emit('point', {
    x: boundingRect.left + coordinates.left - element.scrollLeft,
    y: boundingRect.top + coordinates.top - element.scrollTop,
  })
}
