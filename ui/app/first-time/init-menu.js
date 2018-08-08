const { EventEmitter } = require('events')
const { Component } = require('react')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const Mascot = require('../components/mascot')
const actions = require('../actions')
const Tooltip = require('../components/tooltip')
const getCaretCoordinates = require('textarea-caret')
const { RESTORE_VAULT_ROUTE, DEFAULT_ROUTE } = require('../routes')
const { getEnvironmentType } = require('../../../app/scripts/lib/util')
const { ENVIRONMENT_TYPE_POPUP } = require('../../../app/scripts/lib/enums')

class InitializeMenuScreen extends Component {
  constructor (props) {
    super(props)

    this.animationEventEmitter = new EventEmitter()
    this.state = {
      warning: null,
    }
  }

  componentWillMount () {
    const { isInitialized, isUnlocked, history } = this.props
    if (isInitialized || isUnlocked) {
      history.push(DEFAULT_ROUTE)
    }
  }

  componentDidMount () {
    document.getElementById('password-box').focus()
  }

  render () {
    const { warning } = this.state

    return (
      h('.initialize-screen.flex-column.flex-center', [

        h(Mascot, {
          animationEventEmitter: this.animationEventEmitter,
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

        h('span.error.in-progress-notification', warning),

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
            onClick: () => this.showRestoreVault(),
            style: {
              fontSize: '0.8em',
              color: 'rgb(247, 134, 28)',
              textDecoration: 'underline',
            },
          }, this.context.t('importDen')),
        ]),

        h('.flex-row.flex-center.flex-grow', [
          h('p.pointer', {
            onClick: this.showOldUI.bind(this),
            style: {
              fontSize: '0.8em',
              color: '#aeaeae',
              textDecoration: 'underline',
              marginTop: '32px',
            },
          }, this.context.t('classicInterface')),
        ]),

      ])
    )
  }

  createVaultOnEnter (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewVaultAndKeychain()
    }
  }

  createNewVaultAndKeychain () {
    const { history } = this.props
    var passwordBox = document.getElementById('password-box')
    var password = passwordBox.value
    var passwordConfirmBox = document.getElementById('password-box-confirm')
    var passwordConfirm = passwordConfirmBox.value

    this.setState({ warning: null })

    if (password.length < 8) {
      this.setState({ warning: this.context.t('passwordShort') })
      return
    }

    if (password !== passwordConfirm) {
      this.setState({ warning: this.context.t('passwordMismatch') })
      return
    }

    this.props.createNewVaultAndKeychain(password)
      .then(() => history.push(DEFAULT_ROUTE))
  }

  inputChanged (event) {
    // tell mascot to look at page action
    var element = event.target
    var boundingRect = element.getBoundingClientRect()
    var coordinates = getCaretCoordinates(element, element.selectionEnd)
    this.animationEventEmitter.emit('point', {
      x: boundingRect.left + coordinates.left - element.scrollLeft,
      y: boundingRect.top + coordinates.top - element.scrollTop,
    })
  }

  showRestoreVault () {
    this.props.markPasswordForgotten()
    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser()
    }

    this.props.history.push(RESTORE_VAULT_ROUTE)
  }

  showOldUI () {
    this.props.dispatch(actions.setFeatureFlag('betaUI', false, 'OLD_UI_NOTIFICATION_MODAL'))
  }
}

InitializeMenuScreen.propTypes = {
  history: PropTypes.object,
  isInitialized: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  createNewVaultAndKeychain: PropTypes.func,
  markPasswordForgotten: PropTypes.func,
  dispatch: PropTypes.func,
}

InitializeMenuScreen.contextTypes = {
  t: PropTypes.func,
}

const mapStateToProps = state => {
  const { metamask: { isInitialized, isUnlocked } } = state

  return {
    isInitialized,
    isUnlocked,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createNewVaultAndKeychain: password => dispatch(actions.createNewVaultAndKeychain(password)),
    markPasswordForgotten: () => dispatch(actions.markPasswordForgotten()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(InitializeMenuScreen)
