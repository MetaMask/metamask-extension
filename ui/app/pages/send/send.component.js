import React from 'react'
import PropTypes from 'prop-types'
import PersistentForm from '../../../lib/persistent-form'
import {
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  doesAmountErrorRequireUpdate,
} from './send.utils'
import debounce from 'lodash.debounce'
import { getToWarningObject, getToErrorObject } from './send-content/add-recipient/add-recipient'
import SendHeader from './send-header'
import AddRecipient from './send-content/add-recipient'
import SendContent from './send-content'
import SendFooter from './send-footer'
import EnsInput from './send-content/add-recipient/ens-input'


export default class SendTransactionScreen extends PersistentForm {

  static propTypes = {
    amount: PropTypes.string,
    amountConversionRate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    blockGasLimit: PropTypes.string,
    conversionRate: PropTypes.number,
    editingTransactionId: PropTypes.string,
    from: PropTypes.object,
    gasLimit: PropTypes.string,
    gasPrice: PropTypes.string,
    gasTotal: PropTypes.string,
    to: PropTypes.string,
    history: PropTypes.object,
    network: PropTypes.string,
    primaryCurrency: PropTypes.string,
    recentBlocks: PropTypes.array,
    selectedAddress: PropTypes.string,
    selectedToken: PropTypes.object,
    tokens: PropTypes.array,
    tokenBalance: PropTypes.string,
    tokenContract: PropTypes.object,
    fetchBasicGasEstimates: PropTypes.func,
    updateAndSetGasTotal: PropTypes.func,
    updateSendErrors: PropTypes.func,
    updateSendTokenBalance: PropTypes.func,
    scanQrCode: PropTypes.func,
    qrCodeDetected: PropTypes.func,
    qrCodeData: PropTypes.object,
    ensResolution: PropTypes.string,
    ensResolutionError: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  state = {
    query: '',
    toError: null,
    toWarning: null,
  }

  constructor (props) {
    super(props)
    this.dValidate = debounce(this.validate, 1000)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.qrCodeData) {
      if (nextProps.qrCodeData.type === 'address') {
        const scannedAddress = nextProps.qrCodeData.values.address.toLowerCase()
        const currentAddress = this.props.to && this.props.to.toLowerCase()
        if (currentAddress !== scannedAddress) {
          this.props.updateSendTo(scannedAddress)
          this.updateGas({ to: scannedAddress })
          // Clean up QR code data after handling
          this.props.qrCodeDetected(null)
        }
      }
    }
  }

  componentDidUpdate (prevProps) {
    const {
      amount,
      amountConversionRate,
      conversionRate,
      from: { address, balance },
      gasTotal,
      network,
      primaryCurrency,
      selectedToken,
      tokenBalance,
      updateSendErrors,
      updateSendTokenBalance,
      tokenContract,
      to,
      toNickname,
      addressBook,
      updateToNicknameIfNecessary,
    } = this.props

    const {
      from: { balance: prevBalance },
      gasTotal: prevGasTotal,
      tokenBalance: prevTokenBalance,
      network: prevNetwork,
      selectedToken: prevSelectedToken,
    } = prevProps

    const uninitialized = [prevBalance, prevGasTotal].every(n => n === null)

    const amountErrorRequiresUpdate = doesAmountErrorRequireUpdate({
      balance,
      gasTotal,
      prevBalance,
      prevGasTotal,
      prevTokenBalance,
      selectedToken,
      tokenBalance,
    })

    if (amountErrorRequiresUpdate) {
      const amountErrorObject = getAmountErrorObject({
        amount,
        amountConversionRate,
        balance,
        conversionRate,
        gasTotal,
        primaryCurrency,
        selectedToken,
        tokenBalance,
      })
      const gasFeeErrorObject = selectedToken
        ? getGasFeeErrorObject({
          amountConversionRate,
          balance,
          conversionRate,
          gasTotal,
          primaryCurrency,
          selectedToken,
        })
        : { gasFee: null }
      updateSendErrors(Object.assign(amountErrorObject, gasFeeErrorObject))
    }

    if (!uninitialized) {

      if (network !== prevNetwork && network !== 'loading') {
        updateSendTokenBalance({
          selectedToken,
          tokenContract,
          address,
        })
        updateToNicknameIfNecessary(to, toNickname, addressBook)
        this.updateGas()
      }
    }

    const prevTokenAddress = prevSelectedToken && prevSelectedToken.address
    const selectedTokenAddress = selectedToken && selectedToken.address

    if (selectedTokenAddress && prevTokenAddress !== selectedTokenAddress) {
      this.updateSendToken()
    }
  }

