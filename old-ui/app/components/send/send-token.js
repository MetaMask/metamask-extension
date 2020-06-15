import React from 'react'
import PersistentForm from '../../../lib/persistent-form'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'
import {
  numericBalance,
  isInvalidChecksumAddress,
  isValidAddress,
} from '../../util'
import EnsInput from '../ens-input'
import ethUtil from 'ethereumjs-util'
import { tokenInfoGetter, calcTokenAmountWithDec } from '../../../../ui/app/token-util'
import TokenTracker from 'eth-token-watcher'
import Loading from '../loading'
import BigNumber from 'bignumber.js'
BigNumber.config({ ERRORS: false })
import log from 'loglevel'
import SendProfile from './send-profile'
import SendHeader from './send-header'
import ErrorComponent from '../error'
import { getMetaMaskAccounts, getSendToken, getSendTo, getTokenBalance, getSendTokenContract } from '../../../../ui/app/selectors'
import AmountMaxButton from './amount-max-button'

class SendTransactionScreen extends PersistentForm {
  constructor (props) {
    super(props)
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
  render () {
    const { isLoading, token } = this.state
    if (isLoading) {
      return (
        <Loading isLoading={isLoading} loadingMessage="Loading..." />
      )
    }
    this.persistentFormParentId = 'send-tx-form'

    const props = this.props
    const {
      network,
      identities,
      addressBook,
      error,
      updateSendTo,
    } = props
    const nextDisabled = token.balance <= 0

    return (

      <div className="send-screen flex-column flex-grow">
        <SendProfile isToken={true} token={token} />
        <SendHeader title={`Send ${this.state.token.symbol} Tokens`} />
        <ErrorComponent error={error} />
        <section className="flex-row flex-center">
          <EnsInput
            name="address"
            placeholder="Recipient Address"
            onChange={this.recipientDidChange.bind(this)}
            network={network}
            identities={identities}
            addressBook={addressBook}
            updateSendTo={updateSendTo}
          />
        </section>
        <section className="flex-row flex-center">
          <input className="large-input"
            name="amount"
            value={this.props.amount || ''}
            onChange={(e) => this.amountDidChange(e.target.value)}
            placeholder="Amount"
            type="number"
            style={{
              marginRight: '6px',
            }}
            disabled={!!this.props.maxModeOn}
          />
          <button
            onClick={() => this.onSubmit()}
            disabled={nextDisabled}
          >Next
          </button>
        </section>
        <section className="flex-row flex-left amount-max-container"><AmountMaxButton /></section>
      </div>
    )
  }

  componentDidMount () {
    this.getTokensMetadata()
    .then((token) => {
      this.props.updateSendToken(token)

      const {
        sendToken,
        tokenContract,
        address,
      } = this.props
      this.props.updateSendTokenBalance({sendToken, tokenContract, address})
      this.createFreshTokenTracker()
    })
  }

  async getTokensMetadata () {
    this.setState({isLoading: true})
    this.tokenInfoGetter = tokenInfoGetter()
    const { tokenAddress, network } = this.props
    const { symbol = '', decimals = 0 } = await this.tokenInfoGetter(tokenAddress)
    const token = {
      address: tokenAddress,
      network,
      symbol,
      decimals,
    }
    this.setState({
      token,
    })

    return Promise.resolve(token)
  }

  componentWillUnmount () {
    this.props.displayWarning()
    if (!this.tracker) return
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
    this.props.updateSendAmount(null)
    this.props.setMaxModeTo(false)
    this.props.updateSendTo('')
  }

  createFreshTokenTracker () {
    this.setState({isLoading: true})
    const { address, tokenAddress, network } = this.props
    if (!isValidAddress(tokenAddress, network)) return
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

  updateBalances (tokens) {
    if (!this.tracker.running) {
      return
    }
    this.setState({ token: (tokens && tokens[0]), isLoading: false })
  }

  recipientDidChange (recipient, nickname) {
    this.setState({
      recipient,
      nickname,
    })
  }

  amountDidChange (amount) {
    this.props.updateSendAmount(amount)
  }

  async onSubmit () {
    const state = this.state || {}
    const { token } = state
    const { amount } = this.props
    let recipient = state.recipient || document.querySelector('input[name="address"]').value.replace(/^[.\s]+|[.\s]+$/g, '')
    let nickname = state.nickname || ' '
    if (typeof recipient === 'object') {
      if (recipient.toAddress) {
        recipient = recipient.toAddress
      }
      if (recipient.nickname) {
        nickname = recipient.nickname
      }
    }
    const parts = amount.split('.')

    let message

    if (isNaN(amount) || amount === '') {
      message = 'Invalid token\'s amount.'
      return this.props.displayWarning(message)
    }

    if (parts[1]) {
      const decimal = parts[1]
      if (decimal.length > 18) {
        message = 'Token\'s amount is too precise.'
        return this.props.displayWarning(message)
      }
    }

    const tokenAddress = ethUtil.addHexPrefix(token.address)
    const tokensValueWithoutDec = new BigNumber(amount)
    const tokensValueWithDec = new BigNumber(calcTokenAmountWithDec(amount, token.decimals))

    if (tokensValueWithDec.gt(token.balance)) {
      message = 'Insufficient token\'s balance.'
      return this.props.displayWarning(message)
    }

    if (amount < 0) {
      message = 'Can not send negative amounts of ETH.'
      return this.props.displayWarning(message)
    }

    if ((isInvalidChecksumAddress(recipient, this.props.network))) {
      message = 'Recipient address checksum is invalid.'
      return this.props.displayWarning(message)
    }

    if (!isValidAddress(recipient, this.props.network) || (!recipient)) {
      message = 'Recipient address is invalid.'
      return this.props.displayWarning(message)
    }

    this.props.hideWarning()

    this.props.addToAddressBook(recipient, nickname)

    const txParams = {
      from: this.props.address,
      value: '0x',
    }

    const toAddress = ethUtil.addHexPrefix(recipient)

    txParams.to = tokenAddress

    const tokensAmount = `0x${amount.toString(16)}`
    const encoded = this.generateTokenTransferData({toAddress, amount: tokensAmount})
    txParams.data = encoded

    const confTxScreenParams = {
      isToken: true,
      tokenSymbol: token.symbol,
      tokensToSend: tokensValueWithoutDec,
      tokensTransferTo: toAddress,
    }

    this.props.signTokenTx(tokenAddress, toAddress, tokensValueWithDec, txParams, confTxScreenParams)
  }

  generateTokenTransferData ({ toAddress = '0x0', amount = '0x0' }) {
    const TOKEN_TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb'
    const abi = require('ethereumjs-abi')
    return TOKEN_TRANSFER_FUNCTION_SIGNATURE + Array.prototype.map.call(
      abi.rawEncode(['address', 'uint256'], [toAddress, ethUtil.addHexPrefix(amount)]),
      x => ('00' + x.toString(16)).slice(-2),
    ).join('')
  }

}


const mapStateToProps = (state) => {
  const accounts = getMetaMaskAccounts(state)
  const result = {
    address: state.metamask.selectedAddress,
    accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
    network: state.metamask.network,
    addressBook: state.metamask.addressBook,
    tokenAddress: state.appState.currentView.tokenAddress,
    to: getSendTo(state),
    sendToken: getSendToken(state),
    amount: state.metamask.send.amount,
    maxModeOn: state.metamask.send.maxModeOn,
    tokenBalance: getTokenBalance(state),
    tokenContract: getSendTokenContract(state),
  }

  result.error = result.warning && result.warning.split('.')[0]

  result.account = result.accounts[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

const mapDispatchToProps = dispatch => {
  return {
    showAccountsPage: () => dispatch(actions.showAccountsPage()),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    hideWarning: () => dispatch(actions.hideWarning()),
    addToAddressBook: (recipient, nickname) => dispatch(actions.addToAddressBook(recipient, nickname)),
    signTokenTx: (
      tokenAddress,
      toAddress,
      tokensValueWithDec,
      txParams,
      confTxScreenParams,
    ) => dispatch(actions.signTokenTx(tokenAddress, toAddress, tokensValueWithDec, txParams, confTxScreenParams)),
    updateSendTokenBalance: props => dispatch(actions.updateSendTokenBalance(props)),
    setMaxModeTo: maxMode => dispatch(actions.setMaxModeTo(maxMode)),
    updateSendAmount: amount => dispatch(actions.updateSendAmount(amount)),
    updateSendTo: (to, nickname) => dispatch(actions.updateSendTo(to, nickname)),
    updateSendToken: token => dispatch(actions.updateSendToken(token)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTransactionScreen)
