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
import { getMetaMaskAccounts } from '../../../../ui/app/selectors'

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
      amount: '',
      isLoading: true,
    }
    PersistentForm.call(this)
  }
  render () {
    const { isLoading, token, amount } = this.state
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
            onChange={() => this.recipientDidChange.bind(this)}
            network={network}
            identities={identities}
            addressBook={addressBook}
          />
        </section>
        <section className="flex-row flex-center">
          <input className="large-input"
            name="amount"
            value={amount}
            onChange={(e) => this.amountDidChange(e.target.value)}
            placeholder="Amount"
            type="number"
            style={{
              marginRight: '6px',
            }}
          />
          <button
            onClick={() => this.onSubmit()}
            disabled={nextDisabled}
          >Next
          </button>
        </section>
      </div>
    )
  }

  componentDidMount () {
    this.getTokensMetadata()
    .then(() => {
      this.createFreshTokenTracker()
    })
  }

  async getTokensMetadata () {
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

  componentWillUnmount () {
    this.props.displayWarning()
    if (!this.tracker) return
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

  createFreshTokenTracker () {
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
    this.setState({
      amount,
    })
  }

  async onSubmit () {
    const state = this.state || {}
    const { token, amount } = state
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

    if ((isInvalidChecksumAddress(recipient))) {
      message = 'Recipient address checksum is invalid.'
      return this.props.displayWarning(message)
    }

    if (!isValidAddress(recipient) || (!recipient)) {
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
      x => ('00' + x.toString(16)).slice(-2)
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
      confTxScreenParams
    ) => dispatch(actions.signTokenTx(tokenAddress, toAddress, tokensValueWithDec, txParams, confTxScreenParams)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTransactionScreen)
