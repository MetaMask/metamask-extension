const { inherits } = require('util')
const PropTypes = require('prop-types')
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')

const {
  conversionGreaterThan,
} = require('./conversion-util')
const {
  calcTokenAmount,
} = require('./token-util')
const {
  isBalanceSufficient,
  isTokenBalanceSufficient,
  getGasTotal,
} = require('./components/send/send-utils')

import PageContainer from './components/page-container/page-container.component'
import SendHeader from './components/send_/send-header/send-header.container'
import SendContent from './components/send_/send-content/send-content.component'
import SendFooter from './components/send_/send-footer/send-footer.container'

SendTransactionScreen.contextTypes = {
  t: PropTypes.func,
}

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
    gasLoadingError: false,
  }

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
  this.updateGas()
}

SendTransactionScreen.prototype.updateGas = function () {
  const {
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

  const tokenBalancePromise = tokenContract
    ? tokenContract.balanceOf(from.address)
    : Promise.resolve()
  tokenBalancePromise
      .then(usersToken => this.updateSendTokenBalance(usersToken))

  if (!editingTransactionId) {
    const estimateGasParams = getParamsForGasEstimate(selectedAddress, symbol, data)

    Promise
      .all([
        getGasPrice(),
        estimateGas(estimateGasParams),
      ])
      .then(([gasPrice, gas]) => {
        const newGasTotal = getGasTotal(gas, gasPrice)
        updateGasTotal(newGasTotal)
        this.setState({ gasLoadingError: false })
      })
      .catch(err => {
        this.setState({ gasLoadingError: true })
      })
  } else {
    const newGasTotal = getGasTotal(gasLimit, gasPrice)
    updateGasTotal(newGasTotal)
  }
}

SendTransactionScreen.prototype.componentDidUpdate = function (prevProps) {
  const {
    from: { balance },
    gasTotal,
    tokenBalance,
    amount,
    selectedToken,
    network,
  } = this.props

  const {
    from: { balance: prevBalance },
    gasTotal: prevGasTotal,
    tokenBalance: prevTokenBalance,
    network: prevNetwork,
  } = prevProps

  const uninitialized = [prevBalance, prevGasTotal].every(n => n === null)

  const balanceHasChanged = balance !== prevBalance
  const gasTotalHasChange = gasTotal !== prevGasTotal
  const tokenBalanceHasChanged = selectedToken && tokenBalance !== prevTokenBalance
  const amountValidationChange = balanceHasChanged || gasTotalHasChange || tokenBalanceHasChanged

  if (!uninitialized) {
    if (amountValidationChange) {
      this.validateAmount(amount)
    }

    if (network !== prevNetwork && network !== 'loading') {
      this.updateGas()
    }
  }
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

  let sufficientBalance = true

  if (gasTotal) {
    sufficientBalance = isBalanceSufficient({
      amount: selectedToken ? '0x0' : amount,
      gasTotal,
      balance,
      primaryCurrency,
      amountConversionRate,
      conversionRate,
    })
  }

  const verifyTokenBalance = selectedToken && tokenBalance !== null
  let sufficientTokens
  if (verifyTokenBalance) {
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

  if (conversionRate && !sufficientBalance) {
    amountError = 'insufficientFunds'
  } else if (verifyTokenBalance && !sufficientTokens) {
    amountError = 'insufficientTokens'
  } else if (amountLessThanZero) {
    amountError = 'negativeETH'
  }

  updateSendErrors({ amount: amountError })
}

SendTransactionScreen.prototype.render = function () {
  const { history } = this.props

  return (

    h(PageContainer, [

      h(SendHeader),

      h(SendContent),

      h(SendFooter, { history }),
    ])

  )
}
