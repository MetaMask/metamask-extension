// const { inherits } = require('util')
// const PersistentForm = require('../lib/persistent-form')
// const h = require('react-hyperscript')
// const connect = require('react-redux').connect
// const Identicon = require('./components/identicon')
// const EnsInput = require('./components/ens-input')
// const GasTooltip = require('./components/send/gas-tooltip')
// const CurrencyToggle = require('./components/send/currency-toggle')
// const GasFeeDisplay = require('./components/send/gas-fee-display')
// const { getSelectedIdentity } = require('./selectors')

// const {
//   showAccountsPage,
//   backToAccountDetail,
//   displayWarning,
//   hideWarning,
//   addToAddressBook,
//   signTx,
//   estimateGas,
//   getGasPrice,
// } = require('./actions')
// const { stripHexPrefix, addHexPrefix } = require('ethereumjs-util')
// const { isHex, numericBalance, isValidAddress, allNull } = require('./util')
// const { conversionUtil, conversionGreaterThan } = require('./conversion-util')

// module.exports = connect(mapStateToProps)(SendTransactionScreen)

// function mapStateToProps (state) {
//   const {
//     selectedAddress: address,
//     accounts,
//     identities,
//     network,
//     addressBook,
//     conversionRate,
//     currentBlockGasLimit: blockGasLimit,
//   } = state.metamask
//   const { warning } = state.appState
//   const selectedIdentity = getSelectedIdentity(state)
//   const account = accounts[address]

//   return {
//     address,
//     accounts,
//     identities,
//     network,
//     addressBook,
//     conversionRate,
//     blockGasLimit,
//     warning,
//     selectedIdentity,
//     error: warning && warning.split('.')[0],
//     account,
//     identity: identities[address],
//     balance: account ? account.balance : null,
//   }
// }

// inherits(SendTransactionScreen, PersistentForm)
// function SendTransactionScreen () {
//   PersistentForm.call(this)

//   // [WIP] These are the bare minimum of tx props needed to sign a transaction
//   // We will need a few more for contract-related interactions
//   this.state = {
//     newTx: {
//       from: '',
//       to: '',
//       amountToSend: '0x0',
//       gasPrice: null,
//       gas: null,
//       amount: '0x0',
//       txData: null,
//       memo: '',
//     },
//     activeCurrency: 'USD',
//     tooltipIsOpen: false,
//     errors: {},
//     isValid: false,
//   }

//   this.back = this.back.bind(this)
//   this.closeTooltip = this.closeTooltip.bind(this)
//   this.onSubmit = this.onSubmit.bind(this)
//   this.setActiveCurrency = this.setActiveCurrency.bind(this)
//   this.toggleTooltip = this.toggleTooltip.bind(this)
//   this.validate = this.validate.bind(this)
//   this.getAmountToSend = this.getAmountToSend.bind(this)
//   this.setErrorsFor = this.setErrorsFor.bind(this)
//   this.clearErrorsFor = this.clearErrorsFor.bind(this)

//   this.renderFromInput = this.renderFromInput.bind(this)
//   this.renderToInput = this.renderToInput.bind(this)
//   this.renderAmountInput = this.renderAmountInput.bind(this)
//   this.renderGasInput = this.renderGasInput.bind(this)
//   this.renderMemoInput = this.renderMemoInput.bind(this)
//   this.renderErrorMessage = this.renderErrorMessage.bind(this)
// }

// SendTransactionScreen.prototype.componentWillMount = function () {
//   const { newTx } = this.state
//   const { address } = this.props

//   Promise.all([
//     this.props.dispatch(getGasPrice()),
//     this.props.dispatch(estimateGas({
//       from: address,
//       gas: '746a528800',
//     })),
//   ])
//   .then(([blockGasPrice, estimatedGas]) => {
//     console.log({ blockGasPrice, estimatedGas})
//     this.setState({
//       newTx: {
//         ...newTx,
//         gasPrice: blockGasPrice,
//         gas: estimatedGas,
//       },
//     })
//   })
// }

// SendTransactionScreen.prototype.renderErrorMessage = function(errorType, warning) {
//   const { errors } = this.state
//   const errorMessage = errors[errorType];

//   return errorMessage || warning
//     ? h('div.send-screen-input-wrapper__error-message', [ errorMessage || warning ])
//     : null
// }

// SendTransactionScreen.prototype.renderFromInput = function (from, identities) {
//   return h('div.send-screen-input-wrapper', [

//     h('div', 'From:'),

//     h('input.large-input.send-screen-input', {
//       list: 'accounts',
//       placeholder: 'Account',
//       value: from,
//       onChange: (event) => {
//         this.setState({
//           newTx: {
//             ...this.state.newTx,
//             from: event.target.value,
//           },
//         })
//       },
//       onBlur: () => this.setErrorsFor('from'),
//       onFocus: event => {
//         this.clearErrorsFor('from')
//         this.state.newTx.from && event.target.select()
//       },
//     }),

//     h('datalist#accounts', [
//       Object.entries(identities).map(([key, { address, name }]) => {
//         return h('option', {
//           value: address,
//           label: name,
//           key: address,
//         })
//       }),
//     ]),

