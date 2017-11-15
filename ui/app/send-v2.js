const { inherits } = require('util')
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')

const ethUtil = require('ethereumjs-util')

const Identicon = require('./components/identicon')
const FromDropdown = require('./components/send/from-dropdown')
const ToAutoComplete = require('./components/send/to-autocomplete')
const CurrencyDisplay = require('./components/send/currency-display')
const MemoTextArea = require('./components/send/memo-textarea')
const GasFeeDisplay = require('./components/send/gas-fee-display-v2')

const {
  MIN_GAS_TOTAL,
  MIN_GAS_PRICE_HEX,
  MIN_GAS_LIMIT_HEX,
} = require('./components/send/send-constants')

const {
  multiplyCurrencies,
  conversionGreaterThan,
  subtractCurrencies,
} = require('./conversion-util')
const {
  calcTokenAmount,
} = require('./token-util')
const {
  isBalanceSufficient,
  isTokenBalanceSufficient,
} = require('./components/send/send-utils')
const { isValidAddress } = require('./util')

module.exports = SendTransactionScreen

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  PersistentForm.call(this)

  this.state = {
    fromDropdownOpen: false,
    toDropdownOpen: false,
    errors: {
      to: null,
      amount: null,
    },
  }

  this.handleToChange = this.handleToChange.bind(this)
  this.handleAmountChange = this.handleAmountChange.bind(this)
  this.validateAmount = this.validateAmount.bind(this)
}

const getParamsForGasEstimate = function (selectedAddress, symbol, data) {
  const estimatedGasParams = {
    from: selectedAddress,
    gas: '746a528800',
  }

  if (symbol) {
    Object.assign(estimatedGasParams, { value: '0x0' })
  }

  if (data) {
    Object.assign(estimatedGasParams, { data })
  }

  return estimatedGasParams
}

SendTransactionScreen.prototype.updateSendTokenBalance = function (usersToken) {
  if (!usersToken) return

  const {
    selectedToken = {},
    updateSendTokenBalance,
  } = this.props
  const { decimals } = selectedToken || {}
  const tokenBalance = calcTokenAmount(usersToken.balance.toString(), decimals)

  updateSendTokenBalance(tokenBalance)
}

SendTransactionScreen.prototype.componentWillMount = function () {
  const {
    updateTokenExchangeRate,
    selectedToken = {},
    getGasPrice,
    estimateGas,
    selectedAddress,
    data,
    updateGasTotal,
    from,
    tokenContract,
    editingTransactionId,
    gasPrice,
    gasLimit,
  } = this.props
  const { symbol } = selectedToken || {}

  if (symbol) {
    updateTokenExchangeRate(symbol)
  }

  const estimateGasParams = getParamsForGasEstimate(selectedAddress, symbol, data)

  const tokenBalancePromise = tokenContract && tokenContract.balanceOf(from.address)
  let newGasTotal
  if (!editingTransactionId) {
    Promise
      .all([
        getGasPrice(),
        estimateGas(estimateGasParams),
        tokenBalancePromise,
      ])
      .then(([gasPrice, gas, usersToken]) => {

        const newGasTotal = multiplyCurrencies(gas, gasPrice, {
          toNumericBase: 'hex',
          multiplicandBase: 16,
          multiplierBase: 16,
        })
        updateGasTotal(newGasTotal)
        this.updateSendTokenBalance(usersToken)
      })
  } else {
    newGasTotal = multiplyCurrencies(gasLimit, gasPrice, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 16,
    })
    updateGasTotal(newGasTotal)
    tokenBalancePromise && tokenBalancePromise.then(
      usersToken => this.updateSendTokenBalance(usersToken))
  }
}

SendTransactionScreen.prototype.componentDidUpdate = function (prevProps) {
  const {
    from: { balance },
    gasTotal,
    tokenBalance,
    amount,
    selectedToken,
  } = this.props
  const {
    from: { balance: prevBalance },
    gasTotal: prevGasTotal,
    tokenBalance: prevTokenBalance,
  } = prevProps

  const notFirstRender = [prevBalance, prevGasTotal].every(n => n !== null)

  const balanceHasChanged = balance !== prevBalance
  const gasTotalHasChange = gasTotal !== prevGasTotal
  const tokenBalanceHasChanged = selectedToken && tokenBalance !== prevTokenBalance
  const amountValidationChange = balanceHasChanged || gasTotalHasChange || tokenBalanceHasChanged

  if (notFirstRender && amountValidationChange) {
    this.validateAmount(amount)
  }
}

SendTransactionScreen.prototype.renderHeaderIcon = function () {
  const { selectedToken } = this.props

  return h('div.send-v2__send-header-icon-container', [
    selectedToken
      ? h(Identicon, {
        diameter: 40,
        address: selectedToken.address,
      })
      : h('img.send-v2__send-header-icon', { src: '../images/eth_logo.svg' }),
  ])
}

SendTransactionScreen.prototype.renderTitle = function () {
  const { selectedToken } = this.props

  return h('div.send-v2__title', [selectedToken ? 'Send Tokens' : 'Send Funds'])
}

