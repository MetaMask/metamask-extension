const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('./actions')
const infuraCurrencies = require('./infura-conversion.json')
const validUrl = require('valid-url')
const { exportAsFile } = require('./util')
const TabBar = require('./components/tab-bar')
const SimpleDropdown = require('./components/dropdowns/simple-dropdown')
const ToggleButton = require('react-toggle-button')

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

class Settings extends Component {
  constructor (props) {
    super(props)

    const { tab } = props
    const activeTab = tab === 'info' ? 'info' : 'settings'

    this.state = {
      activeTab,
      newRpc: '',
    }
  }

  renderTabs () {
    const { activeTab } = this.state

    return h('div.settings__tabs', [
      h(TabBar, {
        tabs: [
          { content: 'Settings', key: 'settings' },
          { content: 'Info', key: 'info' },
        ],
        defaultTab: activeTab,
        tabSelected: key => this.setState({ activeTab: key }),
      }),
    ])
  }

  renderBlockieOptIn () {
    const { metamask: { useBlockie }, setUseBlockie } = this.props

    return h('div.settings__content-row', [
      h('div.settings__content-item', [
        h('span', 'Use Blockies Identicon'),
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
        h('span', 'Current Conversion'),
        h('span.settings__content-description', `Updated ${Date(conversionDate)}`),
      ]),
      h('div.settings__content-item', [
        h('div.settings__content-item-col', [
          h(SimpleDropdown, {
            placeholder: 'Select Currency',
            options: getInfuraCurrencyOptions(),
            selectedOption: currentCurrency,
            onSelect: newCurrency => setCurrentCurrency(newCurrency),
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
        title = 'Current Network'
        value = 'Main Ethereum Network'
        color = '#038789'
        break

      case 'ropsten':
        title = 'Current Network'
        value = 'Ropsten Test Network'
        color = '#e91550'
        break

      case 'kovan':
        title = 'Current Network'
        value = 'Kovan Test Network'
        color = '#690496'
        break

      case 'rinkeby':
        title = 'Current Network'
        value = 'Rinkeby Test Network'
        color = '#ebb33f'
        break

      default:
        title = 'Current RPC'
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
          h('span', 'New RPC URL'),
        ]),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('input.settings__input', {
              placeholder: 'New RPC URL',
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
            }, 'Save'),
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
        displayWarning('URIs require the appropriate HTTP/HTTPS prefix.')
      } else {
        displayWarning('Invalid RPC URI')
      }
    }
  }

  renderStateLogs () {
    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', [
          h('div', 'State Logs'),
          h(
            'div.settings__content-description',
            'State logs contain your public account addresses and sent transactions.'
          ),
        ]),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('button.settings__clear-button', {
              onClick (event) {
                exportAsFile('MetaMask State Logs', window.logState())
              },
            }, 'Download State Logs'),
          ]),
        ]),
      ])
    )
  }

  renderSeedWords () {
    const { revealSeedConfirmation } = this.props

    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', 'Reveal Seed Words'),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('button.settings__clear-button.settings__clear-button--red', {
              onClick (event) {
                event.preventDefault()
                revealSeedConfirmation()
              },
            }, 'Reveal Seed Words'),
          ]),
        ]),
      ])
    )
  }

  renderOldUI () {
    const { setFeatureFlagToBeta } = this.props

    return (
      h('div.settings__content-row', [
        h('div.settings__content-item', 'Use old UI'),
        h('div.settings__content-item', [
          h('div.settings__content-item-col', [
            h('button.settings__clear-button.settings__clear-button--red', {
              onClick (event) {
                event.preventDefault()
                setFeatureFlagToBeta()
              },
            }, 'Use old UI'),
          ]),
        ]),
      ])
    )
  }

  renderSettingsContent () {
    const { warning } = this.props

    return (
      h('div.settings__content', [
        warning && h('div.settings__error', warning),
        this.renderBlockieOptIn(),
        this.renderCurrentConversion(),
        // this.renderCurrentProvider(),
        this.renderNewRpcUrl(),
        this.renderStateLogs(),
        this.renderSeedWords(),
        this.renderOldUI(),
      ])
    )
  }
  
  renderLogo () {
    return (
      h('div.settings__info-logo-wrapper', [
        h('img.settings__info-logo', { src: 'images/info-logo.png' }),
      ])
    )
  }

  renderInfoLinks () {
    return (
      h('div.settings__content-item.settings__content-item--without-height', [
        h('div.settings__info-link-header', 'Links'),
        h('div.settings__info-link-item', [
          h('a', {
            href: 'https://metamask.io/privacy.html',
            target: '_blank',
          }, [
            h('span.settings__info-link', 'Privacy Policy'),
          ]),
        ]),
        h('div.settings__info-link-item', [
          h('a', {
            href: 'https://metamask.io/terms.html',
            target: '_blank',
          }, [
            h('span.settings__info-link', 'Terms of Use'),
          ]),
        ]),
        h('div.settings__info-link-item', [
          h('a', {
            href: 'https://metamask.io/attributions.html',
            target: '_blank',
          }, [
            h('span.settings__info-link', 'Attributions'),
          ]),
        ]),
        h('hr.settings__info-separator'),
        h('div.settings__info-link-item', [
          h('a', {
            href: 'https://support.metamask.io',
            target: '_blank',
          }, [
            h('span.settings__info-link', 'Visit our Support Center'),
          ]),
        ]),
        h('div.settings__info-link-item', [
          h('a', {
            href: 'https://metamask.io/',
            target: '_blank',
          }, [
            h('span.settings__info-link', 'Visit our web site'),
          ]),
        ]),
        h('div.settings__info-link-item', [
          h('a', {
            target: '_blank',
            href: 'mailto:help@metamask.io?subject=Feedback',
          }, [
            h('span.settings__info-link', 'Email us!'),
          ]),
        ]),
      ])
    )
  }

  renderInfoContent () {
    return (
      h('div.settings__content', [
        h('div.settings__content-row', [
          h('div.settings__content-item.settings__content-item--without-height', [
            this.renderLogo(),
            h('div.settings__info-item', [
              h('div.settings__info-version-header', 'MetaMask Version'),
              h('div.settings__info-version-number', '4.0.0'),
            ]),
            h('div.settings__info-item', [
              h(
                'div.settings__info-about',
                'MetaMask is designed and built in California.'
              ),
            ]),
          ]),
          this.renderInfoLinks(),
        ]),
      ])
    )
  }

  render () {
    const { goHome } = this.props
    const { activeTab } = this.state

    return (
      h('.main-container.settings', {}, [
        h('.settings__header', [
          h('div.settings__close-button', {
            onClick: goHome,
          }),
          this.renderTabs(),
        ]),

        activeTab === 'settings'
          ? this.renderSettingsContent()
          : this.renderInfoContent(),
      ])
    )
  }
}

Settings.propTypes = {
  tab: PropTypes.string,
  metamask: PropTypes.object,
  setUseBlockie: PropTypes.func,
  setCurrentCurrency: PropTypes.func,
  setRpcTarget: PropTypes.func,
  displayWarning: PropTypes.func,
  revealSeedConfirmation: PropTypes.func,
  setFeatureFlagToBeta: PropTypes.func,
  warning: PropTypes.string,
  goHome: PropTypes.func,
}

const mapStateToProps = state => {
  return {
    metamask: state.metamask,
    warning: state.appState.warning,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    goHome: () => dispatch(actions.goHome()),
    setCurrentCurrency: currency => dispatch(actions.setCurrentCurrency(currency)),
    setRpcTarget: newRpc => dispatch(actions.setRpcTarget(newRpc)),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    revealSeedConfirmation: () => dispatch(actions.revealSeedConfirmation()),
    setUseBlockie: value => dispatch(actions.setUseBlockie(value)),
    setFeatureFlagToBeta: () => dispatch(actions.setFeatureFlag('betaUI', false)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Settings)
