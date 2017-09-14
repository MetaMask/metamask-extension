const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const { addHexPrefix } = require('ethereumjs-util')
const classnames = require('classnames')
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
  const selectedToken = selectors.getSelectedToken(state)
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const pair = `${selectedToken.symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}
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
    tokenExchangeRate,
    currentBlockGasLimit,
    selectedToken,
    // selectedToken: selectors.getSelectedToken(state),
    // identity,
    // network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    hideWarning: () => dispatch(actions.hideWarning()),
    addToAddressBook: (recipient, nickname) => dispatch(
      actions.addToAddressBook(recipient, nickname)
    ),
    signTx: txParams => dispatch(actions.signTx(txParams)),
    signTokenTx: (tokenAddress, toAddress, amount, txData) => (
      dispatch(actions.signTokenTx(tokenAddress, toAddress, amount, txData))
    ),
    updateTokenExchangeRate: token => dispatch(actions.updateTokenExchangeRate(token)),
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
    amount: '',
    selectedCurrency: 'USD',
    isGasTooltipOpen: false,
    gasPrice: '0x5d21dba00',
    gasLimit: '0x7b0d',
    errors: {},
  }
}

SendTokenScreen.prototype.componentWillMount = function () {
  const {
    updateTokenExchangeRate,
    selectedToken: { symbol },
  } = this.props

  updateTokenExchangeRate(symbol)
}

SendTokenScreen.prototype.validate = function () {
  const {
    to,
    amount: stringAmount,
    gasPrice: hexGasPrice,
    gasLimit: hexGasLimit,
  } = this.state

  const gasPrice = parseInt(hexGasPrice, 16)
  const gasLimit = parseInt(hexGasLimit, 16) / 1000000000
  const amount = Number(stringAmount)

  if (to && amount && gasPrice && gasLimit) {
    return {
      isValid: true,
      errors: {},
    }
  }

  const errors = {
    to: !to ? 'Required' : null,
    amount: !amount ? 'Required' : null,
    gasPrice: !gasPrice ? 'Gas Price Required' : null,
    gasLimit: !gasLimit ? 'Gas Limit Required' : null,
  }

  return {
    isValid: false,
    errors,
  }
}

SendTokenScreen.prototype.submit = function () {
  const {
    to,
    amount,
    gasPrice,
    gasLimit,
  } = this.state

  const {
    identities,
    selectedAddress,
    selectedTokenAddress,
    hideWarning,
    addToAddressBook,
    signTokenTx,
    selectedToken,
  } = this.props

  const { nickname = ' ' } = identities[to] || {}

  const { isValid, errors } = this.validate()

  if (!isValid) {
    return this.setState({ errors })
  }

  hideWarning()
  addToAddressBook(to, nickname)

  const txParams = {
    from: selectedAddress,
    value: '0',
    gas: gasLimit,
    gasPrice: gasPrice,
  }

  const { decimals } = selectedToken || {}
  const multiplier = Math.pow(10, Number(decimals || 0))
  const sendAmount = Number(amount * multiplier).toString(16)

  signTokenTx(selectedTokenAddress, to, sendAmount, txParams)
}

SendTokenScreen.prototype.renderToAddressInput = function () {
  const {
    identities,
    addressBook,
  } = this.props

  const {
    to,
    errors: { to: errorMessage },
  } = this.state

  return h('div', {
    className: classnames('send-screen-input-wrapper', {
      'send-screen-input-wrapper--error': errorMessage,
    }),
  }, [
    h('div', ['To:']),
    h('input.large-input.send-screen-input', {
      name: 'address',
      list: 'addresses',
      placeholder: 'Address',
      value: to,
      onChange: e => this.setState({
        to: e.target.value,
        errors: {},
      }),
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
    h('div.send-screen-input-wrapper__error-message', [ errorMessage ]),
  ])
}

SendTokenScreen.prototype.renderAmountInput = function () {
  const {
    selectedCurrency,
    amount,
    errors: { amount: errorMessage },
  } = this.state

  const {
    tokenExchangeRate,
    selectedToken: {symbol},
  } = this.props

  return h('div.send-screen-input-wrapper', {
    className: classnames('send-screen-input-wrapper', {
      'send-screen-input-wrapper--error': errorMessage,
    }),
  }, [
    h('div.send-screen-amount-labels', [
      h('span', ['Amount']),
      h(CurrencyToggle, {
        currentCurrency: tokenExchangeRate ? selectedCurrency : 'USD',
        currencies: tokenExchangeRate ? [ symbol, 'USD' ] : [],
        onClick: currency => this.setState({ selectedCurrency: currency }),
      }),
    ]),
    h('input.large-input.send-screen-input', {
      placeholder: `0 ${symbol}`,
      type: 'number',
      value: amount,
      onChange: e => this.setState({
        amount: e.target.value,
        errors: {},
      }),
    }),
    h('div.send-screen-input-wrapper__error-message', [ errorMessage ]),
  ])
}

SendTokenScreen.prototype.renderGasInput = function () {
  const {
    isGasTooltipOpen,
    gasPrice,
    gasLimit,
    selectedCurrency,
    errors: {
      gasPrice: gasPriceErrorMessage,
      gasLimit: gasLimitErrorMessage,
    },
  } = this.state

  const {
    conversionRate,
    tokenExchangeRate,
    currentBlockGasLimit,
  } = this.props

  return h('div.send-screen-input-wrapper', {
    className: classnames('send-screen-input-wrapper', {
      'send-screen-input-wrapper--error': gasPriceErrorMessage || gasLimitErrorMessage,
    }),
  }, [
    isGasTooltipOpen && h(GasTooltip, {
      className: 'send-tooltip',
      gasPrice,
      gasLimit,
      onClose: () => this.setState({ isGasTooltipOpen: false }),
      onFeeChange: ({ gasLimit, gasPrice }) => {
        this.setState({ gasLimit, gasPrice, errors: {} })
      },
    }),

    h('div.send-screen-gas-labels', {}, [
      h('span', [ h('i.fa.fa-bolt'), 'Gas fee:']),
      h('span', ['What\'s this?']),
    ]),
    h('div.large-input.send-screen-gas-input', [
      h(GasFeeDisplay, {
        conversionRate,
        tokenExchangeRate,
        gasPrice,
        activeCurrency: selectedCurrency,
        gas: gasLimit,
        blockGasLimit: currentBlockGasLimit,
      }),
      h(
        'div.send-screen-gas-input-customize',
        { onClick: () => this.setState({ isGasTooltipOpen: !isGasTooltipOpen }) },
        ['Customize']
      ),
    ]),
    h('div.send-screen-input-wrapper__error-message', [
      gasPriceErrorMessage || gasLimitErrorMessage,
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
      onClick: () => this.submit(),
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
