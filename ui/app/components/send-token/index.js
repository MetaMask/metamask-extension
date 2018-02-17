const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const classnames = require('classnames')
const abi = require('ethereumjs-abi')
const inherits = require('util').inherits
const actions = require('../../actions')
const selectors = require('../../selectors')
const { isValidAddress, allNull } = require('../../util')

// const BalanceComponent = require('./balance-component')
const Identicon = require('../identicon')
const TokenBalance = require('../token-balance')
const CurrencyToggle = require('../send/currency-toggle')
const GasTooltip = require('../send/gas-tooltip')
const GasFeeDisplay = require('../send/gas-fee-display')

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTokenScreen)

function mapStateToProps (state) {
  // const sidebarOpen = state.appState.sidebarOpen

  const { warning } = state.appState
  const identities = state.metamask.identities
  const addressBook = state.metamask.addressBook
  const conversionRate = state.metamask.conversionRate
  const currentBlockGasLimit = state.metamask.currentBlockGasLimit
  const accounts = state.metamask.accounts
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  const selectedToken = selectors.getSelectedToken(state)
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const pair = `${selectedToken.symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}

  return {
    selectedAddress,
    selectedTokenAddress,
    identities,
    addressBook,
    conversionRate,
    tokenExchangeRate,
    currentBlockGasLimit,
    selectedToken,
    warning,
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
    estimateGas: params => dispatch(actions.estimateGas(params)),
    getGasPrice: () => dispatch(actions.getGasPrice()),
  }
}

inherits(SendTokenScreen, Component)
function SendTokenScreen () {
  Component.call(this)
  this.state = {
    to: '',
    amount: '0x0',
    amountToSend: '0x0',
    selectedCurrency: 'USD',
    isGasTooltipOpen: false,
    gasPrice: null,
    gasLimit: null,
    errors: {},
  }
}

SendTokenScreen.prototype.componentWillMount = function () {
  const {
    updateTokenExchangeRate,
    selectedToken: { symbol },
    getGasPrice,
    estimateGas,
    selectedAddress,
  } = this.props

  updateTokenExchangeRate(symbol)

  const data = Array.prototype.map.call(
    abi.rawEncode(['address', 'uint256'], [selectedAddress, '0x0']),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('')

  console.log(data)
  Promise.all([
    getGasPrice(),
    estimateGas({
      from: selectedAddress,
      value: '0x0',
      gas: '746a528800',
      data,
    }),
  ])
  .then(([blockGasPrice, estimatedGas]) => {
    console.log({ blockGasPrice, estimatedGas})
    this.setState({
      gasPrice: blockGasPrice,
      gasLimit: estimatedGas,
    })
  })
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

  const errors = {
    to: !to ? 'Required' : null,
    amount: !amount ? 'Required' : null,
    gasPrice: !gasPrice ? 'Gas Price Required' : null,
    gasLimit: !gasLimit ? 'Gas Limit Required' : null,
  }

  if (to && !isValidAddress(to)) {
    errors.to = 'Invalid address'
  }

  const isValid = Object.entries(errors).every(([key, value]) => value === null)
  return {
    isValid,
    errors: isValid ? {} : errors,
  }
}

SendTokenScreen.prototype.setErrorsFor = function (field) {
  const { errors: previousErrors } = this.state

  const {
    isValid,
    errors: newErrors,
  } = this.validate()

  const nextErrors = Object.assign({}, previousErrors, {
    [field]: newErrors[field] || null,
  })

  if (!isValid) {
    this.setState({
      errors: nextErrors,
      isValid,
    })
  }
}

SendTokenScreen.prototype.clearErrorsFor = function (field) {
  const { errors: previousErrors } = this.state
  const nextErrors = Object.assign({}, previousErrors, {
    [field]: null,
  })

  this.setState({
    errors: nextErrors,
    isValid: allNull(nextErrors),
  })
}

SendTokenScreen.prototype.getAmountToSend = function (amount, selectedToken) {
  const { decimals } = selectedToken || {}
  const multiplier = Math.pow(10, Number(decimals || 0))
  const sendAmount = '0x' + Number(amount * multiplier).toString(16)
  return sendAmount
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

  hideWarning()
  addToAddressBook(to, nickname)

  const txParams = {
    from: selectedAddress,
    value: '0',
    gas: gasLimit,
    gasPrice: gasPrice,
  }

  const sendAmount = this.getAmountToSend(amount, selectedToken)

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
      onBlur: () => {
        this.setErrorsFor('to')
      },
      onFocus: event => {
        if (to) event.target.select()
        this.clearErrorsFor('to')
      },
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
      }),
      onBlur: () => {
        this.setErrorsFor('amount')
      },
      onFocus: () => this.clearErrorsFor('amount'),
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
      gasPrice: gasPrice || '0x0',
      gasLimit: gasLimit || '0x0',
      onClose: () => this.setState({ isGasTooltipOpen: false }),
      onFeeChange: ({ gasLimit, gasPrice }) => {
        this.setState({ gasLimit, gasPrice, errors: {} })
      },
      onBlur: () => {
        this.setErrorsFor('gasLimit')
        this.setErrorsFor('gasPrice')
      },
      onFocus: () => {
        this.clearErrorsFor('gasLimit')
        this.clearErrorsFor('gasPrice')
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
        gasPrice: gasPrice || '0x0',
        activeCurrency: selectedCurrency,
        gas: gasLimit || '0x0',
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
  const { isValid } = this.validate()

  return h('div.send-token__button-group', [
    h('button.send-token__button-next.btn-secondary', {
      className: !isValid && 'send-screen__send-button__disabled',
      onClick: () => isValid && this.submit(),
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
    warning,
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
      warning && h('div.send-screen-input-wrapper--error', {},
        h('div.send-screen-input-wrapper__error-message', [
          warning,
        ])
      ),
    ]),
    this.renderButtons(),
  ])
}
