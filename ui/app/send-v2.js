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
  .then(([blockGasPrice, estimatedGas]) => {
    this.setState({
      gasPrice: blockGasPrice,
      gasLimit: estimatedGas,
    })
  })
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

SendTransactionScreen.prototype.render = function () {
  const {
    accounts,
    conversionRate,
    tokenToUSDRate,
    selectedToken,
    showCustomizeGasModal,
    selectedAccount,
    primaryCurrency = 'ETH',
  } = this.props

  const {
    dropdownOpen,
    to,
    amount,
    gasLimit,
    gasPrice,
    memo,
  } = this.state

  const amountConversionRate = selectedToken ? tokenToUSDRate : conversionRate

  return (

    h('div.send-v2__container', [
      h('div.send-v2__header', {}, [

        this.renderHeaderIcon(),

        h('div.send-v2__arrow-background', [
          h('i.fa.fa-lg.fa-arrow-circle-right.send-v2__send-arrow-icon'),
        ]),

        h('div.send-v2__header-tip'),

      ]),

      this.renderTitle(),

      this.renderCopy(),

      h('div.send-v2__form', {}, [

        h('div.send-v2__form-row', [

          h('div.send-v2__form-label', 'From:'),

          h(FromDropdown, {
            dropdownOpen,
            accounts,
            selectedAccount,
            setFromField: () => console.log('Set From Field'),
            openDropdown: () => this.setState({ dropdownOpen: true }),
            closeDropdown: () => this.setState({ dropdownOpen: false }),
            conversionRate,
          }),

        ]),

        h('div.send-v2__form-row', [

          h('div.send-v2__form-label', 'To:'),

          h(ToAutoComplete, {
            to,
            accounts,
            onChange: (event) => {
              this.setState({
                ...this.state,
                to: event.target.value,
              })
            },
          }),

        ]),

        h('div.send-v2__form-row', [

          h('div.send-v2__form-label', 'Amount:'),

          h(CurrencyDisplay, {
            primaryCurrency,
            convertedCurrency: 'USD',
            value: amount,
            conversionRate: amountConversionRate,
            convertedPrefix: '$',
            handleChange: (value) => {
              this.setState({
                ...this.state,
                amount: value,
              })
            }
          }),          

        ]),

        h('div.send-v2__form-row', [

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

        ]),

        h('div.send-v2__form-row', [

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

        ]),

      ]),

      // Buttons underneath card
      h('div.send-v2__footer', [
        h('button.send-v2__cancel-btn', {}, 'Cancel'),
        h('button.send-v2__next-btn', {}, 'Next'),
      ]),
    ])

  )
}
