import React, { Component } from 'react'
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const classnames = require('classnames')

const { requestRevealSeedWords } = require('../../store/actions')
const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')
const ExportTextContainer = require('../../components/ui/export-text-container')

import Button from '../../components/ui/button'

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN'
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN'

class RevealSeedPage extends Component {
  state = {
    screen: PASSWORD_PROMPT_SCREEN,
    password: '',
    seedWords: null,
    error: null,
  }

  componentDidMount () {
    const passwordBox = document.getElementById('password-box')
    if (passwordBox) {
      passwordBox.focus()
    }
  }

  handleSubmit (event) {
    event.preventDefault()
    this.setState({ seedWords: null, error: null })
    this.props.requestRevealSeedWords(this.state.password)
      .then(seedWords => this.setState({ seedWords, screen: REVEAL_SEED_SCREEN }))
      .catch(error => this.setState({ error: error.message }))
  }

  renderWarning () {
    return (
      <div className="page-container__warning-container">
        <img className="page-container__warning-icon" src="images/warning.svg" alt="" />
        <div className="page-container__warning-message">
          <div className="page-container__warning-title">
            {this.context.t('revealSeedWordsWarningTitle')}
          </div>
          <div>
            {this.context.t('revealSeedWordsWarning')}
          </div>
        </div>
      </div>
    )
  }

  renderContent () {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptContent()
      : this.renderRevealSeedContent()
  }

  renderPasswordPromptContent () {
    const { t } = this.context

    return (
      <form onSubmit={event => this.handleSubmit(event)}>
        <label className="input-label" htmlFor="password-box">{t('enterPasswordContinue')}</label>
        <div className="input-group">
          <input
            type="password"
            placeholder={t('password')}
            id="password-box"
            value={this.state.password}
            onChange={event => this.setState({ password: event.target.value })}
            className={classnames('form-control', { 'form-control--error': this.state.error })}
          />
        </div>
        {
          this.state.error && (
            <div className="reveal-seed__error">
              {this.state.error}
            </div>
          )}
      </form>
    )
  }

  renderRevealSeedContent () {
    const { t } = this.context

    return (
      <div>
        <label className="reveal-seed__label">{t('yourPrivateSeedPhrase')}</label>
        <ExportTextContainer text={this.state.seedWords} filename={t('metamaskSeedWords')} />
      </div>
    )
  }

  renderFooter () {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptFooter()
      : this.renderRevealSeedFooter()
  }

  renderPasswordPromptFooter () {
    return (
      <div className="page-container__footer">
        <header>
          <Button
            type="default"
            large
            className="page-container__footer-button"
            onClick={() => this.props.history.push(DEFAULT_ROUTE)}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="secondary"
            large
            className="page-container__footer-button"
            onClick={event => this.handleSubmit(event)}
            disabled={this.state.password === ''}
          >
            {this.context.t('next')}
          </Button>
        </header>
      </div>
    )
  }

  renderRevealSeedFooter () {
    return (
      <div className="page-container__footer">
        <Button
          type="default"
          large
          className="page-container__footer-button"
          onClick={() => this.props.history.push(DEFAULT_ROUTE)}
        >
          {this.context.t('close')}
        </Button>
      </div>
    )
  }

  render () {
    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('revealSeedWordsTitle')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('revealSeedWordsDescription')}
          </div>
        </div>
        <div className="page-container__content">
          {this.renderWarning()}
          <div className="reveal-seed__content">
            {this.renderContent()}
          </div>
        </div>
        {this.renderFooter()}
      </div>
    )
  }
}

RevealSeedPage.propTypes = {
  requestRevealSeedWords: PropTypes.func,
  history: PropTypes.object,
}

RevealSeedPage.contextTypes = {
  t: PropTypes.func,
}

const mapDispatchToProps = dispatch => {
  return {
    requestRevealSeedWords: password => dispatch(requestRevealSeedWords(password)),
  }
}

module.exports = connect(null, mapDispatchToProps)(RevealSeedPage)
