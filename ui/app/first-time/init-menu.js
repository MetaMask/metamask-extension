const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const Mascot = require('../components/mascot')
const actions = require('../actions')
const Tooltip = require('../components/tooltip')
const getCaretCoordinates = require('textarea-caret')

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
  }
}

InitializeMenuScreen.prototype.render = function () {
  var state = this.props

  switch (state.currentView.name) {

    default:
      return this.renderMenu()

  }
}

// InitializeMenuScreen.prototype.componentDidMount = function(){
//   document.getElementById('password-box').focus()
// }

InitializeMenuScreen.prototype.renderMenu = function () {
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      h(Mascot, {
        animationEventEmitter: this.animationEventEmitter,
      }),

      h('h1', {
        style: {
          fontSize: '1.7em',
          textTransform: 'uppercase',
          color: '#7F8082',
          marginBottom: 20,
        },
      }, 'MetaMask'),


      h('div', [
        h('h3', {
          style: {
            fontSize: '0.8em',
            color: '#7F8082',
            display: 'inline',
          },
        }, 'Encrypt your new DEN'),

        h(Tooltip, {
          title: 'Your DEN is your password-encrypted storage within MetaMask.',
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

      // password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box',
        placeholder: 'New Password (min 8 chars)',
        onInput: this.inputChanged.bind(this),
        style: {
          width: 260,
          marginTop: 12,
          textAlign: 'center',
        },
      }),

      // confirm password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box-confirm',
        placeholder: 'Confirm Password',
        onKeyPress: this.createVaultOnEnter.bind(this),
        onInput: this.inputChanged.bind(this),
        style: {
          width: 260,
          marginTop: 16,
          textAlign: 'center',
        },
      }),


      h('button.primary', {
        onClick: this.createNewVault.bind(this),
        style: {
          margin: 12,
        },
      }, 'Create'),

      /*
      h('.flex-row.flex-center.flex-grow', [
        h('p.pointer', {
          style: {
            fontSize: '0.8em',
            color: 'rgb(247, 134, 28)',
            textDecoration: 'underline',
          },
        }, 'I already have a DEN that I would like to import'),
      ]),
      */

    ])
  )
}

InitializeMenuScreen.prototype.createVaultOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewVault()
  }
}

InitializeMenuScreen.prototype.createNewVault = function () {
  var passwordBox = document.getElementById('password-box')
  var password = passwordBox.value
  var passwordConfirmBox = document.getElementById('password-box-confirm')
  var passwordConfirm = passwordConfirmBox.value
  // var entropy = document.getElementById('entropy-text-entry').value

  if (password.length < 8) {
    this.warning = 'password not long enough'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (password !== passwordConfirm) {
    this.warning = 'passwords don\'t match'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }

  this.props.dispatch(actions.createNewVault(password, ''/* entropy*/))
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
