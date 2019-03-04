import { PureComponent } from 'react'
import ExternalSignModalContainer from './external-sign-modal-container'
import QrView from '../../qr-code'
import SendRowWrapper from '../../send/send-content/send-row-wrapper'
import TxInput from './tx-input.js'
import PageContainerFooter from '../../page-container/page-container-footer'
import Select from 'react-select'
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
  const extToSign = state.metamask.extToSign
  const extCancel = state.metamask.extCancel
  const extSigned = state.metamask.extSigned
  const showError = !!signature && signatureInError(signable, signature)
  const signers = ['airsign', 'paritysigner', 'erc67']
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
    showError,
    signable,
    signature,
    txData,
    signers,
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
    signers: PropTypes.array,
  }

  static contextTypes = {
    t: PropTypes.func,
  }
  constructor (props) {
    super(props)
    this.state =
      {
        cancelOrSubmitPressed: false,
        scannerPressed: false,
        signer: 'airsign',
      }
    this.onCancel = this.onCancel.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.scanSignatureQrCode = this.scanSignatureQrCode.bind(this)
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
      qrScanner,
      showError,
      signable,
      signature,
      signers,
    } = this.props
    const signer = this.state.signer
    const qrTxData = reduce(signable, signer)

    return h(ExternalSignModalContainer, {hideModal: this.onCancel }, [
      h('div', {}, [
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
            scanSignatureQrCode: this.scanSignatureQrCode,
            scannerProps: {showNext: 'EXTERNAL_SIGN', nextProps: {signable: signable} },
          }),
        ]),
        h(SendRowWrapper, {
          label: this.context.t('signWith'),
        }, [
          h(Select, {
            className: 'new-account-import-form__select',
            name: 'import-type-select',
            styles: { menuPortal: base => ({ ...base, zIndex: 19999 }) },
            clearable: false,
            value: signer || signers[0],
            options: signers.map((signer) => {
              return {
                value: signer,
                label: this.context.t(signer),
              }
            }),
            onChange: (opt) => {
              this.setState({ signer: opt.value })
            },
          }),
        ]),
      ]),
      h(PageContainerFooter, {
        onCancel: this.onCancel,
        onSubmit: this.onSubmit,
        submitText: this.context.t('confirm'),
        disabled: showError || !signature,
      }),
    ])
  }

  scanSignatureQrCode (props) {
    this.setState({scannerPressed: true}, () => {
      this.props.scanSignatureQrCode(props)
    })
  }

  onCancel () {
    this.setState({cancelOrSubmitPressed: true}, () => {
      this.cancelConfirm()
    })
  }

  cancelConfirm () {
    const {extCancel, signable} = this.props
    this.extToSignUpdate()
    var extCancelCopy = extCancel.slice()
    extCancelCopy.push(signable)
    this.props.onCancel(extCancelCopy)
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
   if (!this.state.cancelOrSubmitPressed && !this.state.scannerPressed) {
     this.cancelConfirm()
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

function reduce (signable, signer) {
  if (signer === 'airsign') {
    const fromAddress = ethUtil.stripHexPrefix(signable.from)
    const partFrom = fromAddress.substr(0, 4) +
      fromAddress.substr(18, 2) + fromAddress.slice(-4)
    switch (signable.type) {
      case 'sign_message':
        return 'eths:/?m=' + partFrom + signable.payload
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

        const esc9 = flatStr.replace(/9/g, 'n')

        // zero compressing
        const zeroCompStr = esc9.replace(/0{48}/g, '975').replace(/0{24}/g, '974').replace(/0{12}/g, '973').replace(/0{6}/g, '972').replace(/0{5}/g, '971').replace(/0{4}/g, '970')

        // escape all '9' in flat string
        const numStr = zeroCompStr
          .replace(/n/g, '99')
          .replace(/a/g, '90')
          .replace(/b/g, '91')
          .replace(/c/g, '92')
          .replace(/d/g, '93')
          .replace(/e/g, '94')
          .replace(/f/g, '95')
          .replace(/\|/g, '96')

        var errorChk = ethUtil.stripHexPrefix(ethUtil.bufferToHex(ethUtil.sha3(ethUtil.toBuffer(numStr))).slice(-2))

        // error check
        errorChk = errorChk
          .replace(/9/g, '99')
          .replace(/a/g, '90')
          .replace(/b/g, '91')
          .replace(/c/g, '92')
          .replace(/d/g, '93')
          .replace(/e/g, '94')
          .replace(/f/g, '95')
        return 'eths:/?t=' + errorChk + numStr
    }
  } else if (signer === 'paritysigner') {
    switch (signable.type) {
      case 'sign_message':
        return '{"action":"signData","data":{"account":"' +
          ethUtil.stripHexPrefix(signable.from) +
          '","data":"' +
          ethUtil.stripHexPrefix(signable.payload) +
          '"}}'
      case 'sign_transaction':
        return '{"action":"signData","data":{"account":"' +
          ethUtil.stripHexPrefix(signable.from) +
          '","rlp":"' +
          ethUtil.stripHexPrefix(
            ethUtil.bufferToHex(
              ethUtil.rlp.encode([
                signable.payload.nonce,
                signable.payload.gasPrice,
                signable.payload.gasLimit,
                signable.payload.to,
                signable.payload.value,
                signable.payload.data,
                signable.payload.chainId,
                '', // r
                '', // s
          ]))) +
          '"}}'
      case 'sign_personal_message':
        return 'Personal messages are not supported by parity signer.'
      case 'sign_typed_data':
        return 'Typed data is not supported by parity signer.'
    }
  } else if (signer === 'erc67') {
    switch (signable.type) {
      case 'sign_message':
        return 'ethereum:?message=' + signable.payload + '&from=' + signable.from
      case 'sign_personal_message':
        return 'ethereum:?personalmessage=' + signable.payload + '&from=' + signable.from
      case 'sign_typed_data':
        return 'ethereum:?typeddata=' + encodeURIComponent(signable.payload) + '&from=' + signable.from
      case 'sign_transaction':
        return 'ethereum:' + signable.payload.to +
          '?from=' + signable.from +
          '&nonce=' + signable.payload.nonce +
          '&gasPrice=' + signable.payload.gasPrice +
          '&gasLimit=' + signable.payload.gasLimit +
          '&value=' + signable.payload.value +
          '&data=' + signable.payload.data
    }
  }
}
