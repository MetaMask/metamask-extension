const inherits = require('util').inherits
const PersistentForm = require('../../../lib/persistent-form')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../actions')
const t = require('../../../i18n')

module.exports = connect(mapStateToProps)(RestoreVaultScreen)

inherits(RestoreVaultScreen, PersistentForm)
function RestoreVaultScreen () {
  PersistentForm.call(this)
}

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
    forgottenPassword: state.appState.forgottenPassword,
  }
}

RestoreVaultScreen.prototype.render = function () {
  var state = this.props
  this.persistentFormParentId = 'restore-vault-form'

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
        dataset: {
          persistentFormId: 'wallet-seed',
        },
        placeholder: t('secretPhrase'),
      }),

      // password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box',
        placeholder: t('newPassword'),
        dataset: {
          persistentFormId: 'password',
        },
        style: {
          width: 260,
          marginTop: 12,
        },
      }),

      // confirm password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box-confirm',
        placeholder: t('confirmPassword'),
        onKeyPress: this.createOnEnter.bind(this),
        dataset: {
          persistentFormId: 'password-confirmation',
        },
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
        }, t('cancel')),

        // submit
        h('button.primary', {
          onClick: this.createNewVaultAndRestore.bind(this),
        }, t('accept')),

      ]),
    ])

  )
}

RestoreVaultScreen.prototype.showInitializeMenu = function () {
  const { dispatch, forgottenPassword } = this.props
  dispatch(actions.unMarkPasswordForgotten())
    .then(() => {
      if (forgottenPassword) {
        dispatch(actions.backToUnlockView())
      } else {
        dispatch(actions.showInitializeMenu())
      }
    })
}

RestoreVaultScreen.prototype.createOnEnter = function (event) {
  if (event.key === 'Enter') {
    this.createNewVaultAndRestore()
  }
}

RestoreVaultScreen.prototype.createNewVaultAndRestore = function () {
  // check password
  var passwordBox = document.getElementById('password-box')
  var password = passwordBox.value
  var passwordConfirmBox = document.getElementById('password-box-confirm')
  var passwordConfirm = passwordConfirmBox.value
  if (password.length < 8) {
    this.warning = t('passwordShort')
    //this.warning = 'Password not long enough'//this one

    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (password !== passwordConfirm) {
    this.warning = t('passwordMismatch')
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  // check seed
  var seedBox = document.querySelector('textarea.twelve-word-phrase')
  var seed = seedBox.value.trim()

  // true if the string has more than a space between words.
  if (seed.split('  ').length > 1) {
    this.warning = t('spaceBetween') 
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  // true if seed contains a character that is not between a-z or a space
  if (!seed.match(/^[a-z ]+$/)) {
    this.warning = t('loweCaseWords')
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (seed.split(' ').length !== 12) {
    this.warning = t('seedPhraseReq')
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  // submit
  this.warning = null
  this.props.dispatch(actions.displayWarning(this.warning))
  this.props.dispatch(actions.createNewVaultAndRestore(password, seed))
    .catch(err => log.error(err.message))
}
