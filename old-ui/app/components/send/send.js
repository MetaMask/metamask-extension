import React from 'react'
import PersistentForm from '../../../lib/persistent-form'
import { connect } from 'react-redux'
import actions from '../../../../ui/app/actions'
import {
  numericBalance,
  isHex,
  normalizeEthStringToWei,
  isInvalidChecksumAddress,
  isValidAddress,
} from '../../util'
import EnsInput from '../ens-input'
import ethUtil from 'ethereumjs-util'
import SendProfile from './send-profile'
import SendHeader from './send-header'
import ErrorComponent from '../error'
import { getMetaMaskAccounts, getGasTotal, getTokenBalance, getCurrentEthBalance, getSendToken, getSendTo } from '../../../../ui/app/selectors'
import * as Toast from '../toast'
import AmountMaxButton from './amount-max-button'

const optionalDataLabelStyle = {
  background: '#ffffff',
  color: '#333333',
  marginTop: '16px',
}
const optionalDataValueStyle = {
  width: '100%',
  resize: 'none',
}

class SendTransactionScreen extends PersistentForm {
  constructor (props) {
    super(props)
    this.state = {
      pendingNonce: null,
      recipient: null,
    }
  }

  async fetchPendingNonce () {
    const pendingNonce = await this.props.getPendingNonce(this.props.address)
    this.setState({pendingNonce: pendingNonce})
  }

  render () {
    this.persistentFormParentId = 'send-tx-form'

    const props = this.props
    const {
      network,
      identities,
      addressBook,
      error,
      updateSendTo,
    } = props

    return (
      <div className="send-screen flex-column flex-grow">
        <Toast.ToastComponent type={Toast.TOAST_TYPE_ERROR} />
        <SendProfile/>

        <SendHeader
          title= "Send Transaction"
        />

        <ErrorComponent
          error={error}
        />

        <section className="flex-row flex-center">
          <EnsInput
            name="address"
            placeholder="Recipient Address"
            onChange={this.recipientDidChange.bind(this)}
            network={network}
            identities={identities}
            addressBook={addressBook}
            value={this.state.recipient || ''}
            updateSendTo={updateSendTo}
          />
        </section>

        <section className="flex-row flex-center">

          <input className="large-input"
            name= "amount"
            placeholder= "Amount"
            type= "number"
            style= {{
              marginRight: '6px',
            }}
            dataset={{
              persistentFormid: 'tx-amount',
            }}
            disabled={!!this.props.maxModeOn}
            value={this.props.amount || ''}
            onChange={(e) => {
              const newAmount = e.target.value
              this.props.updateSendAmount(newAmount)
            }}
          />

          <button
            onClick={this.onSubmit.bind(this)}>
              Next
          </button>

        </section>
        <section className="flex-row flex-left amount-max-container"><AmountMaxButton /></section>

        <h3 className="flex-center"
          style={optionalDataLabelStyle}
        >
          Transaction Data (optional)
        </h3>

        <section className="flex-column flex-center">
          <input className="large-input"
            name= "txData"
            placeholder= "e.g. 0x01234"
            style={optionalDataValueStyle}
            dataset={{
              persistentFormid: 'tx-data',
            }}
            onChange={(e) => {
              const newTxData = e.target.value
              this.props.updateSendHexData(newTxData)
            }}
          />
        </section>

        <h3 className="flex-center"
          style={optionalDataLabelStyle}
        >
          Custom nonce (optional)
        </h3>

        <section className="flex-column flex-center">
          <input className="large-input"
            name= "txCustomNonce"
            type= "number"
            placeholder= "e.g. 42"
            style={optionalDataValueStyle}
            dataset={{
              persistentFormid: 'tx-custom-nonce',
            }}
            defaultValue={this.state.pendingNonce}
          />
        </section>
      </div>
    )
  }

  componentDidMount () {
    this._isMounted = true
    if (this._isMounted) {
      this.fetchPendingNonce()
    }
  }

