import { PureComponent } from 'react'
import ExternalSignModalContainer from './external-sign-modal-container'
import QrView from '../../qr-code'
import SendRowWrapper from '../../send/send-content/send-row-wrapper'
import TxInput from './tx-input.js'
import PageContainerFooter from '../../page-container/page-container-footer'
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Transaction = require('ethereumjs-tx')
const extend = require('xtend')

import {
  updateSignature,
} from '../../../ducks/confirm-transaction.duck'
import {
  showQrScanner,
  qrCodeDetected,
  hideModal,
  updateExternalSign,
  hideLoadingIndication,
} from '../../../actions'
import { CONFIRM_TRANSACTION_ROUTE } from '../../../routes'

const mapStateToProps = (state, ownProps) => {
  const { confirmTransaction } = state
  const {
    txData,
    signature,
  } = confirmTransaction
  const qrCodeData = state.appState.qrCodeData
  const props = state.appState.modal.modalState.props
  const signable = props.signable
  const qrTxData = reduce(signable)
  const extToSign = state.metamask.extToSign
  const extCancel = state.metamask.extCancel
  const extSigned = state.metamask.extSigned
  const showError = !!signature && signatureInError(signable, signature)
  var errorType
  var errors = {
    invalidSignatureLength: 'invalidSignatureLength',
    invalidSignature: 'invalidSignature',
    invalidSignatureChar: 'invalidSignatureChar',
  }
  if (signature.replace(/[^a-f0-9A-Fx]/g, '') !== signature) {
    errorType = 'invalidSignatureChar'
  } else if (ethUtil.stripHexPrefix(signature).length !== 130) {
    errorType = 'invalidSignatureLength'
  } else {
    errorType = showError ? 'invalidSignature' : null
  }
  const qrScanner = true // display qr scanner icon on input field
  return {
    errors,
    errorType,
    extCancel,
    extSigned,
    extToSign,
    qrCodeData,
    qrScanner,
    qrTxData,
    showError,
    signable,
    signature,
    txData,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onChange: (newSignature) => {
      dispatch(updateSignature(newSignature))
    },
    scanSignatureQrCode: (props) => {
        dispatch(showQrScanner(CONFIRM_TRANSACTION_ROUTE, props))
    },
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    onCancel: (extCancelCopy) => {
      dispatch(updateExternalSign({extCancel: extCancelCopy}))
      dispatch(hideModal())
    },
    onSubmit: (extSignedCopy) => {
      dispatch(updateExternalSign({extSigned: extSignedCopy}))
      dispatch(hideModal())
    },
    updateExternalSign: (update) => {
      dispatch(updateExternalSign(update))
    },
    hideLodingIndication: () => {
      dispatch(hideLoadingIndication())
    },
  }
}

class ExternalSignModal extends PureComponent {
  static propTypes = {
    errors: PropTypes.object,
    errorType: PropTypes.string,
    extCancel: PropTypes.array,
    extSigned: PropTypes.array,
    extToSign: PropTypes.array,
    hideLodingIndication: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    qrCodeData: PropTypes.object,
    qrCodeDetected: PropTypes.func,
    qrScanner: PropTypes.bool,
    qrTxData: PropTypes.string,
    scanSignatureQrCode: PropTypes.func,
    showError: PropTypes.bool,
    signable: PropTypes.object,
    signature: PropTypes.string,
    updateExternalSign: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }
  constructor (props) {
    super(props)
    this.state = { cancelOrSubmitPressed: false }
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.container = null

    this.setContainerRef = element => {
      this.container = element
    }
  }
  render () {
    const {
      errors,
      errorType,
      onChange,
      qrTxData,
      qrScanner,
      scanSignatureQrCode,
      showError,
      signable,
      signature,
    } = this.props

    return h(ExternalSignModalContainer, {hideModal: this.onCancel }, [
      h(QrView, {
        Qr: {
          data: qrTxData,
          width: Math.min(480, window.innerWidth - 70),
          isDataAddress: false,
        },
      }),
      h(SendRowWrapper, {
        label: this.context.t('signature'),
        errors: errors,
        errorType: errorType,
        showError: showError,
      }, [
        h(TxInput, {
          signature: signature,
          onChange: onChange,
          inError: showError,
          qrScanner: qrScanner,
          scanSignatureQrCode: scanSignatureQrCode,
          scannerProps: {showNext: 'EXTERNAL_SIGN', nextProps: {signable: signable} },
        }),
      ]),
      h(PageContainerFooter, {
        onCancel: this.onCancel,
        onSubmit: this.onSubmit,
        submitText: this.context.t('confirm'),
        disabled: showError || !signature,
      }),
    ])
  }

  onCancel () {
    this.setState({cancelOrSubmitPressed: true}, () => {
      const {extCancel, signable} = this.props
      this.extToSignUpdate()
      var extCancelCopy = extCancel.slice()
      extCancelCopy.push(signable)
      this.props.onCancel(extCancelCopy)
    })
  }

  onSubmit () {
    this.setState({cancelOrSubmitPressed: true}, () => {
      const {extSigned, signable, signature} = this.props
      var signableCopy = extend({}, signable)
      signableCopy.signature = signature
      var extSignedCopy = extSigned.slice()
      extSignedCopy.push(signableCopy)
      this.extToSignUpdate()
      this.props.onSubmit(extSignedCopy)
    })
  }

