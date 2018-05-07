const { Component } = require('react')
const PropTypes = require('prop-types')
const connect = require('../../metamask-connect')
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const {
  tryUnlockMetamask,
  forgotPassword,
  markPasswordForgotten,
  setNetworkEndpoints,
  setFeatureFlag,
} = require('../../actions')
const { ENVIRONMENT_TYPE_POPUP } = require('../../../../app/scripts/lib/enums')
const { getEnvironmentType } = require('../../../../app/scripts/lib/util')
const getCaretCoordinates = require('textarea-caret')
const EventEmitter = require('events').EventEmitter
const Mascot = require('../mascot')
const { OLD_UI_NETWORK_TYPE } = require('../../../../app/scripts/controllers/network/enums')
const { DEFAULT_ROUTE, RESTORE_VAULT_ROUTE } = require('../../routes')

class UnlockScreen extends Component {
  constructor (props) {
    super(props)

    this.state = {
      error: null,
    }

    this.animationEventEmitter = new EventEmitter()
  }

  componentWillMount () {
    const { isUnlocked, history } = this.props

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE)
    }
  }

  componentDidMount () {
    const passwordBox = document.getElementById('password-box')

    if (passwordBox) {
      passwordBox.focus()
    }
  }

  tryUnlockMetamask (password) {
    const { tryUnlockMetamask, history } = this.props
    tryUnlockMetamask(password)
      .then(() => history.push(DEFAULT_ROUTE))
      .catch(({ message }) => this.setState({ error: message }))
  }

  onSubmit (event) {
    const input = document.getElementById('password-box')
    const password = input.value
    this.tryUnlockMetamask(password)
  }

  onKeyPress (event) {
    if (event.key === 'Enter') {
      this.submitPassword(event)
    }
  }

  submitPassword (event) {
    var element = event.target
    var password = element.value
    // reset input
    element.value = ''
    this.tryUnlockMetamask(password)
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

  render () {
    const { error } = this.state
    return (
      h('.unlock-screen', [

        h(Mascot, {
          animationEventEmitter: this.animationEventEmitter,
        }),

        h('h1', {
          style: {
            fontSize: '1.4em',
            textTransform: 'uppercase',
            color: '#7F8082',
          },
        }, this.props.t('appName')),

        h('input.large-input', {
          type: 'password',
          id: 'password-box',
          placeholder: 'enter password',
          style: {
            background: 'white',
          },
          onKeyPress: this.onKeyPress.bind(this),
          onInput: this.inputChanged.bind(this),
        }),

        h('.error', {
          style: {
            display: error ? 'block' : 'none',
            padding: '0 20px',
            textAlign: 'center',
          },
        }, error),

        h('button.primary.cursor-pointer', {
          onClick: this.onSubmit.bind(this),
          style: {
            margin: 10,
          },
        }, this.props.t('login')),

        h('p.pointer', {
          onClick: () => {
            this.props.markPasswordForgotten()
            this.props.history.push(RESTORE_VAULT_ROUTE)

            if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
              global.platform.openExtensionInBrowser()
            }
          },
          style: {
            fontSize: '0.8em',
            color: 'rgb(247, 134, 28)',
            textDecoration: 'underline',
          },
        }, this.props.t('restoreFromSeed')),

        h('p.pointer', {
          onClick: () => {
            this.props.useOldInterface()
              .then(() => this.props.setNetworkEndpoints(OLD_UI_NETWORK_TYPE))
          },
          style: {
            fontSize: '0.8em',
            color: '#aeaeae',
            textDecoration: 'underline',
            marginTop: '32px',
          },
        }, this.props.t('classicInterface')),
      ])
    )
  }
}

UnlockScreen.propTypes = {
  forgotPassword: PropTypes.func,
  tryUnlockMetamask: PropTypes.func,
  markPasswordForgotten: PropTypes.func,
  history: PropTypes.object,
  isUnlocked: PropTypes.bool,
  t: PropTypes.func,
  useOldInterface: PropTypes.func,
  setNetworkEndpoints: PropTypes.func,
}

const mapStateToProps = state => {
  const { metamask: { isUnlocked } } = state
  return {
    isUnlocked,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    forgotPassword: () => dispatch(forgotPassword()),
    tryUnlockMetamask: password => dispatch(tryUnlockMetamask(password)),
    markPasswordForgotten: () => dispatch(markPasswordForgotten()),
    useOldInterface: () => dispatch(setFeatureFlag('betaUI', false, 'OLD_UI_NOTIFICATION_MODAL')),
    setNetworkEndpoints: type => dispatch(setNetworkEndpoints(type)),
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(UnlockScreen)
