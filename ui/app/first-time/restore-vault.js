const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../actions')

module.exports = connect(mapStateToProps)(RestoreVaultScreen)


inherits(RestoreVaultScreen, Component)
function RestoreVaultScreen() {
  Component.call(this)
}

function mapStateToProps(state) {
  return {
    warning: state.appState.warning,
  }
}


RestoreVaultScreen.prototype.render = function() {
  var state = this.props
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginBottom: 24,
          width: '100%',
          fontSize: '20px',
          padding: 6,
        },
      }, [
        'Restore Vault',
      ]),

      // wallet seed entry
      h('h3', 'Wallet Seed'),
      h('textarea.twelve-word-phrase.letter-spacey', {
        placeholder: 'Enter your secret twelve word phrase here to restore your vault.'
      }),

      // password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box',
        placeholder: 'New Password (min 8 chars)',
        style: {
          width: 260,
          marginTop: 12,
        },
      }),

      // confirm password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box-confirm',
        placeholder: 'Confirm Password',
        onKeyPress: this.onMaybeCreate.bind(this),
        style: {
          width: 260,
          marginTop: 16,
        },
      }),

      (state.warning) && (
        h('span.error.in-progress-notification', state.warning)
      ),

      // submit

      h('.flex-row.flex-space-between', {
        style: {
          marginTop: 30,
          width: '50%',
        },
      }, [

        // cancel
        h('button.primary', {
          onClick: this.showInitializeMenu.bind(this),
        }, 'CANCEL'),

        // submit
        h('button.primary', {
          onClick: this.restoreVault.bind(this),
        }, 'OK'),

      ]),

    ])

  )
}

RestoreVaultScreen.prototype.showInitializeMenu = function() {
  this.props.dispatch(actions.showInitializeMenu())
}

RestoreVaultScreen.prototype.onMaybeCreate = function(event) {
  if (event.key === 'Enter') {
    this.restoreVault()
  }
}

RestoreVaultScreen.prototype.restoreVault = function(){
  // check password
  var passwordBox = document.getElementById('password-box')
  var password = passwordBox.value
  var passwordConfirmBox = document.getElementById('password-box-confirm')
  var passwordConfirm = passwordConfirmBox.value
  if (password.length < 8) {
    this.warning = 'Password not long enough'

    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (password !== passwordConfirm) {
    this.warning = 'Passwords don\'t match'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  // check seed
  var seedBox = document.querySelector('textarea.twelve-word-phrase')
  var seed = seedBox.value.trim()
  if (seed.split(' ').length !== 12) {
    this.warning = 'seed phrases are 12 words long'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  // submit
  this.warning = null
  this.props.dispatch(actions.displayWarning(this.warning))
  this.props.dispatch(actions.recoverFromSeed(password, seed))
}