//     this.renderErrorMessage('from'),

//   ])
// }

// SendTransactionScreen.prototype.renderToInput = function (to, identities, addressBook) {
//   return h('div.send-screen-input-wrapper', [

//     h('div', 'To:'),

//     h('input.large-input.send-screen-input', {
//       name: 'address',
//       list: 'addresses',
//       placeholder: 'Address',
//       value: to,
//       onChange: (event) => {
//         this.setState({
//           newTx: {
//             ...this.state.newTx,
//             to: event.target.value,
//           },
//         })
//       },
//       onBlur: () => {
//         this.setErrorsFor('to')
//       },
//       onFocus: event => {
//         this.clearErrorsFor('to')
//         this.state.newTx.to && event.target.select()
//       },
//     }),

//     h('datalist#addresses', [
//       // Corresponds to the addresses owned.
//       ...Object.entries(identities).map(([key, { address, name }]) => {
//         return h('option', {
//           value: address,
//           label: name,
//           key: address,
//         })
//       }),
//       // Corresponds to previously sent-to addresses.
//       ...addressBook.map(({ address, name }) => {
//         return h('option', {
//           value: address,
//           label: name,
//           key: address,
//         })
//       }),
//     ]),

//     this.renderErrorMessage('to'),

//   ])
// }

// SendTransactionScreen.prototype.renderAmountInput = function (activeCurrency) {
//   return h('div.send-screen-input-wrapper', [

//     h('div.send-screen-amount-labels', [
//       h('span', 'Amount'),
//       h(CurrencyToggle, {
//         activeCurrency,
//         onClick: (newCurrency) => this.setActiveCurrency(newCurrency),
//       }), // holding on icon from design
//     ]),

//     h('input.large-input.send-screen-input', {
//       placeholder: `0 ${activeCurrency}`,
//       type: 'number',
//       onChange: (event) => {
//         const amountToSend = event.target.value
//           ? this.getAmountToSend(event.target.value)
//           : '0x0'

//         this.setState({
//           newTx: Object.assign(
//             this.state.newTx,
//             {
//               amount: event.target.value,
//               amountToSend: amountToSend,
//             }
//           ),
//         })
//       },
//       onBlur: () => {
//         this.setErrorsFor('amount')
//       },
//       onFocus: () => this.clearErrorsFor('amount'),
//     }),

//     this.renderErrorMessage('amount'),

//   ])
// }

// SendTransactionScreen.prototype.renderGasInput = function (gasPrice, gas, activeCurrency, conversionRate, blockGasLimit) {
//   return h('div.send-screen-input-wrapper', [
//     this.state.tooltipIsOpen && h(GasTooltip, {
//       className: 'send-tooltip',
//       gasPrice,
//       gasLimit: gas,
//       onClose: this.closeTooltip,
//       onFeeChange: ({gasLimit, gasPrice}) => {
//         this.setState({
//           newTx: {
//             ...this.state.newTx,
//             gas: gasLimit,
//             gasPrice,
//           },
//         })
//       },
//     }),

//     h('div.send-screen-gas-labels', [
//       h('span', [
//         h('i.fa.fa-bolt'),
//         'Gas fee:',
//       ]),
//       h('span', 'What\'s this?'),
//     ]),

//     // TODO: handle loading time when switching to USD
//     h('div.large-input.send-screen-gas-input', {}, [
//       h(GasFeeDisplay, {
//         activeCurrency,
//         conversionRate,
//         gas,
//         gasPrice,
//         blockGasLimit,
//       }),
//       h('div.send-screen-gas-input-customize', {
//         onClick: this.toggleTooltip,
//       }, [
//         'Customize',
//       ]),
//     ]),

//   ])
// }

// SendTransactionScreen.prototype.renderMemoInput = function () {
//   return h('div.send-screen-input-wrapper', [
//     h('div', 'Transaction memo (optional)'),
//     h('input.large-input.send-screen-input', {
//       onChange: () => {
//         this.setState({
//           newTx: Object.assign(
//             this.state.newTx,
//             {
//               memo: event.target.value,
//             }
//           ),
//         })
//       },
//     }),
//   ])
// }

// SendTransactionScreen.prototype.render = function () {
//   this.persistentFormParentId = 'send-tx-form'

//   const props = this.props
//   const {
//     warning,
//     identities,
//     addressBook,
//     conversionRate,
//   } = props

//   const {
//     blockGasLimit,
//     newTx,
//     activeCurrency,
//     isValid,
//   } = this.state
//   const { gas, gasPrice } = newTx

//   return (

//     h('div.send-screen-wrapper', [
//       // Main Send token Card
//       h('div.send-screen-card', [

//         h('img.send-eth-icon', { src: '../images/eth_logo.svg' }),

//         h('div.send-screen__title', 'Send'),

//         h('div.send-screen__subtitle', 'Send Ethereum to anyone with an Ethereum account'),

//         this.renderFromInput(this.state.newTx.from, identities),

//         this.renderToInput(this.state.newTx.to, identities, addressBook),

