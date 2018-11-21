const inherits = require('util').inherits

const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../../../../ui/app/actions')

module.exports = connect(mapStateToProps)(RevealSeedConfirmation)

inherits(RevealSeedConfirmation, Component)
function RevealSeedConfirmation () {
  Component.call(this)
}

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
  }
}

RevealSeedConfirmation.prototype.render = function () {
  const props = this.props

  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', {
      style: { maxWidth: '420px' },
    }, [

      h('h3.flex-center.section-title', {
        style: {
          background: '#ffffff',
          color: '#333333',
          width: '100%',
          fontSize: '16px',
          padding: 6,
          fontFamily: 'Nunito  Semibold',
        },
      }, [
        h('.page-subtitle', 'Reveal Seed Words'),
      ]),

      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          padding: '30px',
          justifyContent: 'center',
        },
      }, [

        h('.error', 'Do not recover your seed words in a public place! These words can be used to steal all your accounts.'),

        // confirmation
        h('input.large-input', {
          type: 'password',
          id: 'password-box',
          placeholder: 'Enter your password to confirm',
          onKeyPress: this.checkConfirmation.bind(this),
          style: {
            marginTop: '20px',
          },
        }),

        (props.warning) && (
          h('span.error', {
            style: {
              margin: '20px 0',
            },
          }, props.warning.split('-'))
        ),

        props.inProgress && (
          h('span.in-progress-notification', 'Generating Seed...')
        ),

        h('.flex-row.flex-start.flex-right', {
          style: {
            marginTop: 20,
            width: '100%',
          },
        }, [
          // cancel
          h('button.btn-violet', {
            onClick: this.goHome.bind(this),
          }, 'Cancel'),

          // submit
          h('button', {
            style: { marginLeft: '10px' },
            onClick: this.revealSeedWords.bind(this),
          }, 'Ok'),

        ]),
      ]),
    ])
  )
}

RevealSeedConfirmation.prototype.componentDidMount = function () {
  document.getElementById('password-box').focus()
}

RevealSeedConfirmation.prototype.goHome = function () {
  this.props.dispatch(actions.showConfigPage(false))
}

// create vault

RevealSeedConfirmation.prototype.checkConfirmation = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.revealSeedWords()
  }
}

RevealSeedConfirmation.prototype.revealSeedWords = function () {
  var password = document.getElementById('password-box').value
  this.props.dispatch(actions.requestRevealSeed(password))
}
