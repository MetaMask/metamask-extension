const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const ethUtil = require('ethereumjs-util')
const inherits = require('util').inherits
const actions = require('../../actions')
const selectors = require('../../selectors')

// const BalanceComponent = require('./balance-component')
const Identicon = require('../identicon')
const TokenBalance = require('../token-balance')
const CurrencyToggle = require('../send/currency-toggle')
const GasTooltip = require('../send/gas-tooltip')
const GasFeeDisplay = require('../send/gas-fee-display')


module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTokenScreen)

function mapStateToProps (state) {
  // const sidebarOpen = state.appState.sidebarOpen

  const identities = state.metamask.identities
  const addressBook = state.metamask.addressBook
  const conversionRate = state.metamask.conversionRate
  const currentBlockGasLimit = state.metamask.currentBlockGasLimit
  const accounts = state.metamask.accounts
  // const network = state.metamask.network
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  // const checksumAddress = selectedAddress && ethUtil.toChecksumAddress(selectedAddress)
  // const identity = identities[selectedAddress]

  return {
    // sidebarOpen,
    selectedAddress,
    // checksumAddress,
    selectedTokenAddress,
    identities,
    addressBook,
    conversionRate,
    currentBlockGasLimit,
    selectedToken: selectors.getSelectedToken(state),
    // selectedToken: selectors.getSelectedToken(state),
    // identity,
    // network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    // showSidebar: () => { dispatch(actions.showSidebar()) },
    // hideSidebar: () => { dispatch(actions.hideSidebar()) },
    // showModal: (payload) => { dispatch(actions.showModal(payload)) },
    // showSendPage: () => { dispatch(actions.showSendPage()) },
    // showSendTokenPage: () => { dispatch(actions.showSendTokenPage()) },
  }
}

inherits(SendTokenScreen, Component)
function SendTokenScreen () {
  Component.call(this)
  this.state = {
    to: '',
    selectedCurrency: 'USD',
    isGasTooltipOpen: false,
    gasPrice: '0x5d21dba00',
    gasLimit: '0x7b0d',
  }
}

SendTokenScreen.prototype.renderToAddressInput = function () {
  const {
    identities,
    addressBook,
  } = this.props

  const {
    to,
  } = this.state

  return h('div.send-screen-input-wrapper', {}, [
    h('div', ['To:']),
    h('input.large-input.send-screen-input', {
      name: 'address',
      list: 'addresses',
      placeholder: 'Address',
      value: to,
      onChange: e => this.setState({ to: e.target.value }),
    }),
    h('datalist#addresses', [
      // Corresponds to the addresses owned.
      Object.entries(identities).map(([key, { address, name }]) => {
        return h('option', {
          value: address,
          label: name,
          key: address,
        })
      }),
      addressBook.map(({ address, name }) => {
        return h('option', {
          value: address,
          label: name,
          key: address,
        })
      }),
    ]),
  ])
}

SendTokenScreen.prototype.renderAmountInput = function () {
  const {
    selectedCurrency,
  } = this.state

  const {
    selectedToken: {symbol},
  } = this.props

  return h('div.send-screen-input-wrapper', {}, [
    h('div.send-screen-amount-labels', [
      h('span', ['Amount']),
      h(CurrencyToggle, {
        selectedCurrency,
        currencies: [ symbol, 'USD' ],
        onClick: currency => this.setState({ selectedCurrency: currency }),
      }),
    ]),
    h('input.large-input.send-screen-input', {
      placeholder: `0 ${symbol}`,
      type: 'number',
      onChange: e => this.setState({ amount: e.target.value }),
    }),
  ])
}

SendTokenScreen.prototype.renderGasInput = function () {
  const {
    isGasTooltipOpen,
    gasPrice,
    gasLimit,
    selectedCurrency,
  } = this.state

  const {
    conversionRate,
    currentBlockGasLimit,
  } = this.props

  return h('div.send-screen-input-wrapper', [
    isGasTooltipOpen && h(GasTooltip, {
      className: 'send-tooltip',
      gasPrice,
      gasLimit,
      onClose: () => this.setState({ isGasTooltipOpen: false }),
      onFeeChange: ({ gasLimit, gasPrice }) => {
        this.setState({ gasLimit, gasPrice })
      },
    }),

    h('div.send-screen-gas-labels', {}, [
      h('span', [ h('i.fa.fa-bolt'), 'Gas fee:']),
      h('span', ['What\'s this?']),
    ]),
    h('div.large-input.send-screen-gas-input', [
      h(GasFeeDisplay, {
        conversionRate,
        gasPrice,
        currentCurrency: selectedCurrency,
        gas: gasLimit,
        blockGasLimit: currentBlockGasLimit,
      }),
      h(
        'div.send-screen-gas-input-customize',
        { onClick: () => this.setState({ isGasTooltipOpen: !isGasTooltipOpen }) },
        ['Customize']
      ),
    ]),
  ])
}

SendTokenScreen.prototype.renderMemoInput = function () {
  return h('div.send-screen-input-wrapper', [
    h('div', {}, ['Transaction memo (optional)']),
    h(
      'input.large-input.send-screen-input',
      { onChange: e => this.setState({ memo: e.target.value }) }
    ),
  ])
}

SendTokenScreen.prototype.renderButtons = function () {
  const { selectedAddress, backToAccountDetail } = this.props

  return h('div.send-token__button-group', [
    h('button.send-token__button-next.btn-secondary', {

    }, ['Next']),
    h('button.send-token__button-cancel.btn-tertiary', {
      onClick: () => backToAccountDetail(selectedAddress),
    }, ['Cancel']),
  ])
}

SendTokenScreen.prototype.render = function () {
  const {
    selectedTokenAddress,
    selectedToken,
  } = this.props

  return h('div.send-token', [
    h('div.send-token__content', [
      h(Identicon, {
        diameter: 75,
        address: selectedTokenAddress,
      }),
      h('div.send-token__title', ['Send Tokens']),
      h('div.send-token__description', ['Send Tokens to anyone with an Ethereum account']),
      h('div.send-token__balance-text', ['Your Token Balance is:']),
      h('div.send-token__token-balance', [
        h(TokenBalance, { token: selectedToken, balanceOnly: true }),
      ]),
      h('div.send-token__token-symbol', [selectedToken.symbol]),
      this.renderToAddressInput(),
      this.renderAmountInput(),
      this.renderGasInput(),
      this.renderMemoInput(),
    ]),
    this.renderButtons(),
  ])
}
