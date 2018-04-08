const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const Component = require('react').Component
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const Mascot = require('../components/mascot')
const actions = require('../actions')
const Tooltip = require('../components/tooltip')
const getCaretCoordinates = require('textarea-caret')
const environmentType = require('../../../app/scripts/lib/environment-type')
const { OLD_UI_NETWORK_TYPE } = require('../../../app/scripts/config').enums

let isSubmitting = false

InitializeMenuScreen.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps)(InitializeMenuScreen)


inherits(InitializeMenuScreen, Component)
function InitializeMenuScreen () {
  Component.call(this)
  this.animationEventEmitter = new EventEmitter()
}

function mapStateToProps (state) {
  return {
    // state from plugin
    currentView: state.appState.currentView,
    warning: state.appState.warning,
  }
}

InitializeMenuScreen.prototype.render = function () {
  var state = this.props

  switch (state.currentView.name) {

    default:
      return this.renderMenu(state)

  }
}

// InitializeMenuScreen.prototype.componentDidMount = function(){
//   document.getElementById('password-box').focus()
// }

InitializeMenuScreen.prototype.renderMenu = function (state) {
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

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
          fontSize: '1.3em',
          textTransform: 'uppercase',
          color: '#7F8082',
          marginBottom: 10,
        },
      }, this.context.t('appName')),


      h('div', [
        h('h3', {
          style: {
            fontSize: '0.8em',
            color: '#7F8082',
            display: 'inline',
          },
        }, this.context.t('encryptNewDen')),

        h(Tooltip, {
          title: this.context.t('denExplainer'),
        }, [
          h('i.fa.fa-question-circle.pointer', {
            style: {
              fontSize: '18px',
              position: 'relative',
              color: 'rgb(247, 134, 28)',
              top: '2px',
              marginLeft: '4px',
            },
          }),
        ]),
      ]),

      h('span.in-progress-notification', state.warning),

      // password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box',
        placeholder: this.context.t('newPassword'),
        onInput: this.inputChanged.bind(this),
        style: {
          width: 260,
          marginTop: 12,
        },
      }),

      // confirm password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box-confirm',
        placeholder: this.context.t('confirmPassword'),
        onKeyPress: this.createVaultOnEnter.bind(this),
        onInput: this.inputChanged.bind(this),
        style: {
          width: 260,
          marginTop: 16,
        },
      }),


      h('button.primary', {
        onClick: this.createNewVaultAndKeychain.bind(this),
        style: {
          margin: 12,
        },
      }, this.context.t('createDen')),

      h('.flex-row.flex-center.flex-grow', [
        h('p.pointer', {
          onClick: this.showRestoreVault.bind(this),
          style: {
            fontSize: '0.8em',
            color: 'rgb(247, 134, 28)',
            textDecoration: 'underline',
          },
        }, this.context.t('importDen')),
      ]),

      // h('.flex-row.flex-center.flex-grow', [
      //   h('p.pointer', {
      //     onClick: this.showOldUI.bind(this),
      //     style: {
      //       fontSize: '0.8em',
      //       color: '#aeaeae',
      //       textDecoration: 'underline',
      //       marginTop: '32px',
      //     },
      //   }, 'Use classic interface'),
      // ]),

    ])
  )
}

InitializeMenuScreen.prototype.createVaultOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewVaultAndKeychain()
  }
}

InitializeMenuScreen.prototype.componentDidMount = function () {
  document.getElementById('password-box').focus()
}

InitializeMenuScreen.prototype.showRestoreVault = function () {
  this.props.dispatch(actions.markPasswordForgotten())
  if (environmentType() === 'popup') {
    global.platform.openExtensionInBrowser()
  }
}

InitializeMenuScreen.prototype.showOldUI = function () {
  this.props.dispatch(actions.setFeatureFlag('betaUI', false, 'OLD_UI_NOTIFICATION_MODAL'))
    .then(() => this.props.dispatch(actions.setNetworkEndpoints(OLD_UI_NETWORK_TYPE)))
}

InitializeMenuScreen.prototype.createNewVaultAndKeychain = function () {
  var passwordBox = document.getElementById('password-box')
  var password = passwordBox.value
  var passwordConfirmBox = document.getElementById('password-box-confirm')
  var passwordConfirm = passwordConfirmBox.value

  if (password.length < 8) {
    this.warning = this.context.t('passwordShort')
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (password !== passwordConfirm) {
    this.warning = this.context.t('passwordMismatch')
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }

  if (!isSubmitting) {
    isSubmitting = true
    this.props.dispatch(actions.createNewVaultAndKeychain(password))
  }
}

InitializeMenuScreen.prototype.inputChanged = function (event) {
  // tell mascot to look at page action
  var element = event.target
  var boundingRect = element.getBoundingClientRect()
  var coordinates = getCaretCoordinates(element, element.selectionEnd)
  this.animationEventEmitter.emit('point', {
    x: boundingRect.left + coordinates.left - element.scrollLeft,
    y: boundingRect.top + coordinates.top - element.scrollTop,
  })
}