SendTransactionScreen.prototype.renderCopy = function () {
  const { selectedToken } = this.props

  const tokenText = selectedToken ? 'tokens' : 'ETH'

  return h('div.send-v2__form-header-copy', [

    h('div.send-v2__copy', `Only send ${tokenText} to an Ethereum address.`),

    h('div.send-v2__copy', 'Sending to a different crytpocurrency that is not Ethereum may result in permanent loss.'),

  ])
}

SendTransactionScreen.prototype.renderHeader = function () {
  return h('div', [
    h('div.send-v2__header', {}, [

      this.renderHeaderIcon(),

      h('div.send-v2__arrow-background', [
        h('i.fa.fa-lg.fa-arrow-circle-right.send-v2__send-arrow-icon'),
      ]),

      h('div.send-v2__header-tip'),

    ]),

  ])
}

SendTransactionScreen.prototype.renderErrorMessage = function (errorType) {
  const { errors } = this.props
  const errorMessage = errors[errorType]

  return errorMessage
    ? h('div.send-v2__error', [ errorMessage ])
    : null
}

SendTransactionScreen.prototype.handleFromChange = async function (newFrom) {
  const {
    updateSendFrom,
    tokenContract,
  } = this.props

  if (tokenContract) {
    const usersToken = await tokenContract.balanceOf(newFrom.address)
    this.updateSendTokenBalance(usersToken)
  }
  updateSendFrom(newFrom)
}

SendTransactionScreen.prototype.renderFromRow = function () {
  const {
    from,
    fromAccounts,
    conversionRate,
  } = this.props

  const { fromDropdownOpen } = this.state

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'From:'),

    h('div.send-v2__form-field', [
      h(FromDropdown, {
        dropdownOpen: fromDropdownOpen,
        accounts: fromAccounts,
        selectedAccount: from,
        onSelect: newFrom => this.handleFromChange(newFrom),
        openDropdown: () => this.setState({ fromDropdownOpen: true }),
        closeDropdown: () => this.setState({ fromDropdownOpen: false }),
        conversionRate,
      }),
    ]),

  ])
}

SendTransactionScreen.prototype.handleToChange = function (to) {
  const {
    updateSendTo,
    updateSendErrors,
    from: {address: from},
  } = this.props
  let toError = null

  if (!to) {
    toError = 'Required'
  } else if (!isValidAddress(to)) {
    toError = 'Recipient address is invalid'
  } else if (to === from) {
    toError = 'From and To address cannot be the same'
  }

  updateSendTo(to)
  updateSendErrors({ to: toError })
}

SendTransactionScreen.prototype.renderToRow = function () {
  const { toAccounts, errors, to } = this.props

  const { toDropdownOpen } = this.state

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', [

      'To:',

      this.renderErrorMessage('to'),

    ]),

    h('div.send-v2__form-field', [
      h(ToAutoComplete, {
        to,
        accounts: Object.entries(toAccounts).map(([key, account]) => account),
        dropdownOpen: toDropdownOpen,
        openDropdown: () => this.setState({ toDropdownOpen: true }),
        closeDropdown: () => this.setState({ toDropdownOpen: false }),
        onChange: this.handleToChange,
        inError: Boolean(errors.to),
      }),
    ]),

  ])
}

SendTransactionScreen.prototype.handleAmountChange = function (value) {
  const amount = value
  const { updateSendAmount } = this.props

  this.validateAmount(amount)
  updateSendAmount(amount)
}

SendTransactionScreen.prototype.setAmountToMax = function () {
  const {
    from: { balance },
    updateSendAmount,
    updateSendErrors,
    updateGasPrice,
    updateGasLimit,
    updateGasTotal,
    tokenBalance,
    selectedToken,
  } = this.props
  const { decimals } = selectedToken || {}
  const multiplier = Math.pow(10, Number(decimals || 0))

  const maxAmount = selectedToken
    ? multiplyCurrencies(tokenBalance, multiplier, {toNumericBase: 'hex'})
    : subtractCurrencies(
      ethUtil.addHexPrefix(balance),
      ethUtil.addHexPrefix(MIN_GAS_TOTAL),
      { toNumericBase: 'hex' }
    )

  updateSendErrors({ amount: null })
  if (!selectedToken) {
    updateGasPrice(MIN_GAS_PRICE_HEX)
    updateGasLimit(MIN_GAS_LIMIT_HEX)
    updateGasTotal(MIN_GAS_TOTAL)
  }
  updateSendAmount(maxAmount)
}

