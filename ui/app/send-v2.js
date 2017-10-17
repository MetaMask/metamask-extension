const { inherits } = require('util')
const PersistentForm = require('../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect

const Identicon = require('./components/identicon')
const FromDropdown = require('./components/send/from-dropdown')
const ToAutoComplete = require('./components/send/to-autocomplete')
const CurrencyDisplay = require('./components/send/currency-display')
const MemoTextArea = require('./components/send/memo-textarea')
const GasFeeDisplay = require('./components/send/gas-fee-display-v2')

const { showModal } = require('./actions')

module.exports = SendTransactionScreen

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  PersistentForm.call(this)

  this.state = {
    from: '',
    to: '',
    gasPrice: null,
    gasLimit: null,
    amount: '0x0', 
    txData: null,
    memo: '',
    dropdownOpen: false,
  }

  this.handleToChange = this.handleToChange.bind(this)
  this.handleAmountChange = this.handleAmountChange.bind(this)
}

SendTransactionScreen.prototype.componentWillMount = function () {
  const {
    updateTokenExchangeRate,
    selectedToken = {},
    getGasPrice,
    estimateGas,
    selectedAddress,
    data,
  } = this.props
  const { symbol } = selectedToken || {}

  const estimateGasParams = {
    from: selectedAddress,
    gas: '746a528800',
  }

  if (symbol) {
    updateTokenExchangeRate(symbol)
    Object.assign(estimateGasParams, { value: '0x0' })
  }

  if (data) {
    Object.assign(estimateGasParams, { data })
  }

  Promise.all([
    getGasPrice(),
    estimateGas({
      from: selectedAddress,
      gas: '746a528800',
    }),
  ])
}

SendTransactionScreen.prototype.renderHeaderIcon = function () {
  const { selectedToken } = this.props

  return h('div.send-v2__send-header-icon-container', [
    selectedToken
      ? h(Identicon, {
        diameter: 40,
        address: selectedToken.address,
      })
      : h('img.send-v2__send-header-icon', { src: '../images/eth_logo.svg' })
  ])
}

SendTransactionScreen.prototype.renderTitle = function () {
  const { selectedToken } = this.props

  return h('div.send-v2__title', [selectedToken ? 'Send Tokens' : 'Send Funds'])
}

SendTransactionScreen.prototype.renderCopy = function () {
  const { selectedToken } = this.props

  const tokenText = selectedToken ? 'tokens' : 'ETH'

  return h('div', [

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

    this.renderTitle(),

    this.renderCopy(),
  ])
}

SendTransactionScreen.prototype.renderFromRow = function () {
  const {
    fromAccounts,
    conversionRate,
    selectedAccount,
    setSelectedAddress,
  } = this.props

  const { dropdownOpen } = this.state

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'From:'),

    h(FromDropdown, {
      dropdownOpen,
      accounts: fromAccounts,
      selectedAccount,
      onSelect: address => setSelectedAddress(address),
      openDropdown: () => this.setState({ dropdownOpen: true }),
      closeDropdown: () => this.setState({ dropdownOpen: false }),
      conversionRate,
    }),

  ])
}

SendTransactionScreen.prototype.handleToChange = function (event) {
  const to = event.target.value

  this.setState({
    ...this.state,
    to,
  })
}

SendTransactionScreen.prototype.renderToRow = function () {
  const { toAccounts } = this.props
  const { to } = this.state

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'To:'),

    h(ToAutoComplete, {
      to,
      accounts: toAccounts,
      onChange: this.handleToChange,
    }),

  ])
}

SendTransactionScreen.prototype.handleAmountChange = function (value) {
  const amount = value

  this.setState({
    ...this.state,
    amount,
  })
}

SendTransactionScreen.prototype.renderAmountRow = function () {
  const {
    conversionRate,
    tokenToUSDRate,
    selectedToken,
    primaryCurrency = 'ETH',
  } = this.props

  const { amount } = this.state

  const amountConversionRate = selectedToken ? tokenToUSDRate : conversionRate

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'Amount:'),

    h(CurrencyDisplay, {
      primaryCurrency,
      convertedCurrency: 'USD',
      value: amount,
      conversionRate: amountConversionRate,
      convertedPrefix: '$',
      handleChange: this.handleAmountChange
    }),        

  ])
}

SendTransactionScreen.prototype.renderGasRow = function () {
  const {
    conversionRate,
    showCustomizeGasModal,
    gasLimit,
    gasPrice,
  } = this.props

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'Gas fee:'),

    h(GasFeeDisplay, {
      gasLimit,
      gasPrice,
      conversionRate,
      onClick: showCustomizeGasModal,
    }),

    h('div.send-v2__sliders-icon-container', {
      onClick: showCustomizeGasModal,
    }, [
      h('i.fa.fa-sliders.send-v2__sliders-icon'),
    ])          

  ])
}

SendTransactionScreen.prototype.renderMemoRow = function () {
  const { memo } = this.state

  return h('div.send-v2__form-row', [

    h('div.send-v2__form-label', 'Transaction Memo:'),

    h(MemoTextArea, {
      memo,
      onChange: (event) => {
        this.setState({
          ...this.state,
          memo: event.target.value,
        })
      },
    }),

  ])
}

SendTransactionScreen.prototype.renderForm = function () {
  return h('div.send-v2__form', {}, [

    this.renderFromRow(),

    this.renderToRow(),

    this.renderAmountRow(),

    this.renderGasRow(),

    this.renderMemoRow(),

  ])
}

SendTransactionScreen.prototype.renderFooter = function () {
  const { goHome } = this.props

  return h('div.send-v2__footer', [
    h('button.send-v2__cancel-btn', {
      onClick: goHome,
    }, 'Cancel'),
    h('button.send-v2__next-btn', {
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
    to,
    amount,
  } = this.state
  const {
    gasLimit: gas,
    gasPrice,
    signTokenTx,
    signTx,
    selectedToken,
    selectedAccount: { address: from },
    toAccounts,
  } = this.props

  this.addToAddressBookIfNew(to)

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
