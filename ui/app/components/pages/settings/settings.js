const { Component } = require('react')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../actions')
const infuraCurrencies = require('../../../infura-conversion.json')
const validUrl = require('valid-url')
const { exportAsFile } = require('../../../util')
const SimpleDropdown = require('../../dropdowns/simple-dropdown')
const ToggleButton = require('react-toggle-button')
const { REVEAL_SEED_ROUTE } = require('../../../routes')
const locales = require('../../../../../app/_locales/index.json')
const { OLD_UI_NETWORK_TYPE } = require('../../../../../app/scripts/controllers/network/enums')

const getInfuraCurrencyOptions = () => {
  const sortedCurrencies = infuraCurrencies.objects.sort((a, b) => {
    return a.quote.name.toLocaleLowerCase().localeCompare(b.quote.name.toLocaleLowerCase())
  })

  return sortedCurrencies.map(({ quote: { code, name } }) => {
    return {
      displayValue: `${code.toUpperCase()} - ${name}`,
      key: code,
      value: code,
    }
  })
}

const getLocaleOptions = () => {
  return locales.map((locale) => {
    return {
      displayValue: `${locale.name}`,
      key: locale.code,
      value: locale.code,
    }
  })
}

class Settings extends Component {
  constructor (props) {
    super(props)

    this.state = {
      newRpc: '',
    }
  }

  renderBlockieOptIn () {
    const { metamask: { useBlockie }, setUseBlockie } = this.props

    return h('div.settings__content-row', [
      h('div.settings__content-item', [
        h('span', this.context.t('blockiesIdenticon')),
      ]),
      h('div.settings__content-item', [
        h('div.settings__content-item-col', [
          h(ToggleButton, {
            value: useBlockie,
            onToggle: (value) => setUseBlockie(!value),
            activeLabel: '',
            inactiveLabel: '',
          }),
        ]),
      ]),
    ])
  }

  renderCurrentConversion () {
    const { metamask: { currentCurrency, conversionDate }, setCurrentCurrency } = this.props

    return h('div.settings__content-row', [
      h('div.settings__content-item', [
        h('span', this.context.t('currentConversion')),
        h('span.settings__content-description', `Updated ${Date(conversionDate)}`),
      ]),
      h('div.settings__content-item', [
        h('div.settings__content-item-col', [
          h(SimpleDropdown, {
            placeholder: this.context.t('selectCurrency'),
            options: getInfuraCurrencyOptions(),
            selectedOption: currentCurrency,
            onSelect: newCurrency => setCurrentCurrency(newCurrency),
          }),
        ]),
      ]),
    ])
  }

  renderCurrentLocale () {
    const { updateCurrentLocale, currentLocale } = this.props
    const currentLocaleMeta = locales.find(locale => locale.code === currentLocale)
    const currentLocaleName = currentLocaleMeta ? currentLocaleMeta.name : ''

    return h('div.settings__content-row', [
      h('div.settings__content-item', [
        h('span', 'Current Language'),
        h('span.settings__content-description', `${currentLocaleName}`),
      ]),
      h('div.settings__content-item', [
        h('div.settings__content-item-col', [
          h(SimpleDropdown, {
            placeholder: 'Select Locale',
            options: getLocaleOptions(),
            selectedOption: currentLocale,
            onSelect: async (newLocale) => {
              updateCurrentLocale(newLocale)
            },
          }),
        ]),
      ]),
    ])
  }

  renderCurrentProvider () {
    const { metamask: { provider = {} } } = this.props
    let title, value, color

    switch (provider.type) {

      case 'mainnet':
        title = this.context.t('currentNetwork')
        value = this.context.t('mainnet')
        color = '#038789'
        break

      case 'ropsten':
        title = this.context.t('currentNetwork')
        value = this.context.t('ropsten')
        color = '#e91550'
        break

      case 'kovan':
        title = this.context.t('currentNetwork')
        value = this.context.t('kovan')
        color = '#690496'
        break

      case 'rinkeby':
        title = this.context.t('currentNetwork')
        value = this.context.t('rinkeby')
        color = '#ebb33f'
        break

      default:
        title = this.context.t('currentRpc')
        value = provider.rpcTarget
    }

    return h('div.settings__content-row', [
      h('div.settings__content-item', title),
      h('div.settings__content-item', [
        h('div.settings__content-item-col', [
          h('div.settings__provider-wrapper', [
            h('div.settings__provider-icon', { style: { background: color } }),
            h('div', value),
          ]),
        ]),
      ]),
    ])
  }

