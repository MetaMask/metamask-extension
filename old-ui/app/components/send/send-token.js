const inherits = require('util').inherits
const PersistentForm = require('../../../lib/persistent-form')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../../ui/app/actions')
const {
  numericBalance,
  isInvalidChecksumAddress,
  isValidAddress,
} = require('../../util')
const EnsInput = require('../ens-input')
const ethUtil = require('ethereumjs-util')
const { tokenInfoGetter, calcTokenAmountWithDec } = require('../../../../ui/app/token-util')
const TokenTracker = require('eth-token-watcher')
const Loading = require('../loading')
const BigNumber = require('bignumber.js')
BigNumber.config({ ERRORS: false })
const log = require('loglevel')
import SendProfile from './send-profile'
import SendHeader from './send-header'
import ErrorComponent from '../error'
import { getMetaMaskAccounts } from '../../../../ui/app/selectors'

module.exports = connect(mapStateToProps)(SendTransactionScreen)

function mapStateToProps (state) {
  const accounts = getMetaMaskAccounts(state)
  var result = {
    address: state.metamask.selectedAddress,
    accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
    network: state.metamask.network,
    addressBook: state.metamask.addressBook,
    tokenAddress: state.appState.currentView.tokenAddress,
  }

  result.error = result.warning && result.warning.split('.')[0]

  result.account = result.accounts[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

inherits(SendTransactionScreen, PersistentForm)
function SendTransactionScreen () {
  this.state = {
    token: {
      address: '',
      symbol: '',
      balance: 0,
      decimals: 0,
    },
    isLoading: true,
  }
  PersistentForm.call(this)
}

SendTransactionScreen.prototype.render = function () {
  const { isLoading, token } = this.state
  if (isLoading) {
    return h(Loading, {
      isLoading: isLoading,
      loadingMessage: 'Loading...',
    })
  }
  this.persistentFormParentId = 'send-tx-form'

  const props = this.props
  const {
    network,
    identities,
    addressBook,
    error,
  } = props

  return (

    h('.send-screen.flex-column.flex-grow', [

      //
      // Sender Profile
      //

      h(SendProfile, {
        isToken: true,
        token,
      }),

      //
      // Send Header
      //

      h(SendHeader, {
        title: `Send ${this.state.token.symbol} Tokens`,
      }),

      // error message
      h(ErrorComponent, {
        error,
      }),

      // 'to' field
      h('section.flex-row.flex-center', [
        h(EnsInput, {
          name: 'address',
          placeholder: 'Recipient Address',
          onChange: this.recipientDidChange.bind(this),
          network,
          identities,
          addressBook,
        }),
      ]),

      // 'amount' and send button
      h('section.flex-row.flex-center', [

        h('input.large-input', {
          name: 'amount',
          placeholder: 'Amount',
          type: 'number',
          style: {
            marginRight: '6px',
          },
          dataset: {
            persistentFormId: 'tx-amount',
          },
        }),

        h('button', {
          onClick: this.onSubmit.bind(this),
        }, 'Next'),

      ]),
    ])
  )
}

SendTransactionScreen.prototype.componentDidMount = function () {
  this.getTokensMetadata()
  .then(() => {
    this.createFreshTokenTracker()
  })
}

SendTransactionScreen.prototype.getTokensMetadata = async function () {
  this.setState({isLoading: true})
  this.tokenInfoGetter = tokenInfoGetter()
  const { tokenAddress, network } = this.props
  const { symbol = '', decimals = 0 } = await this.tokenInfoGetter(tokenAddress)
  this.setState({
    token: {
      address: tokenAddress,
      network,
      symbol,
      decimals,
    },
  })

  return Promise.resolve()
}

SendTransactionScreen.prototype.componentWillUnmount = function () {
  this.props.dispatch(actions.displayWarning(''))
  if (!this.tracker) return
  this.tracker.stop()
  this.tracker.removeListener('update', this.balanceUpdater)
  this.tracker.removeListener('error', this.showError)
}

SendTransactionScreen.prototype.createFreshTokenTracker = function () {
  this.setState({isLoading: true})
  const { address, tokenAddress } = this.props
  if (!isValidAddress(tokenAddress)) return
  if (this.tracker) {
    // Clean up old trackers when refreshing:
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

  if (!global.ethereumProvider) return

  this.tracker = new TokenTracker({
    userAddress: address,
    provider: global.ethereumProvider,
    tokens: [this.state.token],
    pollingInterval: 8000,
  })


  // Set up listener instances for cleaning up
  this.balanceUpdater = this.updateBalances.bind(this)
  this.showError = (error) => {
    this.setState({ error, isLoading: false })
  }
  this.tracker.on('update', this.balanceUpdater)
  this.tracker.on('error', this.showError)

  this.tracker.updateBalances()
  .then(() => {
    this.updateBalances(this.tracker.serialize())
  })
  .catch((reason) => {
    log.error(`Problem updating balances`, reason)
    this.setState({ isLoading: false })
  })
}

SendTransactionScreen.prototype.updateBalances = function (tokens) {
  if (!this.tracker.running) {
    return
  }
  this.setState({ token: (tokens && tokens[0]), isLoading: false })
}

SendTransactionScreen.prototype.navigateToAccounts = function (event) {
  event.stopPropagation()
  this.props.dispatch(actions.showAccountsPage())
}

SendTransactionScreen.prototype.recipientDidChange = function (recipient, nickname) {
  this.setState({
    recipient: recipient,
    nickname: nickname,
  })
}

SendTransactionScreen.prototype.onSubmit = async function () {
  const state = this.state || {}
  const { token } = state
  const recipient = state.recipient || document.querySelector('input[name="address"]').value.replace(/^[.\s]+|[.\s]+$/g, '')
  const nickname = state.nickname || ' '
  const input = document.querySelector('input[name="amount"]').value
  const parts = input.split('.')

  let message

  if (isNaN(input) || input === '') {
    message = 'Invalid token\'s amount.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (parts[1]) {
    var decimal = parts[1]
    if (decimal.length > 18) {
      message = 'Token\'s amount is too precise.'
      return this.props.dispatch(actions.displayWarning(message))
    }
  }

  const tokenAddress = ethUtil.addHexPrefix(token.address)
  const tokensValueWithoutDec = new BigNumber(input)
  const tokensValueWithDec = new BigNumber(calcTokenAmountWithDec(input, token.decimals))

  if (tokensValueWithDec.gt(token.balance)) {
    message = 'Insufficient token\'s balance.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (input < 0) {
    message = 'Can not send negative amounts of ETH.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if ((isInvalidChecksumAddress(recipient))) {
    message = 'Recipient address checksum is invalid.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  if (!isValidAddress(recipient) || (!recipient)) {
    message = 'Recipient address is invalid.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  this.props.dispatch(actions.hideWarning())

  this.props.dispatch(actions.addToAddressBook(recipient, nickname))

  var txParams = {
    from: this.props.address,
    value: '0x',
  }

  const toAddress = ethUtil.addHexPrefix(recipient)

  txParams.to = tokenAddress

  const tokensAmount = `0x${input.toString(16)}`
  const encoded = this.generateTokenTransferData({toAddress, amount: tokensAmount})
  txParams.data = encoded

  const confTxScreenParams = {
    isToken: true,
    tokenSymbol: token.symbol,
    tokensToSend: tokensValueWithoutDec,
    tokensTransferTo: toAddress,
  }

  this.props.dispatch(actions.signTokenTx(tokenAddress, toAddress, tokensValueWithDec, txParams, confTxScreenParams))
}

SendTransactionScreen.prototype.generateTokenTransferData = function ({ toAddress = '0x0', amount = '0x0' }) {
  const TOKEN_TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb'
  const abi = require('ethereumjs-abi')
  return TOKEN_TRANSFER_FUNCTION_SIGNATURE + Array.prototype.map.call(
    abi.rawEncode(['address', 'uint256'], [toAddress, ethUtil.addHexPrefix(amount)]),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('')
}
