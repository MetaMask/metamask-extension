const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../ui/app/actions')

module.exports = connect(mapStateToProps)(ConfirmChangePassword)

function mapStateToProps (state) {
  return {
    metamask: state.metamask,
    warning: state.appState.warning,
  }
}

inherits(ConfirmChangePassword, Component)
function ConfirmChangePassword () {
  Component.call(this)
}

ConfirmChangePassword.prototype.render = function () {
  const state = this.props
  const passwordInputAdditionalStyle = {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  }
  return h('.flex-column.flex-grow', {
    style: {
      overflowX: 'auto',
      overflowY: 'hidden',
    },
  }, [
    // subtitle and nav
    h('.section-title.flex-row.flex-center', [
      h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
        onClick: () => {
          this.props.dispatch(actions.showConfigPage())
        },
        style: {
          position: 'absolute',
          left: '30px',
        },
      }),
      h('h2.page-subtitle', 'Change Password'),
    ]),
    h('div', {
      style: {
        margin: '0 30px',
      },
    }, [
      h('.error', {
        style: {
          display: state.warning ? 'block' : 'none',
        },
      }, state.warning),
      h('span', 'Old password'),
      h('input.large-input', {
        type: 'password',
        id: 'old-password-box',
        style: passwordInputAdditionalStyle,
      }),
      h('span', 'New password'),
      h('input.large-input', {
        type: 'password',
        id: 'new-password-box',
        style: passwordInputAdditionalStyle,
      }),
      h('span', 'Confirm new password'),
      h('input.large-input', {
        type: 'password',
        id: 'password-box-confirm',
        style: passwordInputAdditionalStyle,
        onKeyPress: this.createOnEnter.bind(this),
      }),
    ]),
    h('p.confirm-label', {
        style: {
          textAlign: 'center',
          margin: '0px 30px 20px ',
        },
      },
      `Are you sure you want to change the password for unlocking of your wallet?`),
    h('.flex-row.flex-right', {
      style: {
        marginRight: '30px',
      },
    }, [
      h('button.btn-violet',
        {
          style: {
            marginRight: '10px',
          },
          onClick: () => {
            this.props.dispatch(actions.showConfigPage())
          },
        },
        'No'),
      h('button',
        {
          onClick: () => {
            this.ChangePassword()
          },
        },
        'Yes'),
    ]),
  ])
}

ConfirmChangePassword.prototype.createOnEnter = function (event) {
  if (event.key === 'Enter') {
    this.ChangePassword()
  }
}

ConfirmChangePassword.prototype.ChangePassword = function () {
  var oldPasswordBox = document.getElementById('old-password-box')
  var oldPassword = oldPasswordBox.value
  var newPasswordBox = document.getElementById('new-password-box')
  var newPassword = newPasswordBox.value
  var newPasswordConfirmBox = document.getElementById('password-box-confirm')
  var newPasswordConfirm = newPasswordConfirmBox.value
  if (oldPassword.length < 8) {
    this.warning = 'Incorrect password'

    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (newPassword.length < 8) {
    this.warning = 'Password not long enough'

    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (newPassword !== newPasswordConfirm) {
    this.warning = 'Passwords don\'t match'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (newPassword === oldPassword) {
    this.warning = 'New password should differ from the current one'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  this.props.dispatch(actions.changePassword(oldPassword, newPassword))
    .then(() => {
      this.props.dispatch(actions.showConfigPage())
    })
}
