const { Component } = require('react')
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const classnames = require('classnames')
const PubNub = require('pubnub')

const { requestRevealSeedWords } = require('../../../actions')
const { DEFAULT_ROUTE } = require('../../../routes')
const qrCode = require('qrcode-generator')

import Button from '../../button'

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN'
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN'

class MobileSyncPage extends Component {
  constructor (props) {
    super(props)

    this.state = {
      screen: PASSWORD_PROMPT_SCREEN,
      password: '',
      seedWords: null,
      error: null,
    }

    this.channelName = 'mm-sync-1'
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
      .then(seedWords => {
        this.setState({ seedWords, screen: REVEAL_SEED_SCREEN })
        this.initWebsockets()
      })
      .catch(error => this.setState({ error: error.message }))
  }

  initWebsockets () {
    this.pubnub = new PubNub({
      subscribeKey: 'sub-c-30b2ba04-c37e-11e8-bd78-d63445bede87',
      publishKey: 'pub-c-d40e77d5-5cd3-4ca2-82eb-792a1f4573db',
      ssl: true,
    })

    this.pubnubListener = this.pubnub.addListener({
      message: ({channel, message}) => {
        console.log('PUBNUB: ', channel, message)
        // handle message
        if (channel !== this.channelName) {
          return false
        }

        if (message.event === 'start-sync') {
          // "who" needs to be included in the QR code,
          // should be some random number
          if (message.data.who === 'me') {
            this.startSyncing()
          }
        } else if (message.event === 'end-sync') {
            this.disconnectWebsockets()
        }
      },
    })

    this.pubnub.subscribe({
      channels: [this.channelName],
    })

  }

  disconnectWebsockets () {
    if (this.pubnub && this.pubnubListener) {
      this.pubnub.disconnect(this.pubnubListener)
    }
  }

  startSyncing () {
    this.pubnub.publish(
      {
          message: {
              'event': 'syncing',
              'data': { 'hello': 'from the extension' },
          },
          channel: this.channelName,
          sendByPost: false, // true to send via post
          storeInHistory: false,
      },
      (status, response) => {
          console.log('PUBNUB: got response from syncing', status, response)
          // handle status, response
      }
    )
  }

  componentWillUnmount () {
    this.disconnectWebsockets()
  }

  renderWarning () {
    return (
      h('.page-container__warning-container', [
       h('.page-container__warning-message', [
          h('div', [this.context.t('mobileSyncText')]),
        ]),
      ])
    )
  }

  renderContent () {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? h('div', {}, [
        this.renderWarning(),
        h('.reveal-seed__content', [
          this.renderPasswordPromptContent(),
        ]),
      ])
      : h('.reveal-seed__content', [ this.renderRevealSeedContent() ])
  }

  renderPasswordPromptContent () {
    const { t } = this.context

    return (
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
    )
  }

  renderRevealSeedContent () {

    const qrImage = qrCode(0, 'M')
    qrImage.addData(`${this.channelName}|${this.state.seedWords}`)
    qrImage.make()

    const { t } = this.context
    return (
      h('div', [
        h('label.reveal-seed__label', t('syncWithMobileScanThisCode')),
        h('.div.qr-wrapper', {
          style: {
            display: 'flex',
            justifyContent: 'center',
          },
          dangerouslySetInnerHTML: {
            __html: qrImage.createTableTag(4),
          },
        }),
      ])
    )
  }

  renderFooter () {
    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? this.renderPasswordPromptFooter()
      : this.renderRevealSeedFooter()
  }

  renderPasswordPromptFooter () {
    return (
      h('.page-container__footer', [
        h(Button, {
          type: 'default',
          large: true,
          className: 'page-container__footer-button',
          onClick: () => this.props.history.push(DEFAULT_ROUTE),
        }, this.context.t('cancel')),
        h(Button, {
          type: 'primary',
          large: true,
          className: 'page-container__footer-button',
          onClick: event => this.handleSubmit(event),
          disabled: this.state.password === '',
        }, this.context.t('next')),
      ])
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
          h('.page-container__title', this.context.t('syncWithMobileTitle')),
          h('.page-container__subtitle', this.context.t('syncWithMobileDesc')),
          h('.page-container__subtitle', this.context.t('syncWithMobileDescNewUsers')),
        ]),
        h('.page-container__content', [
            this.renderContent(),
        ]),
        this.renderFooter(),
      ])
    )
  }
}

MobileSyncPage.propTypes = {
  requestRevealSeedWords: PropTypes.func,
  history: PropTypes.object,
}

MobileSyncPage.contextTypes = {
  t: PropTypes.func,
}

const mapDispatchToProps = dispatch => {
  return {
    requestRevealSeedWords: password => dispatch(requestRevealSeedWords(password)),
  }
}

module.exports = connect(null, mapDispatchToProps)(MobileSyncPage)