  componentWillUnmount () {
    this.props.displayWarning('')
    this.props.updateSendAmount(null)
    this.props.setMaxModeTo(false)
    this.props.updateSendTo('')
    this._isMounted = false
  }

  navigateToAccounts (event) {
    event.stopPropagation()
    this.props.showAccountsPage()
  }

  recipientDidChange (recipient, nickname) {
    this.setState({
      recipient: recipient,
      nickname: nickname,
    })
    this.props.updateSendTo(recipient, nickname)
  }

  onSubmit () {
    const state = this.state || {}
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
    const input = document.querySelector('input[name="amount"]').value
    const parts = input.split('.')

    let message

    if (isNaN(input) || input === '') {
      message = 'Invalid ether value.'
      return this.props.displayWarning(message)
    }

    if (parts[1]) {
      const decimal = parts[1]
      if (decimal.length > 18) {
        message = 'Ether amount is too precise.'
        return this.props.displayWarning(message)
      }
    }

    const value = normalizeEthStringToWei(input)
    const txData = document.querySelector('input[name="txData"]').value
    const txCustomNonce = document.querySelector('input[name="txCustomNonce"]').value
    const balance = this.props.balance

    if (value.gt(balance)) {
      message = 'Insufficient funds.'
      return this.props.displayWarning(message)
    }

    if (input < 0) {
      message = 'Can not send negative amounts of ETH.'
      return this.props.displayWarning(message)
    }

    if ((isInvalidChecksumAddress(recipient, this.props.network))) {
      message = 'Recipient address checksum is invalid.'
      return this.props.displayWarning(message)
    }

    if ((!isValidAddress(recipient, this.props.network) && !txData) || (!recipient && !txData)) {
      message = 'Recipient address is invalid.'
      return this.props.displayWarning(message)
    }

    if (!isHex(ethUtil.stripHexPrefix(txData)) && txData) {
      message = 'Transaction data must be hex string.'
      return this.props.displayWarning(message)
    }

    this.props.hideWarning()

    this.props.addToAddressBook(recipient, nickname)

    const txParams = {
      from: this.props.address,
      value: '0x' + value.toString(16),
    }

    if (recipient) txParams.to = ethUtil.addHexPrefix(recipient)
    if (txData) txParams.data = txData
    if (txCustomNonce) txParams.nonce = '0x' + parseInt(txCustomNonce, 10).toString(16)

    this.props.signTx(txParams)
  }
}

function mapStateToProps (state) {
  const accounts = getMetaMaskAccounts(state)
  const balance = getCurrentEthBalance(state)
  const gasTotal = getGasTotal(state)
  const result = {
    send: state.metamask.send,
    address: state.metamask.selectedAddress,
    accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
    network: state.metamask.network,
    addressBook: state.metamask.addressBook,
    balance,
    gasTotal,
    to: getSendTo(state),
    sendToken: getSendToken(state),
    tokenBalance: getTokenBalance(state),
    amount: state.metamask.send.amount,
    maxModeOn: state.metamask.send.maxModeOn,
    blockGasLimit: state.metamask.currentBlockGasLimit,
  }

  result.error = result.warning && result.warning.split('.')[0]
  result.account = result.accounts[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

function mapDispatchToProps (dispatch) {
  return {
    addToAddressBook: (recipient, nickname) => dispatch(actions.addToAddressBook(recipient, nickname)),
    showAccountsPage: () => dispatch(actions.showAccountsPage()),
    displayWarning: (msg) => dispatch(actions.displayWarning(msg)),
    hideWarning: () => dispatch(actions.hideWarning()),
    getPendingNonce: (address) => dispatch(actions.getPendingNonce(address)),
    signTx: (txParams) => dispatch(actions.signTx(txParams)),
    updateSendAmount: (amount) => dispatch(actions.updateSendAmount(amount)),
    setMaxModeTo: (maxMode) => dispatch(actions.setMaxModeTo(maxMode)),
    updateSendTo: (to, nickname) => dispatch(actions.updateSendTo(to, nickname)),
    updateSendHexData: (txData) => dispatch(actions.updateSendHexData(txData)),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SendTransactionScreen)
