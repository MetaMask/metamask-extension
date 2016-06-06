const inherits = require('util').inherits

const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../actions')

module.exports = connect(mapStateToProps)(RevealSeedConfirmatoin)


inherits(RevealSeedConfirmatoin, Component)
function RevealSeedConfirmatoin() {
  Component.call(this)
}

function mapStateToProps(state) {
  return {
    warning: state.appState.warning,
  }
}

RevealSeedConfirmatoin.prototype.confirmationPhrase = 'I understand'

RevealSeedConfirmatoin.prototype.render = function() {
  const props = this.props
  const state = this.state

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
        'Reveal Seed Words',
      ]),

      h('.div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          justifyContent: 'center',
        }
      }, [

        h('h4', 'Do not recover your seed words in a public place! These words can be used to steal all your accounts.'),

        // confirmation
        h('input.large-input.letter-spacey', {
          type: 'password',
          id: 'password-box',
          placeholder: 'Enter your password to confirm',
          onKeyPress: this.checkConfirmation.bind(this),
          style: {
            width: 260,
            marginTop: '12px',
          },
        }),

        h(`h4${state && state.confirmationWrong ? '.error' : ''}`, {
          style: {
            marginTop: '12px',
          }
        }, `Enter the phrase "I understand" to proceed.`),

        // confirm confirmation
        h('input.large-input.letter-spacey', {
          type: 'text',
          id: 'confirm-box',
          placeholder: this.confirmationPhrase,
          onKeyPress: this.checkConfirmation.bind(this),
          style: {
            width: 260,
            marginTop: 16,
          },
        }),

        h('.flex-row.flex-space-between', {
          style: {
            marginTop: 30,
            width: '50%',
          },
        }, [
// cancel
          h('button.primary', {
            onClick: this.goHome.bind(this),
          }, 'CANCEL'),

          // submit
          h('button.primary', {
            onClick: this.revealSeedWords.bind(this),
          }, 'OK'),

        ]),

        (props.warning) && (
          h('span.error', {
            style: {
              margin: '20px',
            }
          }, props.warning.split('-'))
        ),

        props.inProgress && (
          h('span.in-progress-notification', 'Generating Seed...')
        ),
      ]),
    ])
  )
}

RevealSeedConfirmatoin.prototype.componentDidMount = function(){
  document.getElementById('password-box').focus()
}

RevealSeedConfirmatoin.prototype.goHome = function() {
  this.props.dispatch(actions.showConfigPage(false))
}

// create vault

RevealSeedConfirmatoin.prototype.checkConfirmation = function(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.revealSeedWords()
  }
}

RevealSeedConfirmatoin.prototype.revealSeedWords = function(){
  this.setState({ confirmationWrong: false })

  const confirmBox = document.getElementById('confirm-box')
  const confirmation = confirmBox.value
  if (confirmation !== this.confirmationPhrase) {
    confirmBox.value = ''
    return this.setState({ confirmationWrong: true })
  }

  var password = document.getElementById('password-box').value
  this.props.dispatch(actions.requestRevealSeed(password))
}
