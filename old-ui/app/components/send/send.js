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
import { getMetaMaskAccounts } from '../../../../ui/app/selectors'
import * as Toast from '../toast'

const optionalDataLabelStyle = {
  background: '#ffffff',
  color: '#333333',
  marginTop: '16px',
  marginBottom: '16px',
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
    }
  }

  async getPendingNonce () {
    const pendingNonce = await this.props.dispatch(actions.getPendingNonce(this.props.address))
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
          />

          <button
            onClick={this.onSubmit.bind(this)}>
              Next
            </button>

        </section>

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
    this.getPendingNonce()
  }

  componentWillUnmount () {
    this.props.dispatch(actions.displayWarning(''))
  }

  navigateToAccounts (event) {
    event.stopPropagation()
    this.props.dispatch(actions.showAccountsPage())
  }

  recipientDidChange (recipient, nickname) {
    this.setState({
      recipient: recipient,
      nickname: nickname,
    })
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
      return this.props.dispatch(actions.displayWarning(message))
    }

    if (parts[1]) {
      const decimal = parts[1]
      if (decimal.length > 18) {
        message = 'Ether amount is too precise.'
        return this.props.dispatch(actions.displayWarning(message))
      }
    }

    const value = normalizeEthStringToWei(input)
    const txData = document.querySelector('input[name="txData"]').value
    const txCustomNonce = document.querySelector('input[name="txCustomNonce"]').value
    const balance = this.props.balance

    if (value.gt(balance)) {
      message = 'Insufficient funds.'
      return this.props.dispatch(actions.displayWarning(message))
    }

    if (input < 0) {
      message = 'Can not send negative amounts of ETH.'
      return this.props.dispatch(actions.displayWarning(message))
    }

    if ((isInvalidChecksumAddress(recipient, this.props.network))) {
      message = 'Recipient address checksum is invalid.'
      return this.props.dispatch(actions.displayWarning(message))
    }

    if ((!isValidAddress(recipient, this.props.network) && !txData) || (!recipient && !txData)) {
      message = 'Recipient address is invalid.'
      return this.props.dispatch(actions.displayWarning(message))
    }

    if (!isHex(ethUtil.stripHexPrefix(txData)) && txData) {
      message = 'Transaction data must be hex string.'
      return this.props.dispatch(actions.displayWarning(message))
    }

    this.props.dispatch(actions.hideWarning())

    this.props.dispatch(actions.addToAddressBook(recipient, nickname))

    const txParams = {
      from: this.props.address,
      value: '0x' + value.toString(16),
    }

    if (recipient) txParams.to = ethUtil.addHexPrefix(recipient)
    if (txData) txParams.data = txData
    if (txCustomNonce) txParams.nonce = '0x' + parseInt(txCustomNonce, 10).toString(16)

    this.props.dispatch(actions.signTx(txParams))
  }
}

function mapStateToProps (state) {
  const accounts = getMetaMaskAccounts(state)
  const result = {
    address: state.metamask.selectedAddress,
    accounts,
    identities: state.metamask.identities,
    warning: state.appState.warning,
    network: state.metamask.network,
    addressBook: state.metamask.addressBook,
  }

  result.error = result.warning && result.warning.split('.')[0]
  result.account = result.accounts[result.address]
  result.balance = result.account ? numericBalance(result.account.balance) : null

  return result
}

module.exports = connect(mapStateToProps)(SendTransactionScreen)
