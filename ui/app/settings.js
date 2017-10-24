const { Component } = require('react')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('./actions')
const infuraCurrencies = require('./infura-conversion.json')
const validUrl = require('valid-url')
const { exportAsFile } = require('./util')
const TabBar = require('./components/tab-bar')
const SimpleDropdown = require('./components/dropdowns/simple-dropdown')

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
  constructor (args) {
    super(args)
    this.state = {
      activeTab: 'settings',
      newRpc: '',
    }
  }

  renderTabs () {
    return h('div.settings__tabs', [
      h(TabBar, {
        tabs: [
          { content: 'Settings', key: 'settings' },
          { content: 'Info', key: 'info' },
        ],
        defaultTab: 'settings',
        tabSelected: key => this.setState({ activeTab: key }),
      }),
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

  renderSettingsContent () {
    const { warning } = this.props

    return (
      h('div.settings__content', [
        warning && h('div.settings__error', warning),
        this.renderCurrentConversion(),
        // this.renderCurrentProvider(),
        this.renderNewRpcUrl(),
        this.renderStateLogs(),
        this.renderSeedWords(),
      ])
    )
  }

  renderInfoContent () {

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
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Settings)
