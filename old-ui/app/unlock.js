const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const getCaretCoordinates = require('textarea-caret')
const EventEmitter = require('events').EventEmitter

const Mascot = require('./components/mascot')

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
        }, 'MetaMask'),

        h('input.large-input', {
          type: 'password',
          id: 'password-box',
          placeholder: 'enter password',
          style: {

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
        }, 'Log In'),
      ]),

      h('.flex-row.flex-center.flex-grow', [
        h('p.pointer', {
          onClick: () => this.props.dispatch(actions.forgotPassword()),
          style: {
            fontSize: '0.8em',
            color: 'rgb(247, 134, 28)',
            textDecoration: 'underline',
          },
        }, 'Restore from seed phrase'),
      ]),
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
