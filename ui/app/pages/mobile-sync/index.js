const { Component } = require('react')
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const classnames = require('classnames')
const PubNub = require('pubnub')

const { requestRevealSeedWords, fetchInfoToSync } = require('../../store/actions')
const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')
const actions = require('../../store/actions')

const qrCode = require('qrcode-generator')

import Button from '../../components/ui/button'
import LoadingScreen from '../../components/ui/loading-screen'

const PASSWORD_PROMPT_SCREEN = 'PASSWORD_PROMPT_SCREEN'
const REVEAL_SEED_SCREEN = 'REVEAL_SEED_SCREEN'
const KEYS_GENERATION_TIME = 30000

class MobileSyncPage extends Component {
  static propTypes = {
    history: PropTypes.object,
    selectedAddress: PropTypes.string,
    displayWarning: PropTypes.func,
    fetchInfoToSync: PropTypes.func,
    requestRevealSeedWords: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.state = {
      screen: PASSWORD_PROMPT_SCREEN,
      password: '',
      seedWords: null,
      error: null,
      syncing: false,
      completed: false,
      channelName: undefined,
      cipherKey: undefined,
    }

    this.syncing = false
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
        this.startKeysGeneration()
        this.setState({ seedWords, screen: REVEAL_SEED_SCREEN })
      })
      .catch(error => this.setState({ error: error.message }))
  }

  startKeysGeneration () {
    this.handle && clearTimeout(this.handle)
    this.disconnectWebsockets()
    this.generateCipherKeyAndChannelName()
    this.initWebsockets()
    this.handle = setTimeout(() => {
      this.startKeysGeneration()
    }, KEYS_GENERATION_TIME)
  }

  generateCipherKeyAndChannelName () {
    this.cipherKey = `${this.props.selectedAddress.substr(-4)}-${PubNub.generateUUID()}`
    this.channelName = `mm-${PubNub.generateUUID()}`
    this.setState({cipherKey: this.cipherKey, channelName: this.channelName})
  }

  initWithCipherKeyAndChannelName (cipherKey, channelName) {
    this.cipherKey = cipherKey
    this.channelName = channelName
  }

  initWebsockets () {
    // Make sure there are no existing listeners
    this.disconnectWebsockets()

    this.pubnub = new PubNub({
      subscribeKey: process.env.PUBNUB_SUB_KEY,
      publishKey: process.env.PUBNUB_PUB_KEY,
      cipherKey: this.cipherKey,
      ssl: true,
    })

    this.pubnubListener = {
      message: (data) => {
        const {channel, message} = data
        // handle message
        if (channel !== this.channelName || !message) {
          return false
        }

        if (message.event === 'start-sync') {
          this.startSyncing()
        } else if (message.event === 'connection-info') {
          this.handle && clearTimeout(this.handle)
          this.disconnectWebsockets()
          this.initWithCipherKeyAndChannelName(message.cipher, message.channel)
          this.initWebsockets()
        } else if (message.event === 'end-sync') {
          this.disconnectWebsockets()
          this.setState({syncing: false, completed: true})
        }
      },
    }

    this.pubnub.addListener(this.pubnubListener)

    this.pubnub.subscribe({
      channels: [this.channelName],
      withPresence: false,
    })

  }

  disconnectWebsockets () {
    if (this.pubnub && this.pubnubListener) {
      this.pubnub.removeListener(this.pubnubListener)
    }
  }

  // Calculating a PubNub Message Payload Size.
  calculatePayloadSize (channel, message) {
    return encodeURIComponent(
      channel + JSON.stringify(message)
    ).length + 100
  }

  chunkString (str, size) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size)
    }
    return chunks
  }

  notifyError (errorMsg) {
    return new Promise((resolve, reject) => {
      this.pubnub.publish(
        {
          message: {
            event: 'error-sync',
            data: errorMsg,
          },
          channel: this.channelName,
          sendByPost: false, // true to send via post
          storeInHistory: false,
        },
        (status, response) => {
          if (!status.error) {
            resolve()
          } else {
            reject(response)
          }
        })
    })
  }

  async startSyncing () {
    if (this.syncing) return false
    this.syncing = true
    this.setState({syncing: true})

    const { accounts, network, preferences, transactions } = await this.props.fetchInfoToSync()

    const allDataStr = JSON.stringify({
      accounts,
      network,
      preferences,
      transactions,
      udata: {
        pwd: this.state.password,
        seed: this.state.seedWords,
      },
    })

    const chunks = this.chunkString(allDataStr, 17000)
    const totalChunks = chunks.length
    try {
      for (let i = 0; i < totalChunks; i++) {
        await this.sendMessage(chunks[i], i + 1, totalChunks)
      }
    } catch (e) {
      this.props.displayWarning('Sync failed :(')
      this.setState({syncing: false})
      this.syncing = false
      this.notifyError(e.toString())
    }
  }

  sendMessage (data, pkg, count) {
    return new Promise((resolve, reject) => {
      this.pubnub.publish(
        {
          message: {
            event: 'syncing-data',
            data,
            totalPkg: count,
            currentPkg: pkg,
          },
          channel: this.channelName,
          sendByPost: false, // true to send via post
          storeInHistory: false,
        },
        (status, response) => {
          if (!status.error) {
            resolve()
          } else {
            reject(response)
          }
        }
      )
    })
  }


  componentWillUnmount () {
    this.disconnectWebsockets()
  }

  renderWarning (text) {
    return (
      h('.page-container__warning-container', [
        h('.page-container__warning-message', [
          h('div', [text]),
        ]),
      ])
    )
  }

  renderContent () {
    const { t } = this.context

    if (this.state.syncing) {
      return h(LoadingScreen, {loadingMessage: 'Sync in progress'})
    }

    if (this.state.completed) {
      return h('div.reveal-seed__content', {},
        h('label.reveal-seed__label', {
          style: {
            width: '100%',
            textAlign: 'center',
          },
        }, t('syncWithMobileComplete')),
      )
    }

    return this.state.screen === PASSWORD_PROMPT_SCREEN
      ? h('div', {}, [
        this.renderWarning(this.context.t('mobileSyncText')),
        h('.reveal-seed__content', [
          this.renderPasswordPromptContent(),
        ]),
      ])
      : h('div', {}, [
        this.renderWarning(this.context.t('syncWithMobileBeCareful')),
        h('.reveal-seed__content', [ this.renderRevealSeedContent() ]),
      ])
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
    qrImage.addData(`metamask-sync:${this.state.channelName}|@|${this.state.cipherKey}`)
    qrImage.make()

    const { t } = this.context
    return (
      h('div', [
        h('label.reveal-seed__label', {
          style: {
            width: '100%',
            textAlign: 'center',
          },
        }, t('syncWithMobileScanThisCode')),
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
      h('div.new-account-import-form__buttons', {style: {padding: 30}}, [

        h(Button, {
          type: 'default',
          large: true,
          className: 'new-account-create-form__button',
          onClick: () => this.props.history.push(DEFAULT_ROUTE),
        }, this.context.t('cancel')),

        h(Button, {
          type: 'secondary',
          large: true,
          className: 'new-account-create-form__button',
          onClick: event => this.handleSubmit(event),
          disabled: this.state.password === '',
        }, this.context.t('next')),
      ])
    )
  }

  renderRevealSeedFooter () {
    return (
      h('.page-container__footer', {style: {padding: 30}}, [
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
          this.state.screen === PASSWORD_PROMPT_SCREEN ? h('.page-container__subtitle', this.context.t('syncWithMobileDesc')) : null,
          this.state.screen === PASSWORD_PROMPT_SCREEN ? h('.page-container__subtitle', this.context.t('syncWithMobileDescNewUsers')) : null,
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
  fetchInfoToSync: PropTypes.func,
  history: PropTypes.object,
}

MobileSyncPage.contextTypes = {
  t: PropTypes.func,
}

const mapDispatchToProps = dispatch => {
  return {
    requestRevealSeedWords: password => dispatch(requestRevealSeedWords(password)),
    fetchInfoToSync: () => dispatch(fetchInfoToSync()),
    displayWarning: (message) => dispatch(actions.displayWarning(message || null)),
  }

}

const mapStateToProps = state => {
  const {
    metamask: { selectedAddress },
  } = state

  return {
    selectedAddress,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(MobileSyncPage)
