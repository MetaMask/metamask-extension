import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import TextField from '../../text-field'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import getCaretCoordinates from 'textarea-caret'
import { EventEmitter } from 'events'
import Mascot from '../../mascot'
import { DEFAULT_ROUTE, RESTORE_VAULT_ROUTE } from '../../../routes'


export default class UnlockPage extends Component {

  static propTypes = {
    forgotPassword: PropTypes.func,
    tryUnlockMetamask: PropTypes.func,
    markPasswordForgotten: PropTypes.func,
    history: PropTypes.object,
    isUnlocked: PropTypes.bool,
    t: PropTypes.func,
    useOldInterface: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    password: '',
    error: null,
  };

  constructor (props) {
    super(props)

    this.animationEventEmitter = new EventEmitter()
  }

  componentWillMount () {
    const { isUnlocked, history } = this.props

    if (isUnlocked) {
      history.push(DEFAULT_ROUTE)
    }
  }

  async handleSubmit (event) {
    event.preventDefault()
    event.stopPropagation()

    const { password } = this.state
    const { tryUnlockMetamask, history } = this.props

    if (password === '') {
      return
    }

    this.setState({ error: null })

    try {
      await tryUnlockMetamask(password)
    } catch ({ message }) {
      this.setState({ error: message })
      return
    }

    history.push(DEFAULT_ROUTE)
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

  handleLinkClick () {
    const { markPasswordForgotten, history } = this.props

    markPasswordForgotten()
    history.push(RESTORE_VAULT_ROUTE)

    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser()
    }
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
    const { error, password } = this.state

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
              label={this.context.t('password')}
              type="password"
              value={password}
              onChange={this.handleInputChange.bind(this)}
              error={error}
              autoFocus
              autoComplete="current-password"
              material
              fullWidth
            />
          </form>
          { this.renderSubmitButton() }
          <div className="unlock-page__links">
            <div
              className="unlock-page__link"
              onClick={this.handleLinkClick.bind(this)}
            >
              { this.context.t('restoreFromSeed') }
            </div>
            <div
              className="unlock-page__link unlock-page__link--import"
              onClick={this.handleLinkClick.bind(this)}
            >
              { this.context.t('importUsingSeed') }
            </div>
          </div>
        </div>
      </div>
    )
  }
}