  renderNewRpcUrl () {
    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', [
          h('span', this.context.t('newRPC')),
        ]),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('input.settings__input', {
              placeholder: this.context.t('newRPC'),
              onChange: event => this.setState({ newRpc: event.target.value }),
              onKeyPress: event => {
                if (event.key === 'Enter') {
                  this.validateRpc(this.state.newRpc)
                }
              },
            }),
            h('div.settings__rpc-save-button', {
              onClick: event => {
                event.preventDefault()
                this.validateRpc(this.state.newRpc)
              },
            }, this.context.t('save')),
          ]),
        ]),
      ])
    )
  }

  validateRpc (newRpc) {
    const { setRpcTarget, displayWarning } = this.props

    if (validUrl.isWebUri(newRpc)) {
      setRpcTarget(newRpc)
    } else {
      const appendedRpc = `http://${newRpc}`

      if (validUrl.isWebUri(appendedRpc)) {
        displayWarning(this.context.t('uriErrorMsg'))
      } else {
        displayWarning(this.context.t('invalidRPC'))
      }
    }
  }

  renderStateLogs () {
    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', [
          h('div', this.context.t('stateLogs')),
          h(
            'div.settings__content-description',
            this.context.t('stateLogsDescription')
          ),
        ]),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('button.btn-primary--lg.settings__button', {
              onClick (event) {
                window.logStateString((err, result) => {
                  if (err) {
                    this.state.dispatch(actions.displayWarning(this.context.t('stateLogError')))
                  } else {
                    exportAsFile('MetaMask State Logs.json', result)
                  }
                })
              },
            }, this.context.t('downloadStateLogs')),
          ]),
        ]),
      ])
    )
  }

  renderSeedWords () {
    const { history } = this.props

    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', this.context.t('revealSeedWords')),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('button.btn-primary--lg.settings__button--red', {
              onClick: event => {
                event.preventDefault()
                history.push(REVEAL_SEED_ROUTE)
              },
            }, this.context.t('revealSeedWords')),
          ]),
        ]),
      ])
    )
  }

  renderOldUI () {
    const { setFeatureFlagToBeta } = this.props

    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', this.context.t('useOldUI')),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('button.btn-primary--lg.settings__button--orange', {
              onClick (event) {
                event.preventDefault()
                setFeatureFlagToBeta()
              },
            }, this.context.t('useOldUI')),
          ]),
        ]),
      ])
    )
  }

  renderResetAccount () {
    const { showResetAccountConfirmationModal } = this.props

    return h('div.settings__content-row', [
      h('div.settings__content-item', this.context.t('resetAccount')),
      h('div.settings__content-item', [
        h('div.settings__content-item-col', [
          h('button.btn-primary--lg.settings__button--orange', {
            onClick (event) {
              event.preventDefault()
              showResetAccountConfirmationModal()
            },
          }, this.context.t('resetAccount')),
        ]),
      ]),
    ])
  }

  render () {
    const { warning, isMascara } = this.props

    return (
      h('div.settings__content', [
        warning && h('div.settings__error', warning),
        this.renderCurrentConversion(),
        this.renderCurrentLocale(),
        // this.renderCurrentProvider(),
        this.renderNewRpcUrl(),
        this.renderStateLogs(),
        this.renderSeedWords(),
        !isMascara && this.renderOldUI(),
        this.renderResetAccount(),
        this.renderBlockieOptIn(),
      ])
    )
  }
}

Settings.propTypes = {
  metamask: PropTypes.object,
  setUseBlockie: PropTypes.func,
  setCurrentCurrency: PropTypes.func,
  setRpcTarget: PropTypes.func,
  displayWarning: PropTypes.func,
  revealSeedConfirmation: PropTypes.func,
  setFeatureFlagToBeta: PropTypes.func,
  showResetAccountConfirmationModal: PropTypes.func,
  warning: PropTypes.string,
  history: PropTypes.object,
  isMascara: PropTypes.bool,
  updateCurrentLocale: PropTypes.func,
  currentLocale: PropTypes.string,
  t: PropTypes.func,
}

const mapStateToProps = state => {
  return {
    metamask: state.metamask,
    warning: state.appState.warning,
    isMascara: state.metamask.isMascara,
    currentLocale: state.metamask.currentLocale,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setCurrentCurrency: currency => dispatch(actions.setCurrentCurrency(currency)),
    setRpcTarget: newRpc => dispatch(actions.setRpcTarget(newRpc)),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    revealSeedConfirmation: () => dispatch(actions.revealSeedConfirmation()),
    setUseBlockie: value => dispatch(actions.setUseBlockie(value)),
    updateCurrentLocale: key => dispatch(actions.updateCurrentLocale(key)),
    setFeatureFlagToBeta: () => {
      return dispatch(actions.setFeatureFlag('betaUI', false, 'OLD_UI_NOTIFICATION_MODAL'))
        .then(() => dispatch(actions.setNetworkEndpoints(OLD_UI_NETWORK_TYPE)))
    },
    showResetAccountConfirmationModal: () => {
      return dispatch(actions.showModal({ name: 'CONFIRM_RESET_ACCOUNT' }))
    },
  }
}

Settings.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Settings)
