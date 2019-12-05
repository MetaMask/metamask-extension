const Component = require('react').Component
const h = require('react-hyperscript')
const qrCode = require('qrcode-generator')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const { isHexPrefixed } = require('ethereumjs-util')
const ReadOnlyInput = require('./readonly-input')
const { checksumAddress } = require('../../helpers/utils/util')

module.exports = connect(mapStateToProps)(QrCodeView)

function mapStateToProps (state) {
  return {
    // Qr code is not fetched from state. 'message' and 'data' props are passed instead.
    buyView: state.appState.buyView,
    warning: state.appState.warning,
  }
}

inherits(QrCodeView, Component)

function QrCodeView () {
  Component.call(this)
}

QrCodeView.prototype.render = function () {
  const props = this.props
  const { message, data, network } = props.Qr
  const address = `${isHexPrefixed(data) ? 'ethereum:' : ''}${checksumAddress(data, network)}`
  const qrImage = qrCode(4, 'M')
  qrImage.addData(address)
  qrImage.make()

  return h('.div.flex-column.flex-center', [
    Array.isArray(message)
      ? h('.message-container', this.renderMultiMessage())
      : message && h('.qr-header', message),

    this.props.warning ? this.props.warning && h('span.error.flex-center', {
      style: {
      },
    },
    this.props.warning) : null,

    h('.div.qr-wrapper', {
      style: {},
      dangerouslySetInnerHTML: {
        __html: qrImage.createTableTag(4),
      },
    }),
    h(ReadOnlyInput, {
      wrapperClass: 'ellip-address-wrapper',
      inputClass: 'qr-ellip-address',
      value: checksumAddress(data, network),
    }),
  ])
}

QrCodeView.prototype.renderMultiMessage = function () {
  var Qr = this.props.Qr
  var multiMessage = Qr.message.map((message) => h('.qr-message', message))
  return multiMessage
}
