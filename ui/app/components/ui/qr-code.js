import PropTypes from 'prop-types'
import React from 'react'
const qrCode = require('qrcode-generator')
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

function QrCodeView (props) {
  const { message, data } = props.Qr
  const address = `${isHexPrefixed(data) ? 'ethereum:' : ''}${checksumAddress(data)}`
  const qrImage = qrCode(4, 'M')
  qrImage.addData(address)
  qrImage.make()

  return (
    <div className="div flex-column flex-center">
      {
        Array.isArray(message)
          ? (
            <div className="message-container">
              {props.Qr.message.map((message, index) => (
                <div className="qr-message" key={index}>
                  {message}
                </div>
              ))}
            </div>
          )
          : message && (
            <div className="qr-header">
              {message}
            </div>
          )
      }
      {
        props.warning
          ? (props.warning && (
            <span className="error flex-center">
              {props.warning}
            </span>
          ))
          : null
      }
      <div
        className="div qr-wrapper"
        dangerouslySetInnerHTML={{
          __html: qrImage.createTableTag(4),
        }}
      />
      <ReadOnlyInput
        wrapperClass="ellip-address-wrapper"
        inputClass="qr-ellip-address"
        value={checksumAddress(data)}
      />
    </div>
  )
}

QrCodeView.propTypes = {
  warning: PropTypes.node,
  Qr: PropTypes.shape({
    message: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    data: PropTypes.string.isRequired,
  }).isRequired,
}
