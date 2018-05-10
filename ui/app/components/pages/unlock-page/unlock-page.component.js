import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from 'material-ui/Button'
import TextField from '../../text-field'

const { ENVIRONMENT_TYPE_POPUP } = require('../../../../../app/scripts/lib/enums')
const { getEnvironmentType } = require('../../../../../app/scripts/lib/util')
const getCaretCoordinates = require('textarea-caret')
const EventEmitter = require('events').EventEmitter
const Mascot = require('../../mascot')
const { DEFAULT_ROUTE, RESTORE_VAULT_ROUTE } = require('../../../routes')

class UnlockPage extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.state = {
      password: '',
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

  tryUnlockMetamask (password) {
    const { tryUnlockMetamask, history } = this.props
    tryUnlockMetamask(password)
      .then(() => history.push(DEFAULT_ROUTE))
      .catch(({ message }) => this.setState({ error: message }))
  }

  handleSubmit (event) {
    event.preventDefault()
    event.stopPropagation()

    const { password } = this.state
    const { tryUnlockMetamask, history } = this.props

    if (password === '') {
      return
    }

    this.setState({ error: null })

    tryUnlockMetamask(password)
      .then(() => history.push(DEFAULT_ROUTE))
      .catch(({ message }) => this.setState({ error: message }))
  }

  handleInputChange ({ target }) {
    this.setState({ password: target.value, error: null })

    // tell mascot to look at page action
    const element = target
    const boundingRect = element.getBoundingClientRect()
    const coordinates = getCaretCoordinates(element, element.selectionEnd)
    this.animationEventEmitter.emit('point', {
      x: boundingRect.left + coordinates.left - element.scrollLeft,
      y: boundingRect.top + coordinates.top - element.scrollTop,
    })
  }

  renderSubmitButton () {
    const style = {
      backgroundColor: '#f7861c',
      color: 'white',
      marginTop: '20px',
      height: '60px',
      fontWeight: '400',
      boxShadow: 'none',
      borderRadius: '4px',
    }

    return (
      <Button
        type="submit"
        style={style}
        disabled={!this.state.password}
        fullWidth
        variant="raised"
        size="large"
        onClick={event => this.handleSubmit(event)}
        disableRipple
      >
        { this.context.t('login') }
      </Button>
    )
  }

  render () {
    const { error } = this.state

    return (
      <div className="unlock-page__container">
        <div className="unlock-page">
          <div className="unlock-page__mascot-container">
            <Mascot
              animationEventEmitter={this.animationEventEmitter}
              width="120"
              height="120"
            />
          </div>
          <h1 className="unlock-page__title">
            { this.context.t('welcomeBack') }
          </h1>
          <div>{ this.context.t('unlockMessage') }</div>
          <form
            className="unlock-page__form"
            onSubmit={event => this.handleSubmit(event)}
          >
            <TextField
              id="password"
              label="Password"
              type="password"
              value={this.state.password}
              onChange={event => this.handleInputChange(event)}
              error={error}
              autoFocus
              margin="normal"
              autoComplete="current-password"
              fullWidth
            />
          </form>
          { this.renderSubmitButton() }
          <div className="unlock-page__links">
            <div
              className="unlock-page__link"
              onClick={() => {
                this.props.markPasswordForgotten()
                this.props.history.push(RESTORE_VAULT_ROUTE)

                if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
                  global.platform.openExtensionInBrowser()
                }
              }}
            >
              { this.context.t('restoreFromSeed') }
            </div>
            <div
              className="unlock-page__link unlock-page__link--import"
              onClick={() => {
                this.props.markPasswordForgotten()
                this.props.history.push(RESTORE_VAULT_ROUTE)

                if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
                  global.platform.openExtensionInBrowser()
                }
              }}
            >
              { this.context.t('importUsingSeed') }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

UnlockPage.propTypes = {
  forgotPassword: PropTypes.func,
  tryUnlockMetamask: PropTypes.func,
  markPasswordForgotten: PropTypes.func,
  history: PropTypes.object,
  isUnlocked: PropTypes.bool,
  t: PropTypes.func,
  useOldInterface: PropTypes.func,
  setNetworkEndpoints: PropTypes.func,
}

export default UnlockPage