SendTransactionScreen.prototype.validateAmount = function (value) {
  const {
    from: { balance },
    updateSendErrors,
    amountConversionRate,
    conversionRate,
    primaryCurrency,
    selectedToken,
    gasTotal,
    tokenBalance,
  } = this.props
  const { decimals } = selectedToken || {}
  const amount = value

  let amountError = null
  const sufficientBalance = isBalanceSufficient({
    amount: selectedToken ? '0x0' : amount,
    gasTotal,
    balance,
    primaryCurrency,
    amountConversionRate,
    conversionRate,
  })

  let sufficientTokens
  if (selectedToken) {
    sufficientTokens = isTokenBalanceSufficient({
      tokenBalance,
      amount,
      decimals,
    })
  }

  const amountLessThanZero = conversionGreaterThan(
    { value: 0, fromNumericBase: 'dec' },
    { value: amount, fromNumericBase: 'hex' },
  )

  if (!sufficientBalance) {
    amountError = 'Insufficient funds.'
  } else if (selectedToken && !sufficientTokens) {
    amountError = 'Insufficient tokens.'
  } else if (amountLessThanZero) {
    amountError = 'Can not send negative amounts of ETH.'
  }

  updateSendErrors({ amount: amountError })
}

SendTransactionScreen.prototype.renderAmountRow = function () {
  const {
    selectedToken,
    primaryCurrency = 'ETH',
    convertedCurrency,
    amountConversionRate,
    errors,
    amount,
  } = this.props

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', [
      'Amount:',
      this.renderErrorMessage('amount'),
      !errors.amount && h('div.send-v2__amount-max', {
        onClick: (event) => {
          event.preventDefault()
          this.setAmountToMax()
        },
      }, [ 'Max' ]),
    ]),

    h('div.send-v2__form-field', [
      h(CurrencyDisplay, {
        inError: Boolean(errors.amount),
        primaryCurrency,
        convertedCurrency,
        selectedToken,
        value: amount || '0x0',
        conversionRate: amountConversionRate,
        handleChange: this.handleAmountChange,
      }),
    ]),

  ])
}

SendTransactionScreen.prototype.renderGasRow = function () {
  const {
    conversionRate,
    convertedCurrency,
    showCustomizeGasModal,
    gasTotal = MIN_GAS_TOTAL,
  } = this.props

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'Gas fee:'),

    h('div.send-v2__form-field', [

      h(GasFeeDisplay, {
        gasTotal,
        conversionRate,
        convertedCurrency,
        onClick: showCustomizeGasModal,
      }),

      h('div.send-v2__sliders-icon-container', {
        onClick: showCustomizeGasModal,
      }, [
        h('i.fa.fa-sliders.send-v2__sliders-icon'),
      ]),

    ]),

  ])
}

SendTransactionScreen.prototype.renderMemoRow = function () {
  const { updateSendMemo, memo } = this.props

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'Transaction Memo:'),

    h('div.send-v2__form-field', [
      h(MemoTextArea, {
        memo,
        onChange: (event) => updateSendMemo(event.target.value),
      }),
    ]),

  ])
}

SendTransactionScreen.prototype.renderForm = function () {
  return h('div.send-v2__form', {}, [

    h('div.sendV2__form-header', [

      this.renderTitle(),

      this.renderCopy(),

    ]),

    this.renderFromRow(),

    this.renderToRow(),

    this.renderAmountRow(),

    this.renderGasRow(),

    // this.renderMemoRow(),

  ])
}

SendTransactionScreen.prototype.renderFooter = function () {
  const {
    goHome,
    clearSend,
    errors: { amount: amountError, to: toError },
  } = this.props

  const noErrors = !amountError && toError === null
  const errorClass = noErrors ? '' : '__disabled'

  return h('div.send-v2__footer', [
    h('button.send-v2__cancel-btn', {
      onClick: () => {
        clearSend()
        goHome()
      },
    }, 'Cancel'),
    h(`button.send-v2__next-btn${errorClass}`, {
      onClick: event => this.onSubmit(event),
    }, 'Next'),
  ])
}

SendTransactionScreen.prototype.render = function () {
  return (

    h('div.send-v2__container', [

      this.renderHeader(),

      this.renderForm(),

      this.renderFooter(),
    ])

  )
}

SendTransactionScreen.prototype.addToAddressBookIfNew = function (newAddress) {
  const { toAccounts, addToAddressBook } = this.props
  if (!toAccounts.find(({ address }) => newAddress === address)) {
    // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
    addToAddressBook(newAddress)
  }
}

SendTransactionScreen.prototype.onSubmit = function (event) {
  event.preventDefault()
  const {
    from: {address: from},
    to,
    amount,
    gasLimit: gas,
    gasPrice,
    signTokenTx,
    signTx,
    selectedToken,
    editingTransactionId,
    errors: { amount: amountError, to: toError },
    backToConfirmScreen,
  } = this.props

  const noErrors = !amountError && toError === null

  if (!noErrors) {
    return
  }

  this.addToAddressBookIfNew(to)

  if (editingTransactionId) {
    backToConfirmScreen(editingTransactionId)
    return
  }

  const txParams = {
    from,
    value: '0',
    gas,
    gasPrice,
  }

  if (!selectedToken) {
    txParams.value = amount
    txParams.to = to
  }

  selectedToken
    ? signTokenTx(selectedToken.address, to, amount, txParams)
    : signTx(txParams)
}
