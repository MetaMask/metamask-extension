const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const Tooltip = require('../../tooltip')

TxInput.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(TxInput)


inherits(TxInput, Component)
function TxInput () {
  Component.call(this)
}

TxInput.prototype.render = function () {
  const {
    signature,
    onChange,
    inError,
    qrScanner,
    scanSignatureQrCode,
    scannerProps,
  } = this.props

  return h('div.send-v2__to-autocomplete', {}, [

    h(`input.send-v2__to-autocomplete__input${qrScanner ? '.with-qr' : ''}`, {
      placeholder: this.context.t('signature'),
      className: inError ? `send-v2__error-border` : '',
      value: signature,
      onChange: event => onChange(event.target.value),
      style: {
        borderColor: inError ? 'red' : null,
      },
    }),
    qrScanner && h(Tooltip, {
      title: this.context.t('scanQrCode'),
      position: 'bottom',
    }, h(`i.fa.fa-qrcode.fa-lg.send-v2__to-autocomplete__qr-code`, {
      style: { color: '#33333' },
      onClick: () => scanSignatureQrCode(scannerProps),
    })),
  ])
}
