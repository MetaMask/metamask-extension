const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const log = require('loglevel')
const EventEmitter = require('events').EventEmitter

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
    h('.flex-column', {
      style: {
        width: 'inherit',
      },
    }, [
      h('.unlock-screen.flex-column.flex-center.flex-grow', [

        h('.logo'),

        h('h1', {
          style: {
            paddingTop: '50px',
            fontSize: '30px',
            color: '#ffffff',
          },
        }, 'Nifty Wallet'),

        h('div', [
          h('input.large-input', {
            type: 'password',
            id: 'password-box',
            placeholder: 'Enter password',
            style: {

            },
            onKeyPress: this.onKeyPress.bind(this),
          }),

          h('button.cursor-pointer', {
            onClick: this.onSubmit.bind(this),
            style: {
              margin: '10px 0 10px 10px',
            },
          }, 'Log In'),

          h('.error', {
            style: {
              display: warning ? 'block' : 'none',
            },
          }, warning),
        ]),

      ]),

      h('.flex-row.flex-center.flex-grow', [
        h('p.pointer', {
          onClick: () => this.props.dispatch(actions.forgotPassword()),
          style: {
            fontSize: '14px',
            color: '#60db97',
          },
        }, 'Restore from seed phrase'),
      ]),
    ])
  )
}

UnlockScreen.prototype.componentDidMount = function () {
  document.getElementById('password-box').focus()
}

UnlockScreen.prototype.onSubmit = async function (event) {
  const input = document.getElementById('password-box')
  const password = input.value
  try {
    await this.props.dispatch(actions.tryUnlockMetamask(password))
  } catch (e) {
    log.error(e)
  }
}

UnlockScreen.prototype.onKeyPress = function (event) {
  if (event.key === 'Enter') {
    this.submitPassword(event)
  }
}

UnlockScreen.prototype.submitPassword = async function (event) {
  var element = event.target
  var password = element.value
  // reset input
  element.value = ''
  try {
    await this.props.dispatch(actions.tryUnlockMetamask(password))
  } catch (e) {
    log.error(e)
  }
}
