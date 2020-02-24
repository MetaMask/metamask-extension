<<<<<<< HEAD
const { Component } = require('react')
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const classnames = require('classnames')

const { requestRevealSeedWords } = require('../../store/actions')
const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')
const ExportTextContainer = require('../../components/ui/export-text-container')
=======
import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { requestRevealSeedWords } from '../../store/actions'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import ExportTextContainer from '../../components/ui/export-text-container'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

import Button from '../../components/ui/button'

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN'
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN'

class RevealSeedPage extends Component {
  constructor (props) {
    super(props)

    this.state = {
      screen: PASSWORD_PROMPT_SCREEN,
      password: '',
      seedWords: null,
      error: null,
    }
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
      .then((seedWords) => this.setState({ seedWords, screen: REVEAL_SEED_SCREEN }))
      .catch((error) => this.setState({ error: error.message }))
  }

  renderWarning () {
    return (
      h('.page-container__warning-container', [
        h('img.page-container__warning-icon', {
          src: 'images/warning.svg',
        }),
        h('.page-container__warning-message', [
          h('.page-container__warning-title', [this.context.t('revealSeedWordsWarningTitle')]),
          h('div', [this.context.t('revealSeedWordsWarning')]),
        ]),
      ])
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
<<<<<<< HEAD
      h('form', {
        onSubmit: event => this.handleSubmit(event),
      }, [
        h('label.input-label', {
          htmlFor: 'password-box',
        }, t('enterPasswordContinue')),
        h('.input-group', [
          h('input.form-control', {
            type: 'password',
            placeholder: t('password'),
            id: 'password-box',
            value: this.state.password,
            onChange: event => this.setState({ password: event.target.value }),
            className: classnames({ 'form-control--error': this.state.error }),
          }),
        ]),
        this.state.error && h('.reveal-seed__error', this.state.error),
      ])
=======
      <form onSubmit={(event) => this.handleSubmit(event)}>
        <label className="input-label" htmlFor="password-box">{t('enterPasswordContinue')}</label>
        <div className="input-group">
          <input
            type="password"
            placeholder={t('password')}
            id="password-box"
            value={this.state.password}
            onChange={(event) => this.setState({ password: event.target.value })}
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    )
  }

  renderRevealSeedContent () {
    const { t } = this.context

    return (
<<<<<<< HEAD
      h('div', [
        h('label.reveal-seed__label', t('yourPrivateSeedPhrase')),
        h(ExportTextContainer, {
          text: this.state.seedWords,
          filename: t('metamaskSeedWords'),
        }),
      ])
=======
      <div>
        <label className="reveal-seed__label">{t('yourPrivateSeedPhrase')}</label>
        <ExportTextContainer text={this.state.seedWords} />
      </div>
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    )
  }

  renderFooter () {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptFooter()
      : this.renderRevealSeedFooter()
  }

  renderPasswordPromptFooter () {
    return (
<<<<<<< HEAD
      h('.page-container__footer', [
        h('header', [
          h(Button, {
            type: 'default',
            large: true,
            className: 'page-container__footer-button',
            onClick: () => this.props.history.push(DEFAULT_ROUTE),
          }, this.context.t('cancel')),
          h(Button, {
            type: 'secondary',
            large: true,
            className: 'page-container__footer-button',
            onClick: event => this.handleSubmit(event),
            disabled: this.state.password === '',
          }, this.context.t('next')),
        ]),
      ])
=======
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
            onClick={(event) => this.handleSubmit(event)}
            disabled={this.state.password === ''}
          >
            {this.context.t('next')}
          </Button>
        </header>
      </div>
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    )
  }

  renderRevealSeedFooter () {
    return (
      h('.page-container__footer', [
        h(Button, {
          type: 'default',
          large: true,
          className: 'page-container__footer-button',
          onClick: () => this.props.history.push(DEFAULT_ROUTE),
        }, this.context.t('close')),
      ])
    )
  }

  render () {
    return (
      h('.page-container', [
        h('.page-container__header', [
          h('.page-container__title', this.context.t('revealSeedWordsTitle')),
          h('.page-container__subtitle', this.context.t('revealSeedWordsDescription')),
        ]),
        h('.page-container__content', [
          this.renderWarning(),
          h('.reveal-seed__content', [
            this.renderContent(),
          ]),
        ]),
        this.renderFooter(),
      ])
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

const mapDispatchToProps = (dispatch) => {
  return {
    requestRevealSeedWords: (password) => dispatch(requestRevealSeedWords(password)),
  }
}

export default connect(null, mapDispatchToProps)(RevealSeedPage)