//         this.renderAmountInput(activeCurrency),

//         this.renderGasInput(
//           gasPrice || '0x0',
//           gas || '0x0',
//           activeCurrency,
//           conversionRate,
//           blockGasLimit
//         ),

//         this.renderMemoInput(),

//         this.renderErrorMessage(null, warning),

//       ]),

//       // Buttons underneath card
//       h('section.flex-column.flex-center', [
//         h('button.btn-secondary.send-screen__send-button', {
//           className: !isValid && 'send-screen__send-button__disabled',
//           onClick: (event) => isValid && this.onSubmit(event),
//         }, 'Next'),
//         h('button.btn-tertiary.send-screen__cancel-button', {
//           onClick: this.back,
//         }, 'Cancel'),
//       ]),
//     ])

//   )
// }

// SendTransactionScreen.prototype.toggleTooltip = function () {
//   this.setState({ tooltipIsOpen: !this.state.tooltipIsOpen })
// }

// SendTransactionScreen.prototype.closeTooltip = function () {
//   this.setState({ tooltipIsOpen: false })
// }

// SendTransactionScreen.prototype.setActiveCurrency = function (newCurrency) {
//   this.setState({ activeCurrency: newCurrency })
// }

// SendTransactionScreen.prototype.back = function () {
//   var address = this.props.address
//   this.props.dispatch(backToAccountDetail(address))
// }

// SendTransactionScreen.prototype.validate = function (balance, amountToSend, { to, from }) {
//   const sufficientBalance = conversionGreaterThan(
//     {
//       value: balance,
//       fromNumericBase: 'hex',
//     },
//     {
//       value: amountToSend,
//       fromNumericBase: 'hex',
//     },
//   )

//   const amountLessThanZero = conversionGreaterThan(
//     {
//       value: 0,
//       fromNumericBase: 'dec',
//     },
//     {
//       value: amountToSend,
//       fromNumericBase: 'hex',
//     },
//   )

//   const errors = {}

//   if (!sufficientBalance) {
//     errors.amount = 'Insufficient funds.'
//   }

//   if (amountLessThanZero) {
//     errors.amount = 'Can not send negative amounts of ETH.'
//   }

//   if (!from) {
//     errors.from = 'Required'
//   }

//   if (from && !isValidAddress(from)) {
//     errors.from = 'Sender address is invalid.'
//   }

//   if (!to) {
//     errors.to = 'Required'
//   }

//   if (to && !isValidAddress(to)) {
//     errors.to = 'Recipient address is invalid.'
//   }

//   // if (txData && !isHex(stripHexPrefix(txData))) {
//   //   message = 'Transaction data must be hex string.'
//   //   return this.props.dispatch(displayWarning(message))
//   // }

//   return {
//     isValid: allNull(errors),
//     errors,
//   }
// }

// SendTransactionScreen.prototype.getAmountToSend = function (amount) {
//   const { activeCurrency } = this.state
//   const { conversionRate } = this.props

//   return conversionUtil(amount, {
//     fromNumericBase: 'dec',
//     toNumericBase: 'hex',
//     fromCurrency: activeCurrency,
//     toCurrency: 'ETH',
//     toDenomination: 'WEI',
//     conversionRate,
//     invertConversionRate: activeCurrency !== 'ETH',
//   })
// }

// SendTransactionScreen.prototype.setErrorsFor = function (field) {
//   const { balance } = this.props
//   const { newTx, errors: previousErrors } = this.state
//   const { amountToSend } = newTx

//   const {
//     isValid,
//     errors: newErrors
//   } = this.validate(balance, amountToSend, newTx)

//   const nextErrors = Object.assign({}, previousErrors, {
//     [field]: newErrors[field] || null
//   })

//   if (!isValid) {
//     this.setState({
//       errors: nextErrors,
//       isValid,
//     })
//   }
// }

// SendTransactionScreen.prototype.clearErrorsFor = function (field) {
//   const { errors: previousErrors } = this.state
//   const nextErrors = Object.assign({}, previousErrors, {
//     [field]: null
//   })

//   this.setState({
//     errors: nextErrors,
//     isValid: allNull(nextErrors),
//   })
// }

// SendTransactionScreen.prototype.onSubmit = function (event) {
//   event.preventDefault()
//   const { warning, balance } = this.props
//   const state = this.state || {}

//   const recipient = state.newTx.to
//   const sender = state.newTx.from
//   const nickname = state.nickname || ' '

//   // TODO: convert this to hex when created and include it in send
//   const txData = state.newTx.memo

//   this.props.dispatch(hideWarning())

//   this.props.dispatch(addToAddressBook(recipient, nickname))

//   var txParams = {
//     from: this.state.newTx.from,
//     to: this.state.newTx.to,

//     value: this.state.newTx.amountToSend,

//     gas: this.state.newTx.gas,
//     gasPrice: this.state.newTx.gasPrice,
//   }

//   if (recipient) txParams.to = addHexPrefix(recipient)
//   if (txData) txParams.data = txData

//   this.props.dispatch(signTx(txParams))
// }