  componentDidMount () {
    this.props.fetchBasicGasEstimates()
      .then(() => {
        this.updateGas()
      })
  }

  componentWillMount () {
    this.updateSendToken()

    // Show QR Scanner modal  if ?scan=true
    if (window.location.search === '?scan=true') {
      this.props.scanQrCode()

      // Clear the queryString param after showing the modal
      const cleanUrl = location.href.split('?')[0]
      history.pushState({}, null, `${cleanUrl}`)
      window.location.hash = '#send'
    }
  }

  componentWillUnmount () {
    this.props.resetSendState()
  }

  onRecipientInputChange = query => {
    if (query) {
      this.dValidate(query)
    } else {
      this.validate(query)
    }

    this.setState({
      query,
    })
  }

  validate (query) {
    const {
      hasHexData,
      tokens,
      selectedToken,
      network,
    } = this.props

    if (!query) {
      return this.setState({ toError: '', toWarning: '' })
    }

    const toErrorObject = getToErrorObject(query, null, hasHexData, tokens, selectedToken, network)
    const toWarningObject = getToWarningObject(query, null, tokens, selectedToken)

    this.setState({
      toError: toErrorObject.to,
      toWarning: toWarningObject.to,
    })
  }

  updateSendToken () {
    const {
      from: { address },
      selectedToken,
      tokenContract,
      updateSendTokenBalance,
    } = this.props

    updateSendTokenBalance({
      selectedToken,
      tokenContract,
      address,
    })
  }

  updateGas ({ to: updatedToAddress, amount: value, data } = {}) {
    const {
      amount,
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken = {},
      to: currentToAddress,
      updateAndSetGasLimit,
    } = this.props

    updateAndSetGasLimit({
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken,
      to: getToAddressForGasUpdate(updatedToAddress, currentToAddress),
      value: value || amount,
      data,
    })
  }

  render () {
    const { history, to } = this.props
    let content

    if (to) {
      content = this.renderSendContent()
    } else {
      content = this.renderAddRecipient()
    }

    return (
      <div className="page-container">
        <SendHeader history={history} />
        { this.renderInput() }
        { content }
      </div>
    )
  }

  renderInput () {
    return (
      <EnsInput
        className="send__to-row"
        scanQrCode={_ => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Edit Screen',
              name: 'Used QR scanner',
            },
          })
          this.props.scanQrCode()
        }}
        onChange={this.onRecipientInputChange}
        onValidAddressTyped={(address) => this.props.updateSendTo(address, '')}
        onPaste={text => { this.props.updateSendTo(text) && this.updateGas() }}
        onReset={() => this.props.updateSendTo('', '')}
        updateEnsResolution={this.props.updateSendEnsResolution}
        updateEnsResolutionError={this.props.updateSendEnsResolutionError}
      />
    )
  }

  renderAddRecipient () {
    const { scanQrCode } = this.props
    const { toError, toWarning } = this.state

    return (
      <AddRecipient
        updateGas={({ to, amount, data } = {}) => this.updateGas({ to, amount, data })}
        scanQrCode={scanQrCode}
        query={this.state.query}
        toError={toError}
        toWarning={toWarning}
      />
    )
  }

  renderSendContent () {
    const { history, showHexData, scanQrCode } = this.props

    return [
      <SendContent
        key="send-content"
        updateGas={({ to, amount, data } = {}) => this.updateGas({ to, amount, data })}
        scanQrCode={scanQrCode}
        showHexData={showHexData}
      />,
      <SendFooter key="send-footer" history={history} />,
    ]
  }

}