  extToSignUpdate () {
    const {extToSign, signable, updateExternalSign} = this.props
      var signables = extToSign.filter(sgn => sgn.id !== signable.id)
      updateExternalSign({extToSign: signables})
  }

  componentDidMount () {
    const {
      onChange,
      qrCodeData,
      qrCodeDetected,
    } = this.props
    if (qrCodeData && qrCodeData.type === 'signature') {
      onChange(qrCodeData.values.signature)
      qrCodeDetected(null)
    }
    this.props.hideLodingIndication()
  }

  componentWillUnmount () {
   if (!this.state.cancelOrSubmitPressed) {
     this.onCancel()
   }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalSignModal)

// converts hex encoded signature to r, s, v signature
function signatureHexToRSV (signature) {
  signature = ethUtil.stripHexPrefix(signature)
  const r = ethUtil.toBuffer('0x' + signature.substr(0, 64))
  const s = ethUtil.toBuffer('0x' + signature.substr(64, 64))
  const v = ethUtil.toBuffer('0x' + signature.substr(128, 2))
  return {r: r, s: s, v: v}
}

function signatureInError (signable, signature) {
  try {
    const {r, s, v} = signatureHexToRSV(signature)
    switch (signable.type) {
      case 'sign_transaction':
        const tx = new Transaction(signable.payload)
        tx.r = r
        tx.s = s
        tx.v = v
        return !tx.verifySignature()
      case 'sign_message':
        ethUtil.ecrecover(ethUtil.sha3(ethUtil.toBuffer(signable.payload)), ethUtil.bufferToInt(v), r, s)
        return false
      case 'sign_personal_message':
        ethUtil.ecrecover(ethUtil.hashPersonalMessage(ethUtil.toBuffer(signable.payload)), ethUtil.bufferToInt(v), r, s)
        return false
      case 'sign_typed_data':
        ethUtil.ecrecover(sigUtil.sign(signable.payload), ethUtil.bufferToInt(v), r, s)
        return false
    }
  } catch (e) {
    return true
  }
}

function reduce (signable) {
  const fromAddress = ethUtil.stripHexPrefix(signable.from)
  const partFrom = fromAddress.substr(0, 4) +
        fromAddress.substr(18, 2) + fromAddress.slice(-4)
  switch (signable.type) {
    case 'sign_message':
      return 'eths:/?m=' + partFrom + signable.payloadd
    case 'sign_personal_message':
      return 'eths:/?p=' + partFrom + signable.payload
    case 'sign_typed_data':
      return 'eths:/?y=' + partFrom + signable.payload
    case 'sign_transaction':
      const tx = signable.payload
      var chainId = tx.chainId
      var chainCode
      switch (chainId) {
        case 1:
          chainCode = 0
          break
        case 61:
          chainCode = 1
          break
        case 2:
          chainCode = 3 // Morden testnet
          break
        case 3:
          chainCode = 4
          break
        case 4:
          chainCode = 5
          break
        case 42:
          chainCode = 6
          break
        case 77:
          chainCode = 7
          break
        case 99:
          chainCode = 9
          break
        case 7762959:
          chainCode = 10
          break
        default:
          chainCode = 8
          break
      }
      var signingType = 0
      var signChainVersion = ethUtil.stripHexPrefix(ethUtil.intToHex(signingType * 4 + chainCode * 16))
      var flatStr = signChainVersion + partFrom
      flatStr += ethUtil.stripHexPrefix(tx.to)
      flatStr += chainCode === 8 ? chainId.toString() + '|' : ''
      flatStr += ethUtil.stripHexPrefix(tx.nonce) + '|'
      flatStr += ethUtil.stripHexPrefix(tx.gasPrice) + '|'
      flatStr += ethUtil.stripHexPrefix(tx.gasLimit) + '|'
      flatStr += ethUtil.stripHexPrefix(tx.value) + '|'
      flatStr += ethUtil.stripHexPrefix(tx.data)
      flatStr = flatStr.toLowerCase()

      // escape all '9' in flat string
      const numStr = flatStr
        .replace(/9/g, '99')
        .replace(/a/g, '90')
        .replace(/b/g, '91')
        .replace(/c/g, '92')
        .replace(/d/g, '93')
        .replace(/e/g, '94')
        .replace(/f/g, '95')
        .replace(/\|/g, '96')

      // zero compressing
      const zeroCompStr = numStr.replace(/0{48}/g, '975').replace(/0{24}/g, '974').replace(/0{12}/g, '973').replace(/0{6}/g, '972').replace(/0{5}/g, '971').replace(/0{4}/g, '970')
      var errorChk = ethUtil.stripHexPrefix(ethUtil.bufferToHex(ethUtil.sha3(ethUtil.toBuffer(zeroCompStr))).slice(-2))

      // error check
      errorChk = errorChk
        .replace(/9/g, '99')
        .replace(/a/g, '90')
        .replace(/b/g, '91')
        .replace(/c/g, '92')
        .replace(/d/g, '93')
        .replace(/e/g, '94')
        .replace(/f/g, '95')
      return 'eths:/?t=' + errorChk + zeroCompStr
  }
}
